const axios = require('axios');
const cheerio = require('cheerio');

class RottenTomatoesScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.search-page-movie-results-item a').first().attr('href');

      if (firstResult) {
        const movieUrl = `https://www.rottentomatoes.com${firstResult}`;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no Rotten Tomatoes:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('h1').first().text().trim();
      const year = $('.year').text().match(/\d{4}/)?.[0] || null;
      const criticsScore = $('.critics-score span').text().trim() || null;
      const audienceScore = $('.audience-score span').text().trim() || null;
      
      const genres = [];
      $('.genre-item').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const directors = [];
      $('.director a').each((i, el) => {
        directors.push($(el).text().trim());
      });

      const cast = [];
      $('.cast-item a').each((i, el) => {
        cast.push($(el).text().trim());
      });

      const plot = $('.movie-info .synopsis').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_rottentomatoes: criticsScore ? parseFloat(criticsScore.replace('%', '')) / 10 : null,
        rating_rottentomatoes_audience: audienceScore ? parseFloat(audienceScore.replace('%', '')) / 10 : null,
        director: directors,
        cast,
        plot,
        poster: null // Rotten Tomatoes não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no Rotten Tomatoes:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(name)}`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('.search-page-person-results-item a').first().attr('href');

      if (firstResult) {
        const personUrl = `https://www.rottentomatoes.com${firstResult}`;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no Rotten Tomatoes:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const name = $('h1').first().text().trim();
      const biography = $('.biography').text().trim() || null;

      const knownFor = [];
      $('.known-for a').each((i, el) => {
        knownFor.push($(el).text().trim());
      });

      return {
        name,
        full_name: name,
        biography,
        movies: knownFor
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no Rotten Tomatoes:', error.message);
      return null;
    }
  }
}

module.exports = RottenTomatoesScraper;