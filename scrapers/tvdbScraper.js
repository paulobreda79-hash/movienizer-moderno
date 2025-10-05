const axios = require('axios');

class TVDBScraper {
  static async searchSeries(title) {
    try {
      // TVDB API v4 (requer API key)
      const apiKey = process.env.TVDB_API_KEY;
      const response = await axios.get(`https://api4.themoviedb.org/3/search/series`, {
        params: {
          api_key: process.env.TMDB_API_KEY || 'your_tmdb_key', // TVDB usa TMDB
          query: title
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        return await this.getSeriesDetails(firstResult.id);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar série no TVDB:', error.message);
      return null;
    }
  }

  static async getSeriesDetails(id) {
    try {
      const response = await axios.get(`https://api4.themoviedb.org/3/tv/${id}`, {
        params: {
          api_key: process.env.TMDB_API_KEY || 'your_tmdb_key'
        }
      });

      const data = response.data;

      return {
        title: data.name,
        year: data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : null,
        genres: data.genres ? data.genres.map(g => g.name) : [],
        rating_tvdb: data.vote_average,
        plot: data.overview,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da série no TVDB:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const response = await axios.get(`https://api4.themoviedb.org/3/search/person`, {
        params: {
          api_key: process.env.TMDB_API_KEY || 'your_tmdb_key',
          query: name
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        return await this.getPersonDetails(firstResult.id);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no TVDB:', error.message);
      return null;
    }
  }

  static async getPersonDetails(id) {
    try {
      const response = await axios.get(`https://api4.themoviedb.org/3/person/${id}`, {
        params: {
          api_key: process.env.TMDB_API_KEY || 'your_tmdb_key'
        }
      });

      const data = response.data;

      return {
        name: data.name,
        full_name: data.name,
        birth_date: data.birthday,
        biography: data.biography,
        image: data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : null,
        movies: [] // Pode ser preenchido com credits
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no TVDB:', error.message);
      return null;
    }
  }
}

module.exports = TVDBScraper;