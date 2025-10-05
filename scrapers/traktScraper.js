const axios = require('axios');

class TraktScraper {
  static async searchMovie(title) {
    try {
      const response = await axios.get(`https://api.trakt.tv/search/movie`, {
        params: {
          query: title
        },
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-key': process.env.TRAKT_API_KEY,
          'trakt-api-version': '2'
        }
      });

      if (response.data && response.data.length > 0) {
        const movie = response.data[0].movie;
        return await this.getMovieDetails(movie.ids.trakt);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no Trakt:', error.message);
      return null;
    }
  }

  static async getMovieDetails(id) {
    try {
      const response = await axios.get(`https://api.trakt.tv/movies/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-key': process.env.TRAKT_API_KEY,
          'trakt-api-version': '2'
        }
      });

      const data = response.data;

      return {
        title: data.title,
        year: data.year,
        genres: data.genres,
        rating_trakt: data.rating,
        plot: data.overview,
        runtime: data.runtime,
        trailer: data.trailer,
        homepage: data.homepage,
        poster: data.images ? data.images.poster : null,
        backdrop: data.images ? data.images.fanart : null
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no Trakt:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const response = await axios.get(`https://api.trakt.tv/search/person`, {
        params: {
          query: name
        },
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-key': process.env.TRAKT_API_KEY,
          'trakt-api-version': '2'
        }
      });

      if (response.data && response.data.length > 0) {
        const person = response.data[0].person;
        return await this.getPersonDetails(person.ids.trakt);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no Trakt:', error.message);
      return null;
    }
  }

  static async getPersonDetails(id) {
    try {
      const response = await axios.get(`https://api.trakt.tv/people/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-key': process.env.TRAKT_API_KEY,
          'trakt-api-version': '2'
        }
      });

      const data = response.data;

      return {
        name: data.name,
        biography: data.biography,
        birthday: data.birthday,
        deathday: data.deathday,
        birthplace: data.birthplace,
        homepage: data.homepage,
        image: data.images ? data.images.headshot : null
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no Trakt:', error.message);
      return null;
    }
  }
}

module.exports = TraktScraper;