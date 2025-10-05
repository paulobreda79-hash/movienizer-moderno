// dashboardConfig.js

const dashboardConfig = {
  // Configurações gerais de dashboards
  general: {
    enabled: process.env.DASHBOARD_ENABLED === 'true' || true,
    maxDashboardsPerUser: parseInt(process.env.MAX_DASHBOARDS_PER_USER) || 10,
    maxWidgetsPerDashboard: parseInt(process.env.MAX_WIDGETS_PER_DASHBOARD) || 20,
    autoRefresh: process.env.DASHBOARD_AUTO_REFRESH === 'true' || true,
    refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL) || 300000, // 5 minutos
    allowSharing: process.env.DASHBOARD_ALLOW_SHARING === 'true' || true,
    defaultLayout: process.env.DASHBOARD_DEFAULT_LAYOUT || 'grid' // grid, flex, masonry
  },

  // Widgets disponíveis
  widgets: {
    movieStats: {
      id: 'movie-stats',
      name: 'Estatísticas de Filmes',
      description: 'Mostra estatísticas sobre sua coleção de filmes',
      category: 'movies',
      icon: '🎬',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        showCount: true,
        showRating: true,
        showGenreDistribution: true,
        showYearDistribution: true,
        showWatchedPercentage: true
      }
    },
    personStats: {
      id: 'person-stats',
      name: 'Estatísticas de Pessoas',
      description: 'Mostra estatísticas sobre pessoas na sua coleção',
      category: 'people',
      icon: '👥',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        showCount: true,
        showRoleDistribution: true,
        showFavoriteActors: true,
        showFavoriteDirectors: true,
        showFollowed: true
      }
    },
    streamingAvailability: {
      id: 'streaming-availability',
      name: 'Disponibilidade em Streaming',
      description: 'Mostra quais filmes estão disponíveis em plataformas de streaming',
      category: 'streaming',
      icon: '📺',
      size: 'large',
      configurable: true,
      defaultConfig: {
        showPlatforms: ['netflix', 'disney', 'prime'],
        showAvailableCount: true,
        showUnavailableCount: true,
        showPercentage: true
      }
    },
    recommendations: {
      id: 'recommendations',
      name: 'Recomendações Personalizadas',
      description: 'Mostra filmes recomendados com base na sua coleção',
      category: 'recommendations',
      icon: '💡',
      size: 'large',
      configurable: true,
      defaultConfig: {
        maxRecommendations: 10,
        showReason: true,
        showScore: true,
        showPoster: true
      }
    },
    recentlyAdded: {
      id: 'recently-added',
      name: 'Adicionados Recentemente',
      description: 'Mostra os filmes e pessoas adicionados recentemente',
      category: 'activity',
      icon: '🆕',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        showMovies: true,
        showPeople: true,
        maxItems: 5,
        showPoster: true,
        showDate: true
      }
    },
    topRated: {
      id: 'top-rated',
      name: 'Melhor Avaliados',
      description: 'Mostra os filmes com melhor avaliação',
      category: 'movies',
      icon: '⭐',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        maxItems: 10,
        showRating: true,
        showPoster: true,
        minRating: 7.0
      }
    },
    watchlist: {
      id: 'watchlist',
      name: 'Lista de Observação',
      description: 'Mostra filmes e pessoas na sua lista de observação',
      category: 'activity',
      icon: '📋',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        showMovies: true,
        showPeople: true,
        maxItems: 10,
        showPoster: true,
        showDateAdded: true
      }
    },
    upcomingReleases: {
      id: 'upcoming-releases',
      name: 'Próximos Lançamentos',
      description: 'Mostra filmes que serão lançados em breve',
      category: 'movies',
      icon: '📅',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        maxItems: 10,
        showReleaseDate: true,
        showPoster: true,
        daysAhead: 30
      }
    },
    favorites: {
      id: 'favorites',
      name: 'Favoritos',
      description: 'Mostra seus filmes e pessoas favoritos',
      category: 'activity',
      icon: '❤️',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        showMovies: true,
        showPeople: true,
        maxItems: 10,
        showPoster: true,
        showRating: true
      }
    },
    genreDistribution: {
      id: 'genre-distribution',
      name: 'Distribuição por Gênero',
      description: 'Mostra gráfico de distribuição de filmes por gênero',
      category: 'analytics',
      icon: '📊',
      size: 'large',
      configurable: true,
      defaultConfig: {
        showChart: true,
        chartType: 'doughnut', // doughnut, bar, pie
        showLegend: true,
        showPercentage: true
      }
    },
    yearDistribution: {
      id: 'year-distribution',
      name: 'Distribuição por Ano',
      description: 'Mostra gráfico de distribuição de filmes por ano',
      category: 'analytics',
      icon: '📈',
      size: 'large',
      configurable: true,
      defaultConfig: {
        showChart: true,
        chartType: 'bar', // bar, line
        showLegend: true,
        groupByDecade: false
      }
    },
    quickActions: {
      id: 'quick-actions',
      name: 'Ações Rápidas',
      description: 'Mostra botões para ações rápidas',
      category: 'utility',
      icon: '⚡',
      size: 'small',
      configurable: true,
      defaultConfig: {
        actions: ['add-movie', 'add-person', 'search-movie', 'search-person', 'create-backup']
      }
    },
    calendar: {
      id: 'calendar',
      name: 'Calendário',
      description: 'Mostra lembretes e datas importantes',
      category: 'utility',
      icon: '🗓️',
      size: 'medium',
      configurable: true,
      defaultConfig: {
        showReminders: true,
        showBirthdays: true,
        showReleaseDates: true,
        daysToShow: 30
      }
    },
    notifications: {
      id: 'notifications',
      name: 'Notificações Recentes',
      description: 'Mostra notificações recentes',
      category: 'activity',
      icon: '🔔',
      size: 'small',
      configurable: true,
      defaultConfig: {
        maxNotifications: 5,
        showUnreadOnly: false,
        showTimestamp: true
      }
    }
  },

  // Categorias de widgets
  categories: {
    movies: { name: 'Filmes', icon: '🎬', color: '#3498db' },
    people: { name: 'Pessoas', icon: '👥', color: '#e74c3c' },
    streaming: { name: 'Streaming', icon: '📺', color: '#2ecc71' },
    recommendations: { name: 'Recomendações', icon: '💡', color: '#f39c12' },
    activity: { name: 'Atividade', icon: '🔥', color: '#9b59b6' },
    analytics: { name: 'Analytics', icon: '📊', color: '#1abc9c' },
    utility: { name: 'Utilitários', icon: '🛠️', color: '#34495e' }
  },

  // Layouts disponíveis
  layouts: {
    grid: {
      name: 'Grade',
      description: 'Layout em grade fixa',
      icon: '⬜',
      columns: 12,
      rows: 'auto',
      gap: '20px'
    },
    flex: {
      name: 'Flexível',
      description: 'Layout flexível com tamanhos variáveis',
      icon: '↔️',
      columns: 'auto',
      rows: 'auto',
      gap: '15px'
    },
    masonry: {
      name: 'Alvenaria',
      description: 'Layout estilo Pinterest',
      icon: '🧱',
      columns: 'auto',
      rows: 'auto',
      gap: '15px'
    }
  },

  // Configurações de exportação
  export: {
    formats: ['png', 'jpg', 'pdf', 'csv', 'json'],
    defaultFormat: 'png',
    quality: 90,
    includeData: true,
    includeCharts: true,
    includeFilters: true
  },

  // Configurações de compartilhamento
  sharing: {
    enabled: process.env.DASHBOARD_SHARING_ENABLED === 'true' || true,
    allowPublic: process.env.DASHBOARD_PUBLIC_SHARING === 'true' || false,
    allowPrivate: process.env.DASHBOARD_PRIVATE_SHARING === 'true' || true,
    maxShares: parseInt(process.env.DASHBOARD_MAX_SHARES) || 5,
    expirationDays: parseInt(process.env.DASHBOARD_SHARE_EXPIRATION_DAYS) || 30
  },

  // Configurações de segurança
  security: {
    allowEmbedding: process.env.DASHBOARD_ALLOW_EMBEDDING === 'true' || false,
    requireAuthentication: process.env.DASHBOARD_REQUIRE_AUTH === 'true' || true,
    rateLimit: parseInt(process.env.DASHBOARD_RATE_LIMIT) || 100, // requisições por hora
    maxWidgetRefreshRate: parseInt(process.env.DASHBOARD_MAX_WIDGET_REFRESH) || 5000 // 5 segundos
  }
};

module.exports = dashboardConfig;