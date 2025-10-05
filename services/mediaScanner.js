// services/mediaScanner.js
const fs = require('fs');
const path = require('path');
const TMDbService = require('./tmdbService');
const config = require('../config/config');
const { db } = require('../database/init');

const tmdb = new TMDbService(config.tmdb.apiKey);

class MediaScanner {
    constructor() {
        this.supportedExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.ts', '.m2ts'];
    }

    // Extrai título e ano do nome do ficheiro
    extractTitleYearFromFilename(filename) {
        // Exemplo: "The Matrix 1999.mp4" -> "The Matrix", 1999
        // Exemplo: "Breaking.Bad.S01E01.mkv" -> "Breaking Bad", null (ou ano da série se for possível)
        const match = filename.match(/^(.+?)\s*(?:\(|\[)?(\d{4})\s*(?:\)|\])?/i);
        if (match) {
            return { title: match[1].replace(/\./g, ' ').trim(), year: parseInt(match[2]) };
        }
        // Para séries: "Show.Name.S01E01.mkv" -> "Show Name"
        const seriesMatch = filename.match(/^([^.]+)\./i);
        if (seriesMatch) {
            return { title: seriesMatch[1].replace(/\./g, ' ').trim(), year: null };
        }
        return { title: path.parse(filename).name.replace(/\./g, ' ').trim(), year: null };
    }

