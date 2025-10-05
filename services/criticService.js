// criticService.js

const axios = require('axios');
const criticConfig = require('../config/criticConfig');
const CriticUtils = require('../utils/criticUtils');
const db = require('../data/database/init');

class CriticService {
  static async checkMovieRatings(title, year = null, apis = null) {
    try {
      // Verificar conexão com internet
      const hasInternet = await CriticUtils.checkInternetConnection();
      if (!hasInternet) {
        throw new Error('Sem conexão com a internet');
      }

      // Gerar chave de cache
      const selectedApis = apis || Object.keys(criticConfig.apis);
      const cacheKey = CriticUtils.generateCacheKey(title, year, selectedApis);

      // Verificar cache
      let ratings = await CriticUtils.getFromCache(cacheKey);
      if (ratings) {
        console.log(`Dados recuperados do cache para: ${title}`);
        return ratings;
      }

      // Buscar ratings em múltiplas APIs
      ratings = await this.searchMultipleApis(title, year, selectedApis);

      // Salvar no cache
      await CriticUtils.saveToCache(cacheKey, ratings);

      return ratings;

    } catch (error) {
      console.error('Erro ao verificar ratings de crítica:', error.message);
      throw error;
    }
  }

  static async searchMultipleApis(title, year = null, apis = null) {
    const selectedApis = apis || Object.keys(criticConfig.apis);
    const results = {};
    const errors = [];

    // Buscar em cada API
    for (const apiId of selectedApis) {
      try {
        if (criticConfig.apis[apiId].enabled) {
          const apiRatings = await this.searchApi(apiId, title, year);
          results[apiId] = apiRatings;
        }
      } catch (error) {
        console.error(`Erro ao buscar em ${apiId}:`, error.message);
        errors.push({ api: apiId, error: error.message });
      }

      // Delay para evitar bloqueios
      await CriticUtils.sleep(100);
    }

    // Salvar resultados no banco de dados
    await this.saveCriticRatings(title, year, results);

    // Verificar mudanças e notificar usuário
    await this.checkForRatingChanges(title, year, results);

    return { ratings: results, errors };
  }

  static async searchApi(apiId, title, year = null) {
    switch (apiId) {
      case 'imdb':
        return await this.searchIMDb(title, year);
      case 'rt':
        return await this.searchRottenTomatoes(title, year);
      case 'lbxd':
        return await this.searchLetterboxd(title, year);
      case 'fa':
        return await this.searchFilmAffinity(title, year);
      case 'trakt':
        return await this.searchTrakt(title, year);
      case 'mc':
        return await this.searchMetacritic(title, year);
      case 'tmdb':
        return await this.searchTMDb(title, year);
      default:
        throw new Error(`API não suportada: ${apiId}`);
    }
  }

