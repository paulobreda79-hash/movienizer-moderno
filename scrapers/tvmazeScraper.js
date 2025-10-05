const axios = require('axios');

class TVMazeScraper {
  static async searchSeries(title) {
    try {
      const response = await axios.get(`http://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`);

      if (response.data && response.data.length > 0) {
        const show = response.data[0].show;
        return await this.getSeriesDetails(show.id);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar série no TVMaze:', error.message);
      return null;
    }
  }

  static async getSeriesDetails(id) {
    try {
      const response = await axios.get(`http://api.tvmaze.com/shows/${id}`);

      const data = response.data;

      return {
        title: data.name,
        year: data.premiered ? parseInt(data.premiered.split('-')[0]) : null,
        genres: data.genres,
        rating_tvmaze: data.rating ? data.rating.average : null,
        plot: data.summary ? data.summary.replace(/<[^>]*>/g, '') : null,
        poster: data.image ? data.image.medium : null,
        backdrop: data.image ? data.image.original : null,
        runtime: data.runtime,
        status: data.status,
        network: data.network ? data.network.name : null
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da série no TVMaze:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const response = await axios.get(`http://api.tvmaze.com/search/people?q=${encodeURIComponent(name)}`);

      if (response.data && response.data.length > 0) {
        const person = response.data[0].person;
        return await this.getPersonDetails(person.id);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no TVMaze:', error.message);
      return null;
    }
  }

  static async getPersonDetails(id) {
    try {
      const response = await axios.get(`http://api.tvmaze.com/people/${id}`);

      const data = response.data;

      return {
        name: data.name,
        birthday: data.birthday,
        deathday: data.deathday,
        birthplace: data.country ? data.country.name : null,
        image: data.image ? data.image.medium : null
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no TVMaze:', error.message);
      return null;
    }
  }
}

module.exports = TVMazeScraper;