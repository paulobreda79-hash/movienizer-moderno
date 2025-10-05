const axios = require('axios');
const cheerio = require('cheerio');

class AdoroCinemaScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://www.adorocinema.com/filmes/busca/?q=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.entity-title a').first().attr('href');

      if (firstResult) {
        const movieUrl = firstResult;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no AdoroCinema:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('.title-bar h1').text().trim();
      const year = $('.year').text().trim() || null;
      const rating = $('.sterra').text().trim() || null;
      
      const genres = [];
      $('.meta-body-info a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/genero/')) {
          genres.push($(el).text().trim());
        }
      });

      const directors = [];
      $('.meta-body-info a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/diretor/')) {
          directors.push($(el).text().trim());
        }
      });

      const cast = [];
      $('.meta-body-info a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/ator/')) {
          cast.push($(el).text().trim());
        }
      });

      const plot = $('.content-txt p').first().text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_adorocinema: parseFloat(rating),
        director: directors,
        cast,
        plot,
        poster: null // AdoroCinema não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no AdoroCinema:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://www.adorocinema.com/pessoas/busca/?q=${encodeURIComponent(name)}`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('.entity-title a').first().attr('href');

      if (firstResult) {
        const personUrl = firstResult;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no AdoroCinema:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const name = $('.title-bar h1').text().trim();
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
      console.error('Erro ao obter detalhes da pessoa no AdoroCinema:', error.message);
      return null;
    }
  }
}

module.exports = AdoroCinemaScraper;