    // Varre um diretório recursivamente
    async scanDirectory(directory) {
        const files = [];
        const walk = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                } else if (this.supportedExtensions.includes(path.extname(fullPath).toLowerCase())) {
                    files.push(fullPath);
                }
            }
        };

        walk(directory);

        const results = [];
        for (const filePath of files) {
            const filename = path.basename(filePath);
            const { title, year } = this.extractTitleYearFromFilename(filename);

            // Tentar identificar se é filme ou série
            let mediaDetails = null;
            let mediaType = 'movie'; // Assume filme por defeito

            // Primeiro, tenta buscar como filme
            try {
                const movieResults = await tmdb.searchMovie(title);
                if (movieResults.length > 0) {
                    // Verificar se o ano corresponde (opcional)
                    const matchedMovie = movieResults.find(m => !year || (m.release_date && new Date(m.release_date).getFullYear() === year));
                    if (matchedMovie) {
                        mediaDetails = await tmdb.getMovieDetails(matchedMovie.tmdb_id);
                        mediaType = 'movie';
                    }
                }
            } catch (err) {
                console.error(`Erro ao buscar "${title}" como filme:`, err.message);
            }

            // Se não encontrou como filme, tenta como série
            if (!mediaDetails) {
                try {
                    const tvResults = await tmdb.searchTV(title);
                    if (tvResults.length > 0) {
                        // Verificar se o ano corresponde (opcional)
                        const matchedTV = tvResults.find(t => !year || (t.first_air_date && new Date(t.first_air_date).getFullYear() === year));
                        if (matchedTV) {
                            mediaDetails = await tmdb.getTVDetails(matchedTV.tmdb_id);
                            mediaType = 'tv';
                        }
                    }
                } catch (err) {
                    console.error(`Erro ao buscar "${title}" como série:`, err.message);
                }
            }

            if (mediaDetails) {
                // 1. Inserir ou ignorar mídia principal
                const mediaStmt = db.prepare(`
                    INSERT OR IGNORE INTO media_items (tmdb_id, media_type, title, original_title, overview, release_date, poster_path, backdrop_path, runtime, genres, trailer_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                mediaStmt.run(
                    mediaDetails.tmdb_id,
                    mediaDetails.media_type,
                    mediaDetails.title,
                    mediaDetails.original_title,
                    mediaDetails.overview,
                    mediaDetails.release_date,
                    mediaDetails.poster_path,
                    mediaDetails.backdrop_path,
                    mediaDetails.runtime,
                    mediaDetails.genres,
                    mediaDetails.trailer_url
                );

                const localMediaId = db.prepare(`SELECT id FROM media_items WHERE tmdb_id = ?`).get(mediaDetails.tmdb_id).id;

                // 2. Inserir detalhes específicos (série)
                if (mediaType === 'tv') {
                    const seriesStmt = db.prepare(`
                        INSERT OR IGNORE INTO tv_series (id, number_of_seasons, number_of_episodes, status)
                        VALUES (?, ?, ?, ?)
                    `);
                    seriesStmt.run(
                        localMediaId,
                        mediaDetails.number_of_seasons,
                        mediaDetails.number_of_episodes,
                        mediaDetails.status
                    );

                    // 3. Inserir temporadas e episódios
                    for (let season = 1; season <= mediaDetails.number_of_seasons; season++) {
                        try {
                            const seasonDetails = await tmdb.getTVSeasonDetails(mediaDetails.tmdb_id, season);
                            if (seasonDetails) {
                                const seasonStmt = db.prepare(`
                                    INSERT OR IGNORE INTO seasons (tmdb_id, media_item_id, season_number, name, overview, air_date, episode_count)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                `);
                                seasonStmt.run(
                                    seasonDetails.id,
                                    localMediaId,
                                    season,
                                    seasonDetails.name,
                                    seasonDetails.overview,
                                    seasonDetails.air_date,
                                    seasonDetails.episodes.length
                                );

                                const localSeasonId = db.prepare(`SELECT id FROM seasons WHERE tmdb_id = ? AND media_item_id = ?`).get(seasonDetails.id, localMediaId).id;

                                for (const ep of seasonDetails.episodes) {
                                    const episodeStmt = db.prepare(`
                                        INSERT OR IGNORE INTO episodes (tmdb_id, season_id, episode_number, title, overview, still_path, runtime, air_date)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                    `);
                                    episodeStmt.run(
                                        ep.id,
                                        localSeasonId,
                                        ep.episode_number,
                                        ep.name,
                                        ep.overview,
                                        ep.still_path ? config.tmdb.imageBaseUrl + ep.still_path : null,
                                        ep.runtime,
                                        ep.air_date
                                    );
                                }
                            }
                        } catch (err) {
                            console.error(`Erro ao buscar temporada ${season} da série ${mediaDetails.tmdb_id}:`, err.message);
                        }
                    }
                }

                // 4. Inserir pessoas e suas relações com a mídia
                try {
                    const credits = await tmdb.getMovieCredits(mediaDetails.tmdb_id, mediaType); // Assumindo que a TMDB tem uma função para isso
                    // Esta função deve retornar { cast: [...], crew: [...] }
                    if (credits && credits.cast) {
                        for (const person of credits.cast) {
                            // Inserir pessoa
                            const personStmt = db.prepare(`
                                INSERT OR IGNORE INTO people (tmdb_id, name, profile_path, biography, birth_date, death_date)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `);
                            personStmt.run(
                                person.id,
                                person.name,
                                person.profile_path ? config.tmdb.imageBaseUrl + person.profile_path : null,
                                person.biography || null,
                                person.birthday || null,
                                person.deathday || null
                            );

                            const localPersonId = db.prepare(`SELECT id FROM people WHERE tmdb_id = ?`).get(person.id).id;

                            // Inserir relação
                            const mediaPersonStmt = db.prepare(`
                                INSERT OR IGNORE INTO media_people (media_item_id, person_id, role, character_name, order_index)
                                VALUES (?, ?, ?, ?, ?)
                            `);
                            mediaPersonStmt.run(
                                localMediaId,
                                localPersonId,
                                'actor', // ou 'director', etc.
                                person.character || null,
                                person.order
                            );
                        }
                    }
                    if (credits && credits.crew) {
                        for (const person of credits.crew) {
                            const personStmt = db.prepare(`
                                INSERT OR IGNORE INTO people (tmdb_id, name, profile_path, biography, birth_date, death_date)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `);
                            personStmt.run(
                                person.id,
                                person.name,
                                person.profile_path ? config.tmdb.imageBaseUrl + person.profile_path : null,
                                person.biography || null,
                                person.birthday || null,
                                person.deathday || null
                            );

                            const localPersonId = db.prepare(`SELECT id FROM people WHERE tmdb_id = ?`).get(person.id).id;

                            const mediaPersonStmt = db.prepare(`
                                INSERT OR IGNORE INTO media_people (media_item_id, person_id, role, character_name, order_index)
                                VALUES (?, ?, ?, ?, ?)
                            `);
                            mediaPersonStmt.run(
                                localMediaId,
                                localPersonId,
                                person.job.toLowerCase().includes('director') ? 'director' : person.job.toLowerCase().includes('writer') ? 'writer' : 'crew',
                                null, // character_name não aplicável
                                person.order || null
                            );
                        }
                    }
                } catch (err) {
                    console.error(`Erro ao buscar créditos para ${mediaDetails.tmdb_id}:`, err.message);
                }

                // 5. Adicionar à coleção com caminho do ficheiro
                const collectionStmt = db.prepare(`
                    INSERT INTO collection_items (media_item_id, file_path, format, watched_status)
                    VALUES (?, ?, ?, ?)
                `);
                collectionStmt.run(localMediaId, filePath, path.extname(filePath).toUpperCase().substring(1), 'pending');

                results.push({ filePath, title, year, tmdbId: mediaDetails.tmdb_id, type: mediaType, status: '✅ Adicionado' });
            } else {
                results.push({ filePath, title, year, tmdbId: null, type: null, status: '❌ Não encontrado na TMDB' });
            }
        }

        return results;
    }
}

module.exports = MediaScanner;