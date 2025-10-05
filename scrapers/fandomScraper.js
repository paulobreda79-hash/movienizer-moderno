const axios = require('axios');
const cheerio = require('cheerio');

class FandomScraper {
  static async searchMovie(title) {
    try {
      // Fandom não tem API pública, então usaremos scraping
      const searchUrl = `https://fandom.com/wiki/Special:Search?query=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.result-title a').first().attr('href');

      if (firstResult) {
        const movieUrl = firstResult;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no Fandom:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados do filme
      const title = $('h1').first().text().trim();
      const plot = $('.mw-parser-output p').first().text().trim() || null;

      const infobox = {};
      $('.infobox tr').each((i, el) => {
        const key = $(el).find('th').text().trim();
        const value = $(el).find('td').text().trim();
        if (key && value) {
          infobox[key.toLowerCase()] = value;
        }
      });

      return {
        title,
        plot,
        infobox
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no Fandom:', error.message);
      return null;
    }
  }
}

module.exports = FandomScraper;