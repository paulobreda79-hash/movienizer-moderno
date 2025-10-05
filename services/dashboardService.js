// dashboardService.js

const Dashboard = require('../models/Dashboard');
const Movie = require('../models/Movie');
const Person = require('../models/Person');
const StreamingService = require('./streamingService');
const RecommendationService = require('./recommendationService');
const dashboardConfig = require('../config/dashboardConfig');

class DashboardService {
  static async createDashboard(userId, dashboardData) {
    try {
      const dashboard = Dashboard.create({
        user_id: userId,
        name: dashboardData.name,
        description: dashboardData.description,
        layout: dashboardData.layout || 'grid',
        is_public: dashboardData.is_public || 0,
        allow_sharing: dashboardData.allow_sharing || 0,
        sharing_token: dashboardData.allow_sharing ? Dashboard.generateSharingToken() : null
      });

      console.log(`Dashboard "${dashboard.name}" criado para usuário ${userId}`);
      return dashboard;
    } catch (error) {
      console.error('Erro ao criar dashboard:', error);
      throw error;
    }
  }

  static async getUserDashboards(userId) {
    try {
      const dashboards = Dashboard.findByUserId(userId);
      return dashboards;
    } catch (error) {
      console.error('Erro ao obter dashboards do usuário:', error);
      throw error;
    }
  }

  static async getDashboard(dashboardId) {
    try {
      const dashboard = Dashboard.getDashboardWithData(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard não encontrado');
      }
      return dashboard;
    } catch (error) {
      console.error('Erro ao obter dashboard:', error);
      throw error;
    }
  }

