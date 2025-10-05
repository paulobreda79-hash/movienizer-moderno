const axios = require('axios');

class FanartScraper {
  static async getArtwork(title) {
    try {
      // Fanart.tv API
      const response = await axios.get(`https://webservice.fanart.tv/v3/movies/${encodeURIComponent(title)}`, {
        headers: {
          'api-key': process.env.FANART_API_KEY
        }
      });

      const data = response.data;

      return {
        poster: data.movieposter ? data.movieposter[0].url : null,
        backdrop: data.moviebackground ? data.moviebackground[0].url : null,
        logo: data.hdmovieclearart ? data.hdmovieclearart[0].url : null,
        thumb: data.movielogo ? data.movielogo[0].url : null
      };
    } catch (error) {
      console.error('Erro ao buscar artwork no Fanart.tv:', error.message);
      return null;
    }
  }

  static async getSeriesArtwork(title) {
    try {
      const response = await axios.get(`https://webservice.fanart.tv/v3/tv/${encodeURIComponent(title)}`, {
        headers: {
          'api-key': process.env.FANART_API_KEY
        }
      });

      const data = response.data;

      return {
        poster: data.tvposter ? data.tvposter[0].url : null,
        backdrop: data.showbackground ? data.showbackground[0].url : null,
        logo: data.hdtvlogo ? data.hdtvlogo[0].url : null,
        thumb: data.tvthumb ? data.tvthumb[0].url : null
      };
    } catch (error) {
      console.error('Erro ao buscar artwork de série no Fanart.tv:', error.message);
      return null;
    }
  }
}

module.exports = FanartScraper;