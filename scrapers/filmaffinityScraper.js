const axios = require('axios');
const cheerio = require('cheerio');

class FilmAffinityScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://www.filmaffinity.com/en/search.php?stype=title&stext=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.movie-title a').first().attr('href');

      if (firstResult) {
        const movieUrl = firstResult;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no FilmAffinity:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('.movie-title').text().trim();
      const year = $('.year').text().match(/\d{4}/)?.[0] || null;
      const rating = $('.rating').text().trim() || null;

      const genres = [];
      $('.genre a').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const directors = [];
      $('.director a').each((i, el) => {
        directors.push($(el).text().trim());
      });

      const cast = [];
      $('.cast a').each((i, el) => {
        cast.push($(el).text().trim());
      });

      const plot = $('.plot').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_filmaffinity: parseFloat(rating),
        director: directors,
        cast,
        plot,
        poster: null // FilmAffinity não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no FilmAffinity:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://www.filmaffinity.com/en/search.php?stype=cast&stext=${encodeURIComponent(name)}`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('.person-title a').first().attr('href');

      if (firstResult) {
        const personUrl = firstResult;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no FilmAffinity:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const name = $('.person-title').text().trim();
      const biography = $('.biography').text().trim() || null;

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
      console.error('Erro ao obter detalhes da pessoa no FilmAffinity:', error.message);
      return null;
    }
  }
}

module.exports = FilmAffinityScraper;