  static async searchIMDb(title, year = null) {
    try {
      // IMDb não tem API pública oficial, então usaremos scraping
      const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title)}&s=tt`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': criticConfig.apis.imdb.userAgent
        }
      });

      // Extrair dados do primeiro resultado
      // Esta é uma implementação de exemplo - você pode usar bibliotecas como cheerio
      const data = response.data;
      
      // Aqui você implementaria o parsing real com cheerio
      // Por enquanto, vamos retornar dados simulados
      return {
        rating: 8.5,
        votes: 1000000,
        url: 'https://www.imdb.com/title/tt0000000/',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar no IMDb:', error.message);
      throw error;
    }
  }

  static async searchRottenTomatoes(title, year = null) {
    try {
      // Rotten Tomatoes não tem API pública oficial, então usaremos scraping
      const searchUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': criticConfig.apis.rottenTomatoes.userAgent
        }
      });

      // Extrair dados do primeiro resultado
      // Esta é uma implementação de exemplo
      const data = response.data;
      
      // Aqui você implementaria o parsing real com cheerio
      // Por enquanto, vamos retornar dados simulados
      return {
        critics_score: 90,
        audience_score: 85,
        url: 'https://www.rottentomatoes.com/m/movie_title',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar no Rotten Tomatoes:', error.message);
      throw error;
    }
  }

  static async searchLetterboxd(title, year = null) {
    try {
      // Letterboxd não tem API pública oficial, então usaremos scraping
      const searchUrl = `https://letterboxd.com/search/films/${encodeURIComponent(title)}/`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': criticConfig.apis.letterboxd.userAgent
        }
      });

      // Extrair dados do primeiro resultado
      // Esta é uma implementação de exemplo
      const data = response.data;
      
      // Aqui você implementaria o parsing real com cheerio
      // Por enquanto, vamos retornar dados simulados
      return {
        rating: 4.2,
        votes: 50000,
        url: 'https://letterboxd.com/film/movie-title/',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar no Letterboxd:', error.message);
      throw error;
    }
  }

  static async searchFilmAffinity(title, year = null) {
    try {
      // FilmAffinity não tem API pública oficial, então usaremos scraping
      const searchUrl = `https://www.filmaffinity.com/pt/search.php?stype=title&stext=${encodeURIComponent(title)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': criticConfig.apis.filmAffinity.userAgent
        }
      });

      // Extrair dados do primeiro resultado
      // Esta é uma implementação de exemplo
      const data = response.data;
      
      // Aqui você implementaria o parsing real com cheerio
      // Por enquanto, vamos retornar dados simulados
      return {
        rating: 7.8,
        votes: 20000,
        url: 'https://www.filmaffinity.com/pt/film123456.html',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar no FilmAffinity:', error.message);
      throw error;
    }
  }

  static async searchTrakt(title, year = null) {
    try {
      // Trakt.tv tem API pública oficial
      const searchUrl = `${criticConfig.apis.trakt.apiUrl}/search/movie`;
      const response = await axios.get(searchUrl, {
        params: {
          query: title,
          year: year
        },
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-key': criticConfig.apis.trakt.apiKey,
          'trakt-api-version': '2',
          'User-Agent': criticConfig.apis.trakt.userAgent
        }
      });

      if (response.data && response.data.length > 0) {
        const movie = response.data[0].movie;
        return {
          rating: movie.rating,
          votes: movie.votes,
          url: `https://trakt.tv/movies/${movie.ids.slug}`,
          last_updated: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar no Trakt.tv:', error.message);
      throw error;
    }
  }

  static async searchMetacritic(title, year = null) {
    try {
      // Metacritic não tem API pública oficial, então usaremos scraping
      const searchUrl = `https://www.metacritic.com/search/movie/${encodeURIComponent(title)}/results`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': criticConfig.apis.metacritic.userAgent
        }
      });

      // Extrair dados do primeiro resultado
      // Esta é uma implementação de exemplo
      const data = response.data;
      
      // Aqui você implementaria o parsing real com cheerio
      // Por enquanto, vamos retornar dados simulados
      return {
        critics_score: 80,
        users_score: 7.5,
        url: 'https://www.metacritic.com/movie/movie-title',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar no Metacritic:', error.message);
      throw error;
    }
  }

  static async searchTMDb(title, year = null) {
    try {
      // TMDb tem API pública oficial
      const searchUrl = `${criticConfig.apis.tmdb.apiUrl}/search/movie`;
      const response = await axios.get(searchUrl, {
        params: {
          api_key: criticConfig.apis.tmdb.apiKey,
          query: title,
          year: year
        },
        headers: {
          'User-Agent': criticConfig.apis.tmdb.userAgent
        }
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const movie = response.data.results[0];
        return {
          rating: movie.vote_average,
          votes: movie.vote_count,
          url: `https://www.themoviedb.org/movie/${movie.id}`,
          last_updated: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar no TMDb:', error.message);
      throw error;
    }
  }

  static async saveCriticRatings(title, year, ratingsData) {
    try {
      // Excluir dados antigos
      const deleteStmt = db.prepare('DELETE FROM critic_ratings WHERE title = ? AND year = ?');
      deleteStmt.run(title, year);

      // Inserir novos dados
      const insertStmt = db.prepare(`
        INSERT INTO critic_ratings (
          title, year, api_source, rating_value, rating_votes,
          rating_url, last_updated, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      Object.entries(ratingsData.ratings).forEach(([apiSource, rating]) => {
        if (rating) {
          insertStmt.run(
            title,
            year,
            apiSource,
            rating.rating || rating.critics_score || rating.users_score || 0,
            rating.votes || 0,
            rating.url || null,
            rating.last_updated || new Date().toISOString(),
            new Date().toISOString()
          );
        }
      });

    } catch (error) {
      console.error('Erro ao salvar ratings de crítica:', error);
      throw error;
    }
  }

  static async checkForRatingChanges(title, year, newRatings) {
    try {
      // Obter ratings anteriores
      const oldRatings = await this.getPreviousRatings(title, year);

      // Detectar mudanças
      const changes = CriticUtils.detectChanges(oldRatings, newRatings.ratings);

      // Notificar usuário sobre mudanças significativas
      if (changes.improved.length > 0 && criticConfig.notifications.improvedRatings) {
        const improvedApis = changes.improved.map(c => 
          CriticUtils.formatApiName(c.api)
        ).join(', ');

        await NotificationService.createNotification(null, {
          title: 'Rating Melhorou',
          message: `O rating de "${title}" melhorou em: ${improvedApis}`,
          type: 'success',
          priority: 'medium',
          related_movie_title: title,
          related_movie_year: year
        });
      }

      if (changes.declined.length > 0 && criticConfig.notifications.declinedRatings) {
        const declinedApis = changes.declined.map(c => 
          CriticUtils.formatApiName(c.api)
        ).join(', ');

        await NotificationService.createNotification(null, {
          title: 'Rating Diminuiu',
          message: `O rating de "${title}" diminuiu em: ${declinedApis}`,
          type: 'warning',
          priority: 'medium',
          related_movie_title: title,
          related_movie_year: year
        });
      }

    } catch (error) {
      console.error('Erro ao verificar mudanças de rating:', error);
    }
  }

  static async getPreviousRatings(title, year) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings 
        WHERE title = ? AND year = ?
        ORDER BY last_updated DESC
      `);
      const rows = stmt.all(title, year);

      const ratings = {};
      rows.forEach(row => {
        ratings[row.api_source] = row.rating_value;
      });

      return ratings;
    } catch (error) {
      console.error('Erro ao obter ratings anteriores:', error);
      return {};
    }
  }

  static async getMovieRatings(title, year) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings 
        WHERE title = ? AND year = ?
        ORDER BY last_updated DESC
      `);
      return stmt.all(title, year);
    } catch (error) {
      console.error('Erro ao obter ratings do filme:', error);
      throw error;
    }
  }

  static async getAllMovieRatings() {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings 
        ORDER BY last_updated DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter todos os ratings:', error);
      throw error;
    }
  }

  static async updateAllMovieRatings() {
    try {
      console.log(`[${new Date().toISOString()}] Atualizando ratings de todos os filmes...`);

      // Obter todos os filmes
      const moviesStmt = db.prepare('SELECT title, year FROM movies');
      const movies = moviesStmt.all();

      const results = {
        total: movies.length,
        checked: 0,
        updated: 0,
        errors: 0
      };

      // Atualizar cada filme
      for (const movie of movies) {
        try {
          await this.checkMovieRatings(movie.title, movie.year);
          results.checked++;
          results.updated++;

          // Delay para evitar bloqueios
          await CriticUtils.sleep(200);

        } catch (error) {
          console.error(`Erro ao atualizar ratings de "${movie.title}":`, error.message);
          results.errors++;
        }
      }

      console.log(`[${new Date().toISOString()}] Atualização concluída`);
      return results;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na atualização em massa:`, error);
      throw error;
    }
  }

  static async getRatingStatistics() {
    try {
      const stmt = db.prepare(`
        SELECT 
          api_source,
          COUNT(*) as total_ratings,
          AVG(rating_value) as average_rating,
          MAX(rating_value) as max_rating,
          MIN(rating_value) as min_rating,
          MAX(last_updated) as last_update
        FROM critic_ratings
        GROUP BY api_source
        ORDER BY total_ratings DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter estatísticas de ratings:', error);
      throw error;
    }
  }

  static async getRatingHistory(days = 30) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings
        WHERE last_updated >= datetime('now', '-${days} days')
        ORDER BY last_updated DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter histórico de ratings:', error);
      throw error;
    }
  }

  static async getRatingChanges(days = 7) {
    try {
      const stmt = db.prepare(`
        SELECT 
          title, year, api_source,
          rating_value as current_rating,
          LAG(rating_value) OVER (PARTITION BY title, year, api_source ORDER BY last_updated) as previous_rating,
          last_updated
        FROM critic_ratings
        WHERE last_updated >= datetime('now', '-${days} days')
        ORDER BY last_updated DESC
      `);
      const rows = stmt.all();

      // Filtrar apenas mudanças significativas
      const changes = rows.filter(row => 
        row.previous_rating && 
        Math.abs(row.current_rating - row.previous_rating) > 0.1
      );

      return changes;
    } catch (error) {
      console.error('Erro ao obter mudanças de ratings:', error);
      throw error;
    }
  }

  static async getTopRatedMovies(limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT 
          title, year, api_source, rating_value,
          COUNT(*) OVER (PARTITION BY title, year) as source_count
        FROM critic_ratings
        WHERE rating_value > 0
        ORDER BY rating_value DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter filmes melhor avaliados:', error);
      throw error;
    }
  }

  static async getWorstRatedMovies(limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT 
          title, year, api_source, rating_value,
          COUNT(*) OVER (PARTITION BY title, year) as source_count
        FROM critic_ratings
        WHERE rating_value > 0
        ORDER BY rating_value ASC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter filmes pior avaliados:', error);
      throw error;
    }
  }

  static async getRatingDistribution() {
    try {
      const stmt = db.prepare(`
        SELECT 
          api_source,
          CAST(FLOOR(rating_value) AS INTEGER) as rating_range,
          COUNT(*) as count
        FROM critic_ratings
        WHERE rating_value > 0
        GROUP BY api_source, rating_range
        ORDER BY api_source, rating_range
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter distribuição de ratings:', error);
      throw error;
    }
  }

  static async getRatingConsensus(title, year) {
    try {
      const ratings = await this.getMovieRatings(title, year);
      
      if (ratings.length === 0) {
        return null;
      }

      const validRatings = ratings.filter(r => r.rating_value > 0);
      if (validRatings.length === 0) {
        return null;
      }

      const sum = validRatings.reduce((acc, r) => acc + r.rating_value, 0);
      const average = sum / validRatings.length;

      return {
        title: title,
        year: year,
        consensus_rating: parseFloat(average.toFixed(2)),
        sources_count: validRatings.length,
        highest_rating: Math.max(...validRatings.map(r => r.rating_value)),
        lowest_rating: Math.min(...validRatings.map(r => r.rating_value)),
        confidence: validRatings.length >= 3 ? 'high' : 'low'
      };

    } catch (error) {
      console.error('Erro ao obter consenso de ratings:', error);
      throw error;
    }
  }

  static async getRatingRecommendations(userId, limit = 10) {
    try {
      // Obter filmes do usuário
      const moviesStmt = db.prepare('SELECT title, year FROM movies WHERE user_id = ?');
      const movies = moviesStmt.all(userId);

      const recommendations = [];

      // Obter ratings para cada filme
      for (const movie of movies) {
        const ratings = await this.getMovieRatings(movie.title, movie.year);
        
        if (ratings.length > 0) {
          const validRatings = ratings.filter(r => r.rating_value > 0);
          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, r) => acc + r.rating_value, 0);
            const average = sum / validRatings.length;

            recommendations.push({
              title: movie.title,
              year: movie.year,
              average_rating: parseFloat(average.toFixed(2)),
              sources_count: validRatings.length,
              highest_rating: Math.max(...validRatings.map(r => r.rating_value)),
              lowest_rating: Math.min(...validRatings.map(r => r.rating_value)),
              confidence: validRatings.length >= 3 ? 'high' : 'low'
            });
          }
        }
      }

      // Ordenar por rating médio
      recommendations.sort((a, b) => b.average_rating - a.average_rating);

      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('Erro ao obter recomendações de ratings:', error);
      throw error;
    }
  }

  static async getRatingAlerts(userId, threshold = 8.0) {
    try {
      // Obter filmes do usuário
      const moviesStmt = db.prepare('SELECT title, year FROM movies WHERE user_id = ?');
      const movies = moviesStmt.all(userId);

      const alerts = [];

      // Verificar ratings altos
      for (const movie of movies) {
        const ratings = await this.getMovieRatings(movie.title, movie.year);
        
        if (ratings.length > 0) {
          const validRatings = ratings.filter(r => r.rating_value > 0);
          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, r) => acc + r.rating_value, 0);
            const average = sum / validRatings.length;

            if (average >= threshold) {
              alerts.push({
                title: movie.title,
                year: movie.year,
                average_rating: parseFloat(average.toFixed(2)),
                sources_count: validRatings.length,
                type: 'high_rating',
                priority: 'high',
                message: `Filme com rating médio de ${average.toFixed(2)}!`
              });
            }
          }
        }
      }

      return alerts;

    } catch (error) {
      console.error('Erro ao obter alertas de ratings:', error);
      throw error;
    }
  }

  static async getRatingInsights(userId) {
    try {
      // Obter todos os ratings do usuário
      const ratingsStmt = db.prepare(`
        SELECT cr.* 
        FROM critic_ratings cr
        INNER JOIN movies m ON cr.title = m.title AND cr.year = m.year
        WHERE m.user_id = ?
      `);
      const ratings = ratingsStmt.all(userId);

      if (ratings.length === 0) {
        return {
          total_ratings: 0,
          average_rating: 0,
          highest_rating: 0,
          lowest_rating: 0,
          sources_distribution: {},
          rating_distribution: {},
          trends: {}
        };
      }

      // Calcular estatísticas
      const validRatings = ratings.filter(r => r.rating_value > 0);
      const sum = validRatings.reduce((acc, r) => acc + r.rating_value, 0);
      const average = validRatings.length > 0 ? sum / validRatings.length : 0;

      // Distribuição por fontes
      const sourcesDistribution = {};
      validRatings.forEach(r => {
        sourcesDistribution[r.api_source] = (sourcesDistribution[r.api_source] || 0) + 1;
      });

      // Distribuição por ranges de rating
      const ratingDistribution = {};
      validRatings.forEach(r => {
        const range = Math.floor(r.rating_value);
        ratingDistribution[range] = (ratingDistribution[range] || 0) + 1;
      });

      // Tendências (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRatings = validRatings.filter(r => 
        new Date(r.last_updated) >= thirtyDaysAgo
      );

      const oldRatings = validRatings.filter(r => 
        new Date(r.last_updated) < thirtyDaysAgo
      );

      const recentSum = recentRatings.reduce((acc, r) => acc + r.rating_value, 0);
      const recentAverage = recentRatings.length > 0 ? recentSum / recentRatings.length : 0;

      const oldSum = oldRatings.reduce((acc, r) => acc + r.rating_value, 0);
      const oldAverage = oldRatings.length > 0 ? oldSum / oldRatings.length : 0;

      const trend = recentAverage > oldAverage ? 'improving' : 
                   recentAverage < oldAverage ? 'declining' : 'stable';

      return {
        total_ratings: ratings.length,
        valid_ratings: validRatings.length,
        average_rating: parseFloat(average.toFixed(2)),
        highest_rating: validRatings.length > 0 ? 
          Math.max(...validRatings.map(r => r.rating_value)) : 0,
        lowest_rating: validRatings.length > 0 ? 
          Math.min(...validRatings.map(r => r.rating_value)) : 0,
        sources_distribution: sourcesDistribution,
        rating_distribution: ratingDistribution,
        trends: {
          recent_average: parseFloat(recentAverage.toFixed(2)),
          old_average: parseFloat(oldAverage.toFixed(2)),
          trend: trend,
          improvement: parseFloat((recentAverage - oldAverage).toFixed(2))
        }
      };

    } catch (error) {
      console.error('Erro ao obter insights de ratings:', error);
      throw error;
    }
  }

  static async scheduleAutoUpdate() {
    const cron = require('node-cron');
    
    if (!criticConfig.general.autoUpdate) {
      console.log('Atualização automática de ratings desativada');
      return;
    }

    const schedule = criticConfig.schedule[criticConfig.general.updateFrequency];
    if (!schedule) {
      console.error('Agendamento inválido:', criticConfig.general.updateFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando atualização automática de ratings...`);
        await this.updateAllMovieRatings();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na atualização automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Atualização automática de ratings agendada para executar ${criticConfig.general.updateFrequency}`);
  }

  static async cleanupOldData(days = 90) {
    try {
      const stmt = db.prepare(`
        DELETE FROM critic_ratings 
        WHERE last_updated < datetime('now', '-${days} days')
      `);
      stmt.run();
      
      console.log(`Dados de ratings anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  static async getApiDetails(apiId) {
    try {
      return criticConfig.apis[apiId];
    } catch (error) {
      console.error('Erro ao obter detalhes da API:', error);
      throw error;
    }
  }

  static async searchApiContent(apiId, query, limit = 20) {
    try {
      const ratings = await this.searchApi(apiId, query);
      return ratings.slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar conteúdo na API:', error);
      throw error;
    }
  }

  static async getNewRatings(apiId = null, days = 7) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings
        WHERE last_updated >= datetime('now', '-${days} days')
        ${apiId ? 'AND api_source = ?' : ''}
        ORDER BY last_updated DESC
      `);
      
      return apiId ? stmt.all(apiId) : stmt.all();
    } catch (error) {
      console.error('Erro ao obter novos ratings:', error);
      throw error;
    }
  }

  static async getPopularRatings(apiId = null, limit = 50) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings
        WHERE rating_value > 0
        ${apiId ? 'AND api_source = ?' : ''}
        ORDER BY rating_value DESC
        LIMIT ?
      `);
      
      return apiId ? stmt.all(apiId, limit) : stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter ratings populares:', error);
      throw error;
    }
  }

  static async getSimilarRatings(title, year, limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings
        WHERE title != ? AND year = ?
        ORDER BY ABS(rating_value - (
          SELECT AVG(rating_value) 
          FROM critic_ratings 
          WHERE title = ? AND year = ?
        )) ASC
        LIMIT ?
      `);
      
      return stmt.all(title, year, title, year, limit);
    } catch (error) {
      console.error('Erro ao obter ratings similares:', error);
      throw error;
    }
  }
}

module.exports = CriticService;