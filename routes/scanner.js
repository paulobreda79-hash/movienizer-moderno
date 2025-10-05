// routes/scanner.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../database/init');
const TMDbService = require('../services/tmdbService');
const config = require('../config/config');

const tmdb = new TMDbService(config.tmdb.apiKey);

// Função para extrair título e ano de um nome de ficheiro
function extractTitleYearFromFilename(filename) {
    // Exemplo: "The Matrix 1999 1080p.mkv" -> "The Matrix", 1999
    // Exemplo: "Breaking.Bad.S01E01.mkv" -> "Breaking Bad", null (ou primeiro ano da série, se tiver)
    const movieMatch = filename.match(/^(.+?)\s*(?:\(|\[)?(\d{4})\s*(?:\)|\])?/i);
    if (movieMatch) {
        return { title: movieMatch[1].trim(), year: parseInt(movieMatch[2]) };
    }

    // Tentar identificar séries (ex: S01E01)
    const seriesMatch = filename.match(/^(.+?)[\s._-]*S\d+[\s._-]*E\d+/i);
    if (seriesMatch) {
        // Remover "S01E01" e afins para obter o título
        let cleanTitle = seriesMatch[1].replace(/\./g, ' ').trim();
        // Remover possíveis anos que possam estar no título
        cleanTitle = cleanTitle.replace(/\s*\(\d{4}\)/, '').replace(/\s*\[\d{4}\]/, '').trim();
        return { title: cleanTitle, year: null };
    }

    // Caso contrário, usar o nome base
    return { title: path.parse(filename).name.replace(/\./g, ' ').trim(), year: null };
}

// POST /api/scanner/scan
router.post('/scan', async (req, res) => {
    const { directory } = req.body;

    if (!directory || !fs.existsSync(directory)) {
        return res.status(400).json({ error: 'Diretório inválido ou inexistente.' });
    }

    const supportedExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.ts', '.m2ts'];
    const files = [];
    const walk = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walk(fullPath);
            } else if (supportedExtensions.includes(path.extname(fullPath).toLowerCase())) {
                files.push(fullPath);
            }
        }
    };

    try {
        walk(directory);
        const results = [];

        for (const filePath of files) {
            const filename = path.basename(filePath);
            const { title, year } = extractTitleYearFromFilename(filename);

            // Buscar detalhes na TMDB
            let details = null;
            try {
                // Primeiro, tentar buscar como filme
                let searchResults = await tmdb.searchMovie(title);
                if (searchResults.length === 0) {
                    // Se não encontrar, tentar como série (se o nome do ficheiro indicar série)
                    if (filename.toLowerCase().includes('s') && filename.toLowerCase().includes('e')) {
                        searchResults = await tmdb.searchTV(title);
                    }
                }

                if (searchResults.length > 0) {
                    // Escolher o resultado mais próximo (pode ser melhorado com lógica de matching)
                    details = searchResults[0];
                }
            } catch (err) {
                console.error(`Erro ao buscar "${title}" na TMDB:`, err);
            }

            if (details) {
                // Inserir ou ignorar na tabela media_items
                const mediaStmt = db.prepare(`
                    INSERT OR IGNORE INTO media_items (tmdb_id, media_type, title, original_title, overview, release_date, poster_path, backdrop_path, runtime, genres)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                mediaStmt.run(
                    details.tmdb_id,
                    details.media_type,
                    details.title,
                    details.original_title,
                    details.overview,
                    details.release_date,
                    details.poster_path,
                    details.backdrop_path,
                    details.runtime,
                    details.genres
                );

                // Obter o ID local (mesmo que já exista)
                const localIdResult = db.prepare(`SELECT id FROM media_items WHERE tmdb_id = ?`).get(details.tmdb_id);
                const localId = localIdResult ? localIdResult.id : null;

                if (localId) {
                    // Inserir ou ignorar na coleção
                    const collectionStmt = db.prepare(`
                        INSERT OR IGNORE INTO collection_items (media_item_id, file_path, format)
                        VALUES (?, ?, ?)
                    `);
                    collectionStmt.run(localId, filePath, path.extname(filePath).toUpperCase().substring(1));
                }
            }

            results.push({
                filePath,
                filename,
                extracted_title: title,
                extracted_year: year,
                found_tmdb: !!details,
                tmdb_title: details ? details.title : null,
                tmdb_id: details ? details.tmdb_id : null
            });
        }

        res.json({
            message: `Varredura concluída. ${results.length} ficheiros processados.`,
            results
        });
    } catch (error) {
        console.error('Erro ao varrer diretório:', error);
        res.status(500).json({ error: 'Erro ao varrer diretório.' });
    }
});

// GET /api/scanner/status (opcional - para verificar o progresso)
// Esta funcionalidade é mais complexa e pode exigir armazenamento de estado de varredura.
// Por agora, apenas confirmamos que a rota existe.
router.get('/status', (req, res) => {
    res.json({ status: 'Operacional', message: 'Scanner está pronto para varreduras.' });
});

module.exports = router;