  static async updateDashboard(dashboardId, dashboardData) {
    try {
      Dashboard.update(dashboardId, dashboardData);
      console.log(`Dashboard ${dashboardId} atualizado`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
      throw error;
    }
  }

  static async deleteDashboard(dashboardId) {
    try {
      Dashboard.delete(dashboardId);
      console.log(`Dashboard ${dashboardId} excluído`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir dashboard:', error);
      throw error;
    }
  }

  static async createWidget(dashboardId, widgetData) {
    try {
      const widget = Dashboard.createWidget({
        dashboard_id: dashboardId,
        widget_type: widgetData.widget_type,
        title: widgetData.title,
        position_x: widgetData.position_x || 0,
        position_y: widgetData.position_y || 0,
        width: widgetData.width || 4,
        height: widgetData.height || 4,
        config: widgetData.config || {},
        is_visible: widgetData.is_visible !== undefined ? widgetData.is_visible : 1
      });

      console.log(`Widget "${widget.title}" criado no dashboard ${dashboardId}`);
      return widget;
    } catch (error) {
      console.error('Erro ao criar widget:', error);
      throw error;
    }
  }

  static async getDashboardWidgets(dashboardId) {
    try {
      const widgets = Dashboard.getWidgets(dashboardId);
      return widgets;
    } catch (error) {
      console.error('Erro ao obter widgets do dashboard:', error);
      throw error;
    }
  }

  static async updateWidget(widgetId, widgetData) {
    try {
      Dashboard.updateWidget(widgetId, widgetData);
      console.log(`Widget ${widgetId} atualizado`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar widget:', error);
      throw error;
    }
  }

  static async deleteWidget(widgetId) {
    try {
      Dashboard.deleteWidget(widgetId);
      console.log(`Widget ${widgetId} excluído`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir widget:', error);
      throw error;
    }
  }

  static async getWidgetData(userId, widgetType, config = {}) {
    try {
      switch (widgetType) {
        case 'movie-stats':
          return await this.getMovieStats(userId, config);
        case 'person-stats':
          return await this.getPersonStats(userId, config);
        case 'streaming-availability':
          return await this.getStreamingAvailability(userId, config);
        case 'recommendations':
          return await this.getRecommendations(userId, config);
        case 'recently-added':
          return await this.getRecentlyAdded(userId, config);
        case 'top-rated':
          return await this.getTopRated(userId, config);
        case 'watchlist':
          return await this.getWatchlist(userId, config);
        case 'upcoming-releases':
          return await this.getUpcomingReleases(userId, config);
        case 'favorites':
          return await this.getFavorites(userId, config);
        case 'genre-distribution':
          return await this.getGenreDistribution(userId, config);
        case 'year-distribution':
          return await this.getYearDistribution(userId, config);
        case 'quick-actions':
          return await this.getQuickActions(userId, config);
        case 'calendar':
          return await this.getCalendarData(userId, config);
        case 'notifications':
          return await this.getRecentNotifications(userId, config);
        default:
          throw new Error(`Widget type não suportado: ${widgetType}`);
      }
    } catch (error) {
      console.error(`Erro ao obter dados do widget ${widgetType}:`, error);
      throw error;
    }
  }

  static async getMovieStats(userId, config) {
    try {
      const movies = Movie.findByUserId(userId);
      
      const stats = {
        totalMovies: movies.length,
        watchedMovies: movies.filter(m => m.watched).length,
        favoriteMovies: movies.filter(m => m.favorite).length,
        averageRating: movies.length > 0 ? 
          (movies.reduce((sum, m) => sum + (m.rating_imdb || 0), 0) / movies.length).toFixed(1) : 0,
        genreDistribution: this.calculateGenreDistribution(movies),
        yearDistribution: this.calculateYearDistribution(movies),
        watchedPercentage: movies.length > 0 ? 
          ((movies.filter(m => m.watched).length / movies.length) * 100).toFixed(1) : 0
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de filmes:', error);
      throw error;
    }
  }

  static async getPersonStats(userId, config) {
    try {
      const people = Person.findByUserId(userId);
      
      const stats = {
        totalPeople: people.length,
        followedPeople: people.filter(p => p.followed).length,
        favoritePeople: people.filter(p => p.favorite).length,
        roleDistribution: this.calculateRoleDistribution(people),
        favoriteActors: this.getFavoriteActors(people, 5),
        favoriteDirectors: this.getFavoriteDirectors(people, 5)
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de pessoas:', error);
      throw error;
    }
  }

  static async getStreamingAvailability(userId, config) {
    try {
      const movies = Movie.findByUserId(userId);
      const platforms = config.showPlatforms || ['netflix', 'disney', 'prime'];
      
      const availability = await Promise.all(
        movies.map(async movie => {
          try {
            const availability = await StreamingService.getStreamingAvailability(
              movie.title,
              movie.year
            );
            return {
              movieId: movie.id,
              title: movie.title,
              platforms: availability.platforms || []
            };
          } catch (error) {
            return {
              movieId: movie.id,
              title: movie.title,
              platforms: []
            };
          }
        })
      );

      const platformStats = {};
      platforms.forEach(platform => {
        platformStats[platform] = {
          available: 0,
          unavailable: 0,
          percentage: 0
        };
      });

      availability.forEach(movie => {
        platforms.forEach(platform => {
          const isAvailable = movie.platforms.some(p => p.platform_id === platform);
          if (isAvailable) {
            platformStats[platform].available++;
          } else {
            platformStats[platform].unavailable++;
          }
        });
      });

      // Calcular porcentagens
      Object.keys(platformStats).forEach(platform => {
        const total = platformStats[platform].available + platformStats[platform].unavailable;
        if (total > 0) {
          platformStats[platform].percentage = ((platformStats[platform].available / total) * 100).toFixed(1);
        }
      });

      return {
        totalMovies: movies.length,
        platformStats,
        availableCount: availability.filter(m => m.platforms.length > 0).length,
        unavailableCount: availability.filter(m => m.platforms.length === 0).length
      };
    } catch (error) {
      console.error('Erro ao obter disponibilidade de streaming:', error);
      throw error;
    }
  }

  static async getRecommendations(userId, config) {
    try {
      const maxRecommendations = config.maxRecommendations || 10;
      const recommendations = await RecommendationService.getUserRecommendations(userId, maxRecommendations);
      
      return {
        recommendations: recommendations.slice(0, maxRecommendations),
        total: recommendations.length
      };
    } catch (error) {
      console.error('Erro ao obter recomendações:', error);
      throw error;
    }
  }

  static async getRecentlyAdded(userId, config) {
    try {
      const showMovies = config.showMovies !== false;
      const showPeople = config.showPeople !== false;
      const maxItems = config.maxItems || 5;

      const recentItems = [];

      if (showMovies) {
        const recentMovies = Movie.findByUserId(userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, maxItems);
        
        recentMovies.forEach(movie => {
          recentItems.push({
            type: 'movie',
            id: movie.id,
            title: movie.title,
            year: movie.year,
            poster: movie.poster,
            created_at: movie.created_at,
            category: 'Filmes'
          });
        });
      }

      if (showPeople) {
        const recentPeople = Person.findByUserId(userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, maxItems);
        
        recentPeople.forEach(person => {
          recentItems.push({
            type: 'person',
            id: person.id,
            title: person.name,
            poster: person.image,
            created_at: person.created_at,
            category: 'Pessoas'
          });
        });
      }

      // Ordenar por data de criação
      recentItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return {
        items: recentItems.slice(0, maxItems),
        total: recentItems.length
      };
    } catch (error) {
      console.error('Erro ao obter itens recentes:', error);
      throw error;
    }
  }

  static async getTopRated(userId, config) {
    try {
      const maxItems = config.maxItems || 10;
      const minRating = config.minRating || 7.0;
      
      const movies = Movie.findByUserId(userId)
        .filter(m => (m.rating_imdb || 0) >= minRating)
        .sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0))
        .slice(0, maxItems);

      return {
        movies: movies,
        total: movies.length
      };
    } catch (error) {
      console.error('Erro ao obter filmes melhor avaliados:', error);
      throw error;
    }
  }

  static async getWatchlist(userId, config) {
    try {
      const showMovies = config.showMovies !== false;
      const showPeople = config.showPeople !== false;
      const maxItems = config.maxItems || 10;

      const watchlistItems = [];

      if (showMovies) {
        const watchlistMovies = Movie.findByUserId(userId)
          .filter(m => m.watched === 0)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, maxItems);
        
        watchlistMovies.forEach(movie => {
          watchlistItems.push({
            type: 'movie',
            id: movie.id,
            title: movie.title,
            year: movie.year,
            poster: movie.poster,
            added_date: movie.created_at,
            category: 'Filmes para Assistir'
          });
        });
      }

      if (showPeople) {
        const watchlistPeople = Person.findByUserId(userId)
          .filter(p => p.followed === 1)
          .sort((a, b) => new Date(b.followed_date) - new Date(a.followed_date))
          .slice(0, maxItems);
        
        watchlistPeople.forEach(person => {
          watchlistItems.push({
            type: 'person',
            id: person.id,
            title: person.name,
            poster: person.image,
            added_date: person.followed_date,
            category: 'Pessoas Seguidas'
          });
        });
      }

      return {
        items: watchlistItems.slice(0, maxItems),
        total: watchlistItems.length
      };
    } catch (error) {
      console.error('Erro ao obter lista de observação:', error);
      throw error;
    }
  }

  static async getUpcomingReleases(userId, config) {
    try {
      const maxItems = config.maxItems || 10;
      const daysAhead = config.daysAhead || 30;
      
      // Esta é uma implementação de exemplo - você pode integrar com APIs reais
      const upcomingMovies = Movie.findByUserId(userId)
        .filter(m => {
          // Filtrar filmes futuros (implementação de exemplo)
          const releaseDate = new Date(m.year, 0, 1); // Usando ano como exemplo
          const now = new Date();
          const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
          return releaseDate > now && releaseDate <= futureDate;
        })
        .slice(0, maxItems);

      return {
        movies: upcomingMovies,
        total: upcomingMovies.length,
        daysAhead: daysAhead
      };
    } catch (error) {
      console.error('Erro ao obter próximos lançamentos:', error);
      throw error;
    }
  }

  static async getFavorites(userId, config) {
    try {
      const showMovies = config.showMovies !== false;
      const showPeople = config.showPeople !== false;
      const maxItems = config.maxItems || 10;

      const favoriteItems = [];

      if (showMovies) {
        const favoriteMovies = Movie.findByUserId(userId)
          .filter(m => m.favorite === 1)
          .sort((a, b) => (b.personal_rating || 0) - (a.personal_rating || 0))
          .slice(0, maxItems);
        
        favoriteMovies.forEach(movie => {
          favoriteItems.push({
            type: 'movie',
            id: movie.id,
            title: movie.title,
            year: movie.year,
            poster: movie.poster,
            rating: movie.personal_rating || movie.rating_imdb,
            category: 'Filmes Favoritos'
          });
        });
      }

      if (showPeople) {
        const favoritePeople = Person.findByUserId(userId)
          .filter(p => p.favorite === 1)
          .sort((a, b) => new Date(b.favorite_date) - new Date(a.favorite_date))
          .slice(0, maxItems);
        
        favoritePeople.forEach(person => {
          favoriteItems.push({
            type: 'person',
            id: person.id,
            title: person.name,
            poster: person.image,
            category: 'Pessoas Favoritas'
          });
        });
      }

      return {
        items: favoriteItems.slice(0, maxItems),
        total: favoriteItems.length
      };
    } catch (error) {
      console.error('Erro ao obter favoritos:', error);
      throw error;
    }
  }

  static async getGenreDistribution(userId, config) {
    try {
      const movies = Movie.findByUserId(userId);
      const distribution = this.calculateGenreDistribution(movies);
      
      return {
        distribution: distribution,
        total: movies.length
      };
    } catch (error) {
      console.error('Erro ao obter distribuição por gênero:', error);
      throw error;
    }
  }

  static async getYearDistribution(userId, config) {
    try {
      const movies = Movie.findByUserId(userId);
      const distribution = this.calculateYearDistribution(movies);
      
      return {
        distribution: distribution,
        total: movies.length,
        groupByDecade: config.groupByDecade || false
      };
    } catch (error) {
      console.error('Erro ao obter distribuição por ano:', error);
      throw error;
    }
  }

  static async getQuickActions(userId, config) {
    try {
      const actions = config.actions || ['add-movie', 'add-person', 'search-movie', 'search-person', 'create-backup'];
      
      return {
        actions: actions,
        total: actions.length
      };
    } catch (error) {
      console.error('Erro ao obter ações rápidas:', error);
      throw error;
    }
  }

  static async getCalendarData(userId, config) {
    try {
      const daysToShow = config.daysToShow || 30;
      
      // Esta é uma implementação de exemplo
      const calendarEvents = [];
      
      // Adicionar lembretes
      if (config.showReminders !== false) {
        // Implementar obtenção de lembretes
        calendarEvents.push({
          type: 'reminder',
          title: 'Lembrete de exemplo',
          date: new Date(),
          category: 'Lembretes'
        });
      }

      // Adicionar aniversários
      if (config.showBirthdays !== false) {
        // Implementar obtenção de aniversários
        calendarEvents.push({
          type: 'birthday',
          title: 'Aniversário de exemplo',
          date: new Date(),
          category: 'Aniversários'
        });
      }

      // Adicionar datas de lançamento
      if (config.showReleaseDates !== false) {
        // Implementar obtenção de datas de lançamento
        calendarEvents.push({
          type: 'release',
          title: 'Lançamento de exemplo',
          date: new Date(),
          category: 'Lançamentos'
        });
      }

      return {
        events: calendarEvents,
        total: calendarEvents.length,
        daysToShow: daysToShow
      };
    } catch (error) {
      console.error('Erro ao obter dados do calendário:', error);
      throw error;
    }
  }

  static async getRecentNotifications(userId, config) {
    try {
      const maxNotifications = config.maxNotifications || 5;
      const showUnreadOnly = config.showUnreadOnly || false;
      
      // Esta é uma implementação de exemplo
      const notifications = [
        {
          id: 1,
          title: 'Novo filme adicionado',
          message: 'O filme "Exemplo" foi adicionado à sua coleção',
          type: 'success',
          timestamp: new Date().toISOString(),
          is_read: false
        }
      ];

      return {
        notifications: notifications.slice(0, maxNotifications),
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length
      };
    } catch (error) {
      console.error('Erro ao obter notificações recentes:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  static calculateGenreDistribution(movies) {
    const genreCount = {};
    movies.forEach(movie => {
      const genres = JSON.parse(movie.genres || '[]');
      genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  }

  static calculateYearDistribution(movies) {
    const yearCount = {};
    movies.forEach(movie => {
      if (movie.year) {
        yearCount[movie.year] = (yearCount[movie.year] || 0) + 1;
      }
    });

    return Object.entries(yearCount)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }

  static calculateRoleDistribution(people) {
    const roleCount = {};
    people.forEach(person => {
      const roles = JSON.parse(person.role || '[]');
      roles.forEach(role => {
        roleCount[role] = (roleCount[role] || 0) + 1;
      });
    });

    return Object.entries(roleCount)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }

  static getFavoriteActors(people, limit = 5) {
    return people
      .filter(p => JSON.parse(p.role || '[]').includes('ator'))
      .sort((a, b) => (b.favorite_date ? new Date(b.favorite_date) : new Date(0)) - (a.favorite_date ? new Date(a.favorite_date) : new Date(0)))
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        favorite_date: p.favorite_date
      }));
  }

  static getFavoriteDirectors(people, limit = 5) {
    return people
      .filter(p => JSON.parse(p.role || '[]').includes('diretor'))
      .sort((a, b) => (b.favorite_date ? new Date(b.favorite_date) : new Date(0)) - (a.favorite_date ? new Date(a.favorite_date) : new Date(0)))
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        favorite_date: p.favorite_date
      }));
  }

  static async shareDashboard(dashboardId, userId) {
    try {
      const dashboard = Dashboard.findById(dashboardId);
      if (!dashboard || dashboard.user_id !== userId) {
        throw new Error('Dashboard não encontrado ou acesso negado');
      }

      if (!dashboard.allow_sharing) {
        throw new Error('Compartilhamento não permitido para este dashboard');
      }

      if (!dashboard.sharing_token) {
        const sharingToken = Dashboard.generateSharingToken();
        Dashboard.update(dashboardId, {
          ...dashboard,
          sharing_token: sharingToken,
          is_public: 1
        });
        dashboard.sharing_token = sharingToken;
        dashboard.is_public = 1;
      }

      return {
        dashboard: dashboard,
        shareUrl: `${process.env.APP_URL || 'http://localhost:3000'}/dashboards/shared/${dashboard.sharing_token}`,
        token: dashboard.sharing_token
      };
    } catch (error) {
      console.error('Erro ao compartilhar dashboard:', error);
      throw error;
    }
  }

  static async getSharedDashboard(token) {
    try {
      const dashboard = Dashboard.getSharedDashboard(token);
      if (!dashboard) {
        throw new Error('Dashboard compartilhado não encontrado');
      }

      const widgets = Dashboard.getWidgets(dashboard.id);
      return {
        ...dashboard,
        widgets: widgets
      };
    } catch (error) {
      console.error('Erro ao obter dashboard compartilhado:', error);
      throw error;
    }
  }

  static async duplicateDashboard(dashboardId, userId, newName) {
    try {
      const newDashboard = Dashboard.duplicate(dashboardId, userId, newName);
      return newDashboard;
    } catch (error) {
      console.error('Erro ao duplicar dashboard:', error);
      throw error;
    }
  }

  static async getDashboardStats(userId) {
    try {
      const stats = Dashboard.getDashboardStats(userId);
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de dashboards:', error);
      throw error;
    }
  }

  static async exportDashboard(dashboardId, format = 'json') {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      
      switch (format) {
        case 'json':
          return dashboard;
        case 'csv':
          return this.convertToCSV(dashboard);
        case 'pdf':
          return this.convertToPDF(dashboard);
        default:
          throw new Error(`Formato de exportação não suportado: ${format}`);
      }
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      throw error;
    }
  }

  static convertToCSV(dashboard) {
    // Implementar conversão para CSV
    return 'CSV data here';
  }

  static convertToPDF(dashboard) {
    // Implementar conversão para PDF
    return 'PDF data here';
  }

  static async scheduleDashboardUpdates() {
    try {
      if (dashboardConfig.general.autoRefresh) {
        setInterval(async () => {
          // Atualizar dados de dashboards ativos
          console.log('Atualizando dados de dashboards...');
        }, dashboardConfig.general.refreshInterval);
      }
    } catch (error) {
      console.error('Erro ao agendar atualizações de dashboards:', error);
    }
  }
}

module.exports = DashboardService;