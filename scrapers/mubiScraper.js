const axios = require('axios');
const cheerio = require('cheerio');

class MUBIScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://mubi.com/search?q=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.film-tile a').first().attr('href');

      if (firstResult) {
        const movieUrl = `https://mubi.com${firstResult}`;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no MUBI:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('.film-title').text().trim();
      const year = $('.year').text().match(/\d{4}/)?.[0] || null;
      const rating = $('.rating').text().trim() || null;

      const genres = [];
      $('.genre').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const directors = [];
      $('.director').each((i, el) => {
        directors.push($(el).text().trim());
      });

      const plot = $('.description').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_mubi: parseFloat(rating),
        director: directors,
        plot,
        poster: null // MUBI não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no MUBI:', error.message);
      return null;
    }
  }
}

module.exports = MUBIScraper;