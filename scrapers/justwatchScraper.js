const axios = require('axios');

class JustWatchScraper {
  static async getStreamingAvailability(title) {
    try {
      const response = await axios.post('https://apis.justwatch.com/content/titles/en_US/popular', {
        query: title,
        content_types: ['movie', 'show'],
        page_size: 1,
        page: 1
      });

      if (response.data && response.data.items && response.data.items.length > 0) {
        const item = response.data.items[0];
        
        return {
          title: item.title,
          year: item.original_release_year,
          offers: item.offers ? item.offers.map(offer => ({
            platform: offer.provider_id,
            link: offer.urls ? offer.urls.standard_web : null
          })) : [],
          poster: item.poster_url
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar disponibilidade no JustWatch:', error.message);
      return null;
    }
  }
}

module.exports = JustWatchScraper;