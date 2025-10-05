// justwatchService.js

const axios = require('axios');
const streamingConfig = require('../config/streamingConfig');
const StreamingUtils = require('../utils/streamingUtils');

class JustWatchService {
  constructor() {
    this.apiBaseUrl = streamingConfig.justwatch.apiUrl;
    this.locale = streamingConfig.justwatch.locale;
    this.country = streamingConfig.justwatch.country;
    this.userAgent = streamingConfig.justwatch.userAgent;
    this.enabledPlatforms = this.getEnabledPlatforms();
  }

  getEnabledPlatforms() {
    return Object.entries(streamingConfig.platforms)
      .filter(([id, platform]) => platform.enabled)
      .map(([id, platform]) => platform.id);
  }

  async searchTitle(title, year = null) {
    try {
      // Verificar conexão com internet
      const hasInternet = await StreamingUtils.checkInternetConnection();
      if (!hasInternet) {
        throw new Error('Sem conexão com a internet');
      }

      const searchParams = {
        query: title,
        content_types: ['movie', 'show'],
        page_size: 5,
        page: 1
      };

      if (year) {
        searchParams.release_year_from = year;
        searchParams.release_year_until = year;
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/content/titles/${this.locale}/popular`,
        searchParams,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.items && response.data.items.length > 0) {
        return response.data.items[0]; // Retornar o primeiro resultado
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar título no JustWatch:', error.message);
      throw error;
    }
  }

  async getStreamingAvailability(title, year = null, platforms = null) {
    try {
      // Gerar chave de cache
      const selectedPlatforms = platforms || this.enabledPlatforms;
      const cacheKey = StreamingUtils.generateCacheKey(title, year, selectedPlatforms);

      // Verificar cache
      const cachedData = await StreamingUtils.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`Dados recuperados do cache para: ${title}`);
        return cachedData;
      }

      // Buscar título
      const titleData = await this.searchTitle(title, year);
      if (!titleData) {
        return { title, year, platforms: [], available: false };
      }

      // Obter detalhes do título
      const details = await this.getTitleDetails(titleData.id);
      
      // Filtrar por plataformas selecionadas
      const offers = details.offers || [];
      const filteredOffers = offers.filter(offer => 
        selectedPlatforms.includes(offer.provider_id)
      );

      // Formatar dados
      const availabilityData = {
        title: titleData.title,
        year: titleData.original_release_year,
        id: titleData.id,
        objectType: titleData.object_type,
        platforms: filteredOffers.map(offer => ({
          platform_id: offer.provider_id,
          platform_name: StreamingUtils.formatPlatformName(offer.provider_id),
          platform_icon: StreamingUtils.getPlatformIcon(offer.provider_id),
          platform_color: StreamingUtils.getPlatformColor(offer.provider_id),
          url: offer.urls ? offer.urls.standard_web : null,
          monetization_type: offer.monetization_type,
          retail_price: offer.retail_price,
          currency: offer.currency,
          last_change_retail_price: offer.last_change_retail_price,
          last_checked: new Date().toISOString()
        })),
        available: filteredOffers.length > 0,
        last_updated: new Date().toISOString()
      };

      // Salvar no cache
      await StreamingUtils.saveToCache(cacheKey, availabilityData);

      return availabilityData;

    } catch (error) {
      console.error('Erro ao obter disponibilidade de streaming:', error.message);
      throw error;
    }
  }

  async getTitleDetails(titleId) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/content/titles/${this.locale}/${titleId}`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes do título:', error.message);
      throw error;
    }
  }

  async getAvailableTitles(platformId, limit = 50) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/content/titles/${this.locale}/new`,
        {
          params: {
            content_types: ['movie', 'show'],
            providers: [platformId],
            page_size: limit,
            page: 1
          },
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter títulos disponíveis:', error.message);
      throw error;
    }
  }

  async getPlatformDetails(platformId) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/providers/${this.locale}/${platformId}`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes da plataforma:', error.message);
      throw error;
    }
  }

  async searchByGenre(genre, platformId = null, limit = 20) {
    try {
      const params = {
        content_types: ['movie', 'show'],
        genres: [genre],
        page_size: limit,
        page: 1
      };

      if (platformId) {
        params.providers = [platformId];
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/content/titles/${this.locale}/popular`,
        params,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao buscar por gênero:', error.message);
      throw error;
    }
  }

  async getNewReleases(platformId = null, days = 7) {
    try {
      const params = {
        content_types: ['movie', 'show'],
        page_size: 50,
        page: 1
      };

      if (platformId) {
        params.providers = [platformId];
      }

      // Calcular data limite
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const response = await axios.post(
        `${this.apiBaseUrl}/content/titles/${this.locale}/new`,
        params,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter novos lançamentos:', error.message);
      throw error;
    }
  }

  async getPopularTitles(platformId = null, limit = 50) {
    try {
      const params = {
        content_types: ['movie', 'show'],
        page_size: limit,
        page: 1,
        sort_by: 'popularity_7_days:desc'
      };

      if (platformId) {
        params.providers = [platformId];
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/content/titles/${this.locale}/popular`,
        params,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter títulos populares:', error.message);
      throw error;
    }
  }

  async getSimilarTitles(titleId, limit = 10) {
    try {
      const response = await axios.get(
        `${this.apiUrls}/content/titles/${this.locale}/${titleId}/similar`,
        {
          params: {
            page_size: limit,
            page: 1
          },
          headers: {
            'User-Agent': this.userAgent
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter títulos similares:', error.message);
      throw error;
    }
  }

  getSupportedGenres() {
    return [
      'action', 'adventure', 'animation', 'comedy', 'crime',
      'documentary', 'drama', 'family', 'fantasy', 'history',
      'horror', 'music', 'mystery', 'romance', 'science_fiction',
      'thriller', 'war', 'western'
    ];
  }

  getSupportedCountries() {
    return [
      { code: 'US', name: 'United States' },
      { code: 'BR', name: 'Brazil' },
      { code: 'UK', name: 'United Kingdom' },
      { code: 'CA', name: 'Canada' },
      { code: 'AU', name: 'Australia' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'JP', name: 'Japan' },
      { code: 'KR', name: 'South Korea' },
      { code: 'IN', name: 'India' }
    ];
  }
}

module.exports = new JustWatchService();