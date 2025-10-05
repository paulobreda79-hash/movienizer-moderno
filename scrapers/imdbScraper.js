const axios = require('axios');
const cheerio = require('cheerio');

class IMDBScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title)}&s=tt`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('td.result_text a').first().attr('href');

      if (firstResult) {
        const movieUrl = `https://www.imdb.com${firstResult}`;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no IMDB:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados
      const title = $('h1').first().text().trim();
      const year = $('.sc-8c31wf-0').text().match(/\d{4}/)?.[0] || null;
      const rating = $('.sc-bde20123-3').text().trim() || null;
      const genres = [];
      $('.ipc-chip-list__scroller a').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const director = [];
      $('.sc-54924a2e-10 a').each((i, el) => {
        director.push($(el).text().trim());
      });

      const cast = [];
      $('.title-cast-item a').each((i, el) => {
        cast.push($(el).text().trim());
      });

      const plot = $('.sc-15baf78a-0').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        rating_imdb: parseFloat(rating),
        genres,
        director,
        cast,
        plot,
        poster: null // IMDB não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no IMDB:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(name)}&s=nm`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('td.result_text a').first().attr('href');

      if (firstResult) {
        const personUrl = `https://www.imdb.com${firstResult}`;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no IMDB:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const name = $('h1').first().text().trim();
      const birthDate = $('.sc-8c31wf-0').text().match(/\d{4}/)?.[0] || null;
      const biography = $('.sc-15baf78a-0').text().trim() || null;

      const knownFor = [];
      $('.knownfor-title a').each((i, el) => {
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
      console.error('Erro ao obter detalhes da pessoa no IMDB:', error.message);
      return null;
    }
  }
}

module.exports = IMDBScraper;