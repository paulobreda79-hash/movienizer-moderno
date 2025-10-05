// streamingConfig.js

const streamingConfig = {
  // Configurações gerais
  general: {
    enabled: process.env.STREAMING_ENABLED === 'true' || true,
    autoCheck: process.env.STREAMING_AUTO_CHECK === 'true' || true,
    checkFrequency: process.env.STREAMING_CHECK_FREQUENCY || 'daily', // hourly, daily, weekly
    cacheTTL: parseInt(process.env.STREAMING_CACHE_TTL) || 24, // horas
    maxRetries: parseInt(process.env.STREAMING_MAX_RETRIES) || 3
  },

  // Plataformas suportadas
  platforms: {
    netflix: {
      id: 'nfx',
      name: 'Netflix',
      enabled: true,
      icon: 'netflix',
      color: '#e50914',
      baseUrl: 'https://www.netflix.com'
    },
    disney: {
      id: 'dsnp',
      name: 'Disney+',
      enabled: true,
      icon: 'disney',
      color: '#113ccf',
      baseUrl: 'https://www.disneyplus.com'
    },
    prime: {
      id: 'amzn',
      name: 'Amazon Prime Video',
      enabled: true,
      icon: 'prime',
      color: '#00a8e1',
      baseUrl: 'https://www.primevideo.com'
    },
    apple: {
      id: 'atvp',
      name: 'Apple TV+',
      enabled: true,
      icon: 'apple',
      color: '#000000',
      baseUrl: 'https://tv.apple.com'
    },
    hbo: {
      id: 'hbo',
      name: 'HBO Max',
      enabled: true,
      icon: 'hbo',
      color: '#000000',
      baseUrl: 'https://www.hbomax.com'
    },
    hulu: {
      id: 'hulu',
      name: 'Hulu',
      enabled: true,
      icon: 'hulu',
      color: '#1ce783',
      baseUrl: 'https://www.hulu.com'
    },
    paramount: {
      id: 'pmax',
      name: 'Paramount+',
      enabled: true,
      icon: 'paramount',
      color: '#0064ff',
      baseUrl: 'https://www.paramountplus.com'
    },
    starz: {
      id: 'srz',
      name: 'Starz',
      enabled: true,
      icon: 'starz',
      color: '#000000',
      baseUrl: 'https://www.starz.com'
    },
    showtime: {
      id: 'sho',
      name: 'Showtime',
      enabled: true,
      icon: 'showtime',
      color: '#c7102f',
      baseUrl: 'https://www.sho.com'
    },
    crunchyroll: {
      id: 'crav',
      name: 'Crunchyroll',
      enabled: true,
      icon: 'crunchyroll',
      color: '#f47521',
      baseUrl: 'https://www.crunchyroll.com'
    },
    tubi: {
      id: 'tubi',
      name: 'Tubi',
      enabled: true,
      icon: 'tubi',
      color: '#ff5200',
      baseUrl: 'https://www.tubitv.com'
    },
    kanopy: {
      id: 'kanp',
      name: 'Kanopy',
      enabled: true,
      icon: 'kanopy',
      color: '#000000',
      baseUrl: 'https://www.kanopy.com'
    }
  },

  // Configurações da API JustWatch
  justwatch: {
    apiUrl: 'https://apis.justwatch.com',
    locale: process.env.JUSTWATCH_LOCALE || 'pt_BR',
    country: process.env.JUSTWATCH_COUNTRY || 'BR',
    apiKey: process.env.JUSTWATCH_API_KEY || null,
    userAgent: 'MovieNizer/1.0'
  },

  // Configurações de cache
  cache: {
    enabled: process.env.STREAMING_CACHE_ENABLED === 'true' || true,
    directory: './cache/streaming',
    maxSize: parseInt(process.env.STREAMING_CACHE_MAX_SIZE) || 100, // MB
    cleanupInterval: parseInt(process.env.STREAMING_CACHE_CLEANUP_INTERVAL) || 3600000 // 1 hora
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.STREAMING_NOTIFICATIONS_ENABLED === 'true' || true,
    email: process.env.STREAMING_NOTIFICATION_EMAIL === 'true' || false,
    system: process.env.STREAMING_NOTIFICATION_SYSTEM === 'true' || true,
    newAvailability: process.env.STREAMING_NOTIFY_NEW_AVAILABILITY === 'true' || true,
    removedAvailability: process.env.STREAMING_NOTIFY_REMOVED_AVAILABILITY === 'true' || true
  },

  // Configurações de agendamento
  schedule: {
    hourly: '0 * * * *', // a cada hora
    daily: '0 3 * * *',   // diariamente às 3h
    weekly: '0 4 * * 0'   // semanalmente domingo às 4h
  }
};

module.exports = streamingConfig;