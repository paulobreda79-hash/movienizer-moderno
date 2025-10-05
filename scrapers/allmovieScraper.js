const axios = require('axios');
const cheerio = require('cheerio');

class AllMovieScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://www.allmovie.com/search/all/${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.results-list .result-item a').first().attr('href');

      if (firstResult) {
        const movieUrl = `https://www.allmovie.com${firstResult}`;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no AllMovie:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('.movie-title').text().trim();
      const year = $('.release-date').text().match(/\d{4}/)?.[0] || null;
      const genres = [];
      $('.genre-list a').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const rating = $('.rating').text().trim() || null;
      const directors = [];
      $('.director a').each((i, el) => {
        directors.push($(el).text().trim());
      });

      const cast = [];
      $('.cast-list a').each((i, el) => {
        cast.push($(el).text().trim());
      });

      const plot = $('.plot-summary').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_allmovie: parseFloat(rating),
        director: directors,
        cast,
        plot,
        poster: null // AllMovie não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no AllMovie:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://www.allmovie.com/search/all/${encodeURIComponent(name)}`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('.results-list .result-item a').first().attr('href');

      if (firstResult) {
        const personUrl = `https://www.allmovie.com${firstResult}`;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no AllMovie:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const name = $('.person-name').text().trim();
      const birthDate = $('.birth-date').text().trim() || null;
      const biography = $('.biography').text().trim() || null;

      const knownFor = [];
      $('.known-for a').each((i, el) => {
        knownFor.push($(el).text().trim());
      });

      return {
        name,
        full_name: name,
        birth_date: birthDate,
        role: ['Ator'], // Padrão, pode ser melhorado
        biography,
        movies: knownFor
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no AllMovie:', error.message);
      return null;
    }
  }
}

module.exports = AllMovieScraper;