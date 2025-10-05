const axios = require('axios');

class TVTimeScraper {
  static async searchSeries(title) {
    try {
      // TV Time não tem API pública, então usaremos scraping
      const searchUrl = `https://www.tvtime.com/search?q=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('.search-result a').first().attr('href');

      if (firstResult) {
        const seriesUrl = `https://www.tvtime.com${firstResult}`;
        return await this.getSeriesDetails(seriesUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar série no TV Time:', error.message);
      return null;
    }
  }

  static async getSeriesDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados da série
      const title = $('.series-title').text().trim();
      const year = $('.year').text().match(/\d{4}/)?.[0] || null;
      const rating = $('.rating').text().trim() || null;

      const genres = [];
      $('.genre').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const plot = $('.description').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        genres,
        rating_tvtime: parseFloat(rating),
        plot,
        poster: null // TV Time não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da série no TV Time:', error.message);
      return null;
    }
  }
}

module.exports = TVTimeScraper;