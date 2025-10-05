// streamingService.js

const axios = require('axios');
const streamingConfig = require('../config/streamingConfig');
const StreamingUtils = require('../utils/streamingUtils');
const db = require('../data/database/init');

class StreamingService {
  static async checkMovieAvailability(title, year = null, platforms = null) {
    try {
      // Verificar conexão com internet
      const hasInternet = await StreamingUtils.checkInternetConnection();
      if (!hasInternet) {
        throw new Error('Sem conexão com a internet');
      }

      // Gerar chave de cache
      const selectedPlatforms = platforms || Object.keys(streamingConfig.platforms);
      const cacheKey = StreamingUtils.generateCacheKey(title, year, selectedPlatforms);

      // Verificar cache
      let availability = await StreamingUtils.getFromCache(cacheKey);
      if (availability) {
        console.log(`Dados recuperados do cache para: ${title}`);
        return availability;
      }

      // Buscar disponibilidade via JustWatch API
      availability = await this.searchJustWatch(title, year, selectedPlatforms);

      // Salvar no cache
      await StreamingUtils.saveToCache(cacheKey, availability);

      return availability;

    } catch (error) {
      console.error('Erro ao verificar disponibilidade de streaming:', error.message);
      throw error;
    }
  }

  static async searchJustWatch(title, year = null, platforms = null) {
    try {
      const locale = streamingConfig.justwatch.locale;
      const country = streamingConfig.justwatch.country;
      const selectedPlatforms = platforms || Object.keys(streamingConfig.platforms);

      // Preparar parâmetros de busca
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

      // Fazer requisição para API JustWatch
      const response = await axios.post(
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/popular`,
        searchParams,
        {
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.items && response.data.items.length > 0) {
        const firstResult = response.data.items[0];
        return await this.getMovieDetails(firstResult.id, selectedPlatforms);
      }

      return { title, year, platforms: [], available: false };
    } catch (error) {
      console.error('Erro ao buscar no JustWatch:', error.message);
      throw error;
    }
  }

  static async getMovieDetails(movieId, platforms = null) {
    try {
      const locale = streamingConfig.justwatch.locale;
      const selectedPlatforms = platforms || Object.keys(streamingConfig.platforms);

      const response = await axios.get(
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/${movieId}`,
        {
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent
          }
        }
      );

      const data = response.data;

      // Extrair informações de disponibilidade
      const offers = data.offers || [];
      const filteredOffers = offers.filter(offer => 
        selectedPlatforms.includes(offer.provider_id)
      );

      const availability = {
        title: data.title,
        year: data.original_release_year,
        id: data.id,
        objectType: data.object_type,
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

      return availability;

    } catch (error) {
      console.error('Erro ao obter detalhes do filme no JustWatch:', error.message);
      throw error;
    }
  }

