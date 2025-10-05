const axios = require('axios');
const cheerio = require('cheerio');

class LetterboxdScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://letterboxd.com/search/films/${encodeURIComponent(title)}/`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.film-detail a').first().attr('href');

      if (firstResult) {
        const movieUrl = `https://letterboxd.com${firstResult}`;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no Letterboxd:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('h1').text().trim();
      const year = $('.releaseyear a').text().trim() || null;
      const rating = $('.average-rating .rating').text().trim() || null;
      
      const genres = [];
      $('.text-sluglist a').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const directors = [];
      $('.director a').each((i, el) => {
        directors.push($(el).text().trim());
      });

      const plot = $('.film-summary .body-text').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_letterboxd: parseFloat(rating),
        director: directors,
        plot,
        poster: null // Letterboxd não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no Letterboxd:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://letterboxd.com/search/people/${encodeURIComponent(name)}/`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('.person-film a').first().attr('href');

      if (firstResult) {
        const personUrl = `https://letterboxd.com${firstResult}`;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no Letterboxd:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const name = $('h1').text().trim();
      const biography = $('.bio').text().trim() || null;

      const knownFor = [];
      $('.filmography a').each((i, el) => {
        knownFor.push($(el).text().trim());
      });

      return {
        name,
        full_name: name,
        biography,
        movies: knownFor
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no Letterboxd:', error.message);
      return null;
    }
  }
}

module.exports = LetterboxdScraper;