// criticConfig.js

const criticConfig = {
  // Configurações gerais
  general: {
    enabled: process.env.CRITIC_ENABLED === 'true' || true,
    autoUpdate: process.env.CRITIC_AUTO_UPDATE === 'true' || true,
    updateFrequency: process.env.CRITIC_UPDATE_FREQUENCY || 'daily', // hourly, daily, weekly
    maxRetries: parseInt(process.env.CRITIC_MAX_RETRIES) || 3,
    timeout: parseInt(process.env.CRITIC_TIMEOUT) || 10000, // 10 segundos
    parallelRequests: parseInt(process.env.CRITIC_PARALLEL_REQUESTS) || 5
  },

  // APIs de crítica suportadas
  apis: {
    imdb: {
      id: 'imdb',
      name: 'IMDb',
      enabled: process.env.IMDB_ENABLED === 'true' || true,
      apiKey: process.env.IMDB_API_KEY || null,
      baseUrl: 'https://www.imdb.com',
      apiUrl: 'https://api.imdb.com',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '🎬',
      color: '#f5c518',
      maxRequestsPerMinute: 50,
      requiresApiKey: false
    },
    rottenTomatoes: {
      id: 'rt',
      name: 'Rotten Tomatoes',
      enabled: process.env.ROTTEN_TOMATOES_ENABLED === 'true' || true,
      apiKey: process.env.ROTTEN_TOMATOES_API_KEY || null,
      baseUrl: 'https://www.rottentomatoes.com',
      apiUrl: 'https://www.rottentomatoes.com/api/private',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '🍅',
      color: '#fa3200',
      maxRequestsPerMinute: 30,
      requiresApiKey: false
    },
    letterboxd: {
      id: 'lbxd',
      name: 'Letterboxd',
      enabled: process.env.LETTERBOXD_ENABLED === 'true' || true,
      apiKey: process.env.LETTERBOXD_API_KEY || null,
      baseUrl: 'https://letterboxd.com',
      apiUrl: 'https://api.letterboxd.com/api/v0',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '🎥',
      color: '#2c3440',
      maxRequestsPerMinute: 20,
      requiresApiKey: true
    },
    filmAffinity: {
      id: 'fa',
      name: 'FilmAffinity',
      enabled: process.env.FILMAFFINITY_ENABLED === 'true' || true,
      apiKey: process.env.FILMAFFINITY_API_KEY || null,
      baseUrl: 'https://www.filmaffinity.com',
      apiUrl: 'https://www.filmaffinity.com/api',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '🌟',
      color: '#ff6b00',
      maxRequestsPerMinute: 40,
      requiresApiKey: false
    },
    trakt: {
      id: 'trakt',
      name: 'Trakt.tv',
      enabled: process.env.TRAKT_ENABLED === 'true' || true,
      apiKey: process.env.TRAKT_API_KEY || null,
      baseUrl: 'https://trakt.tv',
      apiUrl: 'https://api.trakt.tv',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '🔥',
      color: '#ed1c24',
      maxRequestsPerMinute: 100,
      requiresApiKey: true
    },
    metacritic: {
      id: 'mc',
      name: 'Metacritic',
      enabled: process.env.METACRITIC_ENABLED === 'true' || true,
      apiKey: process.env.METACRITIC_API_KEY || null,
      baseUrl: 'https://www.metacritic.com',
      apiUrl: 'https://www.metacritic.com/api',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '💯',
      color: '#000000',
      maxRequestsPerMinute: 25,
      requiresApiKey: false
    },
    tmdb: {
      id: 'tmdb',
      name: 'TMDb',
      enabled: process.env.TMDB_ENABLED === 'true' || true,
      apiKey: process.env.TMDB_API_KEY || 'seu_api_key_aqui',
      baseUrl: 'https://www.themoviedb.org',
      apiUrl: 'https://api.themoviedb.org/3',
      userAgent: 'MovieNizer/1.0 (https://github.com/seu-usuario/movienizer)',
      icon: '📺',
      color: '#0d253f',
      maxRequestsPerMinute: 40,
      requiresApiKey: true
    }
  },

  // Configurações de cache
  cache: {
    enabled: process.env.CRITIC_CACHE_ENABLED === 'true' || true,
    directory: './cache/critic',
    ttl: parseInt(process.env.CRITIC_CACHE_TTL) || 86400, // 24 horas em segundos
    maxSize: parseInt(process.env.CRITIC_CACHE_MAX_SIZE) || 100, // MB
    cleanupInterval: parseInt(process.env.CRITIC_CACHE_CLEANUP_INTERVAL) || 3600000 // 1 hora
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.CRITIC_NOTIFICATIONS_ENABLED === 'true' || true,
    email: process.env.CRITIC_NOTIFICATION_EMAIL === 'true' || false,
    system: process.env.CRITIC_NOTIFICATION_SYSTEM === 'true' || true,
    ratingChanges: process.env.CRITIC_NOTIFY_RATING_CHANGES === 'true' || true,
    newRatings: process.env.CRITIC_NOTIFY_NEW_RATINGS === 'true' || true,
    improvedRatings: process.env.CRITIC_NOTIFY_IMPROVED_RATINGS === 'true' || true,
    declinedRatings: process.env.CRITIC_NOTIFY_DECLINED_RATINGS === 'true' || true
  },

  // Configurações de agendamento
  schedule: {
    hourly: '0 * * * *', // a cada hora
    daily: '0 3 * * *',   // diariamente às 3h
    weekly: '0 4 * * 0',  // semanalmente domingo às 4h
    monthly: '0 5 1 * *'  // mensalmente no dia 1 às 5h
  },

  // Configurações de segurança
  security: {
    encryptApiKeys: process.env.CRITIC_ENCRYPT_API_KEYS === 'true' || true,
    salt: process.env.CRITIC_ENCRYPTION_SALT || 'movienizer-critic-salt-16-chars!',
    algorithm: process.env.CRITIC_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de fallback
  fallback: {
    useFallbackApis: process.env.CRITIC_USE_FALLBACK_APIS === 'true' || true,
    fallbackOrder: ['imdb', 'tmdb', 'rottenTomatoes', 'trakt', 'letterboxd'],
    maxFallbackAttempts: parseInt(process.env.CRITIC_MAX_FALLBACK_ATTEMPTS) || 3
  }
};

module.exports = criticConfig;