  static async getAvailableMovies(platformId, limit = 50) {
    try {
      const locale = streamingConfig.justwatch.locale;
      const country = streamingConfig.justwatch.country;

      const response = await axios.get(
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/new`,
        {
          params: {
            content_types: ['movie', 'show'],
            providers: [platformId],
            page_size: limit,
            page: 1
          },
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter filmes disponíveis:', error.message);
      throw error;
    }
  }

  static async getPlatformDetails(platformId) {
    try {
      const locale = streamingConfig.justwatch.locale;

      const response = await axios.get(
        `${streamingConfig.justwatch.apiUrl}/providers/${locale}/${platformId}`,
        {
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes da plataforma:', error.message);
      throw error;
    }
  }

  static async searchByGenre(genre, platformId = null, limit = 20) {
    try {
      const locale = streamingConfig.justwatch.locale;

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
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/popular`,
        params,
        {
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent,
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

  static async getNewReleases(platformId = null, days = 7) {
    try {
      const locale = streamingConfig.justwatch.locale;

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
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/new`,
        params,
        {
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent,
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

  static async getPopularTitles(platformId = null, limit = 50) {
    try {
      const locale = streamingConfig.justwatch.locale;

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
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/popular`,
        params,
        {
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent,
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

  static async getSimilarTitles(titleId, limit = 10) {
    try {
      const locale = streamingConfig.justwatch.locale;

      const response = await axios.get(
        `${streamingConfig.justwatch.apiUrl}/content/titles/${locale}/${titleId}/similar`,
        {
          params: {
            page_size: limit,
            page: 1
          },
          headers: {
            'User-Agent': streamingConfig.justwatch.userAgent
          }
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter títulos similares:', error.message);
      throw error;
    }
  }

  static getSupportedGenres() {
    return [
      'action', 'adventure', 'animation', 'comedy', 'crime',
      'documentary', 'drama', 'family', 'fantasy', 'history',
      'horror', 'music', 'mystery', 'romance', 'science_fiction',
      'thriller', 'war', 'western'
    ];
  }

  static getSupportedCountries() {
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

  static async updateStreamingAvailability(movieId, userId) {
    try {
      // Obter dados do filme
      const movieStmt = db.prepare('SELECT * FROM movies WHERE id = ? AND user_id = ?');
      const movie = movieStmt.get(movieId, userId);

      if (!movie) {
        throw new Error('Filme não encontrado');
      }

      // Verificar disponibilidade em streaming
      const availability = await this.checkMovieAvailability(movie.title, movie.year);

      // Salvar resultados no banco de dados
      await this.saveStreamingAvailability(movieId, availability);

      // Verificar mudanças e notificar usuário
      await this.checkForChangesAndNotify(userId, movieId, availability);

      return availability;

    } catch (error) {
      console.error(`Erro ao atualizar disponibilidade de streaming para filme ${movieId}:`, error);
      throw error;
    }
  }

  static async saveStreamingAvailability(movieId, availabilityData) {
    try {
      // Excluir dados antigos
      const deleteStmt = db.prepare('DELETE FROM streaming_availability WHERE movie_id = ?');
      deleteStmt.run(movieId);

      // Inserir novos dados
      const insertStmt = db.prepare(`
        INSERT INTO streaming_availability (
          movie_id, platform, link, available, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `);

      if (availabilityData.platforms && availabilityData.platforms.length > 0) {
        availabilityData.platforms.forEach(platform => {
          insertStmt.run(
            movieId,
            platform.platform_id,
            platform.url,
            1,
            new Date().toISOString()
          );
        });
      } else {
        // Marcar como indisponível em todas as plataformas
        Object.keys(streamingConfig.platforms).forEach(platformId => {
          insertStmt.run(
            movieId,
            platformId,
            null,
            0,
            new Date().toISOString()
          );
        });
      }

    } catch (error) {
      console.error('Erro ao salvar disponibilidade de streaming:', error);
      throw error;
    }
  }

  static async checkForChangesAndNotify(userId, movieId, newAvailability) {
    try {
      // Obter disponibilidade anterior
      const previousStmt = db.prepare(`
        SELECT * FROM streaming_availability 
        WHERE movie_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1 OFFSET 1
      `);
      const previousAvailability = previousStmt.get(movieId);

      if (!previousAvailability) {
        // Primeira verificação, não há dados anteriores
        return;
      }

      // Comparar com dados atuais
      const currentStmt = db.prepare(`
        SELECT * FROM streaming_availability 
        WHERE movie_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      const currentAvailability = currentStmt.get(movieId);

      // Detectar mudanças
      const changes = StreamingUtils.detectChanges(
        [previousAvailability],
        [currentAvailability]
      );

      // Notificar usuário sobre mudanças
      if (changes.added.length > 0 && streamingConfig.notifications.newAvailability) {
        const platformNames = changes.added.map(p => 
          StreamingUtils.formatPlatformName(p.platform_id)
        ).join(', ');

        await NotificationService.createNotification(userId, {
          title: 'Novo Conteúdo Disponível',
          message: `O filme agora está disponível em: ${platformNames}`,
          type: 'success',
          priority: 'medium',
          related_movie_id: movieId
        });
      }

      if (changes.removed.length > 0 && streamingConfig.notifications.removedAvailability) {
        const platformNames = changes.removed.map(p => 
          StreamingUtils.formatPlatformName(p.platform_id)
        ).join(', ');

        await NotificationService.createNotification(userId, {
          title: 'Conteúdo Removido',
          message: `O filme não está mais disponível em: ${platformNames}`,
          type: 'warning',
          priority: 'medium',
          related_movie_id: movieId
        });
      }

    } catch (error) {
      console.error('Erro ao verificar mudanças:', error);
    }
  }

  static async getMovieStreamingAvailability(movieId, userId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM streaming_availability 
        WHERE movie_id = ? 
        ORDER BY updated_at DESC
      `);
      return stmt.all(movieId);
    } catch (error) {
      console.error('Erro ao obter disponibilidade do filme:', error);
      throw error;
    }
  }

  static async getUserMoviesWithStreaming(userId) {
    try {
      const stmt = db.prepare(`
        SELECT m.*, sa.platform, sa.link, sa.available, sa.updated_at as streaming_updated
        FROM movies m
        LEFT JOIN streaming_availability sa ON m.id = sa.movie_id
        WHERE m.user_id = ?
        ORDER BY m.title
      `);
      return stmt.all(userId);
    } catch (error) {
      console.error('Erro ao obter filmes com streaming:', error);
      throw error;
    }
  }

  static async checkAllUserMovies(userId) {
    try {
      console.log(`[${new Date().toISOString()}] Verificando disponibilidade para todos os filmes do usuário ${userId}...`);

      // Obter todos os filmes do usuário
      const moviesStmt = db.prepare('SELECT * FROM movies WHERE user_id = ?');
      const movies = moviesStmt.all(userId);

      const results = {
        total: movies.length,
        checked: 0,
        available: 0,
        errors: 0
      };

      // Verificar cada filme
      for (const movie of movies) {
        try {
          await this.updateStreamingAvailability(movie.id, userId);
          results.checked++;

          // Verificar se está disponível em alguma plataforma
          const availability = await this.getMovieStreamingAvailability(movie.id, userId);
          const isAvailable = availability.some(a => a.available);
          if (isAvailable) {
            results.available++;
          }

          // Pequeno delay para evitar bloqueios
          await StreamingUtils.sleep(100);

        } catch (error) {
          console.error(`Erro ao verificar filme ${movie.id}:`, error.message);
          results.errors++;
        }
      }

      console.log(`[${new Date().toISOString()}] Verificação concluída para usuário ${userId}`);
      return results;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na verificação em massa:`, error);
      throw error;
    }
  }

  static async getAvailableMoviesByPlatform(userId, platformId) {
    try {
      const stmt = db.prepare(`
        SELECT m.*, sa.link, sa.updated_at
        FROM movies m
        INNER JOIN streaming_availability sa ON m.id = sa.movie_id
        WHERE m.user_id = ? AND sa.platform = ? AND sa.available = 1
        ORDER BY m.title
      `);
      return stmt.all(userId, platformId);
    } catch (error) {
      console.error('Erro ao obter filmes disponíveis por plataforma:', error);
      throw error;
    }
  }

  static async getUnavailableMovies(userId) {
    try {
      const stmt = db.prepare(`
        SELECT m.*
        FROM movies m
        LEFT JOIN streaming_availability sa ON m.id = sa.movie_id AND sa.available = 1
        WHERE m.user_id = ? AND sa.movie_id IS NULL
        ORDER BY m.title
      `);
      return stmt.all(userId);
    } catch (error) {
      console.error('Erro ao obter filmes indisponíveis:', error);
      throw error;
    }
  }

  static async getPlatformStatistics(userId) {
    try {
      const stmt = db.prepare(`
        SELECT 
          sa.platform,
          COUNT(sa.movie_id) as total_movies,
          SUM(CASE WHEN sa.available = 1 THEN 1 ELSE 0 END) as available_movies,
          MAX(sa.updated_at) as last_check
        FROM streaming_availability sa
        INNER JOIN movies m ON sa.movie_id = m.id
        WHERE m.user_id = ?
        GROUP BY sa.platform
        ORDER BY available_movies DESC
      `);
      return stmt.all(userId);
    } catch (error) {
      console.error('Erro ao obter estatísticas por plataforma:', error);
      throw error;
    }
  }

  static async scheduleAutoCheck() {
    const cron = require('node-cron');
    
    if (!streamingConfig.general.autoCheck) {
      console.log('Verificação automática de streaming desativada');
      return;
    }

    const schedule = streamingConfig.schedule[streamingConfig.general.checkFrequency];
    if (!schedule) {
      console.error('Agendamento inválido:', streamingConfig.general.checkFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando verificação automática de streaming...`);
        
        // Aqui você pode obter todos os usuários ativos
        // Por enquanto, vamos usar um placeholder
        const userId = 1; // Este deve vir do contexto
        
        await this.checkAllUserMovies(userId);
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na verificação automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Verificação automática de streaming agendada para executar ${streamingConfig.general.checkFrequency}`);
  }

  static async cleanupOldData(days = 30) {
    try {
      const stmt = db.prepare(`
        DELETE FROM streaming_availability 
        WHERE updated_at < datetime('now', '-${days} days')
      `);
      stmt.run();
      
      console.log(`Dados de streaming anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  static async getPlatformDetails(platformId) {
    try {
      return await this.getPlatformDetails(platformId);
    } catch (error) {
      console.error('Erro ao obter detalhes da plataforma:', error);
      throw error;
    }
  }

  static async searchPlatformContent(platformId, query, limit = 20) {
    try {
      const titles = await this.getAvailableMovies(platformId, limit);
      return titles.filter(title => 
        title.title.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Erro ao buscar conteúdo na plataforma:', error);
      throw error;
    }
  }

  static async getNewReleases(platformId = null, days = 7) {
    try {
      return await this.getNewReleases(platformId, days);
    } catch (error) {
      console.error('Erro ao obter novos lançamentos:', error);
      throw error;
    }
  }

  static async getPopularTitles(platformId = null, limit = 50) {
    try {
      return await this.getPopularTitles(platformId, limit);
    } catch (error) {
      console.error('Erro ao obter títulos populares:', error);
      throw error;
    }
  }

  static async getSimilarTitles(titleId, limit = 10) {
    try {
      return await this.getSimilarTitles(titleId, limit);
    } catch (error) {
      console.error('Erro ao obter títulos similares:', error);
      throw error;
    }
  }
}

module.exports = StreamingService;