// services/tmdbService.js - Versão ESM com export default

import axios from 'axios';

class TMDbService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.themoviedb.org/3';
        this.imageBaseURL = 'https://image.tmdb.org/t/p/w500';
    }

    async searchMovie(title) {
        try {
            const response = await axios.get(`${this.baseURL}/search/movie`, {
                params: {
                    api_key: this.apiKey,
                    query: title,
                    language: 'pt-PT',
                    page: 1
                }
            });
            return response.data.results.map(movie => ({
                id: movie.id,
                title: movie.title,
                original_title: movie.original_title,
                release_date: movie.release_date,
                poster_path: movie.poster_path ? `${this.imageBaseURL}${movie.poster_path}` : null,
                backdrop_path: movie.backdrop_path ? `${this.imageBaseURL}${movie.backdrop_path}` : null,
                overview: movie.overview,
                vote_average: movie.vote_average,
                vote_count: movie.vote_count,
                genre_ids: movie.genre_ids
            }));
        } catch (error) {
            console.error('❌ Erro na busca de filmes:', error.response?.data || error.message);
            throw new Error('Falha na comunicação com TMDB');
        }
    }

    async getMovieDetails(tmdbId) {
        try {
            const response = await axios.get(`${this.baseURL}/movie/${tmdbId}`, {
                params: {
                    api_key: this.apiKey,
                    language: 'pt-PT',
                    append_to_response: 'credits,videos'
                }
            });
            return this.formatMovieData(response.data);
        } catch (error) {
            console.error('❌ Erro ao obter detalhes do filme:', error.response?.data || error.message);
            throw new Error('Filme não encontrado');
        }
    }

    formatMovieData(movieData) {
        return {
            tmdb_id: movieData.id,
            media_type: 'movie',
            title: movieData.title,
            original_title: movieData.original_title,
            overview: movieData.overview,
            release_date: movieData.release_date,
            poster_path: movieData.poster_path,
            backdrop_path: movieData.backdrop_path,
            runtime: movieData.runtime,
            vote_average: movieData.vote_average,
            vote_count: movieData.vote_count,
            status: movieData.status,
            genres: movieData.genres,
            cast: movieData.credits?.cast.slice(0, 10) || [],
            director: movieData.credits?.crew.find(person => person.job === 'Director')?.name || null,
            trailer: movieData.videos?.results.find(video => video.type === 'Trailer' && video.site === 'YouTube')?.key || null
        };
    }

    async getGenres() {
        try {
            const response = await axios.get(`${this.baseURL}/genre/movie/list`, {
                params: {
                    api_key: this.apiKey,
                    language: 'pt-PT'
                }
            });
            return response.data.genres;
        } catch (error) {
            console.error('❌ Erro ao buscar géneros:', error);
            return [];
        }
    }
}

// Exportar a classe como default
export default TMDbService;