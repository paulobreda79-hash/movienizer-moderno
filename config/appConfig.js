// config/appConfig.js

const appConfig = {
  // Informações do aplicativo
  app: {
    name: 'MovieNizer Mobile',
    version: '1.0.0',
    buildNumber: '1001',
    bundleId: 'com.movienizer.mobile',
    packageName: 'com.movienizer.mobile',
    displayName: 'MovieNizer'
  },

  // Configurações de API
  api: {
    baseUrl: 'https://api.movienizer.com/v1',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    retryAttempts: 3,
    retryDelay: 2000
  },

  // Configurações de banco de dados local
  database: {
    dbName: 'MovieNizerDB',
    version: 1,
    tables: [
      'movies',
      'people',
      'ratings',
      'watchlist',
      'favorites',
      'reminders',
      'notifications',
      'settings',
      'activity_logs',
      'backups',
      'streaming',
      'recommendations',
      'tags',
      'voice_commands'
    ]
  },

  // Configurações de modo offline
  offline: {
    enabled: true,
    autoSync: true,
    syncOnConnect: true,
    maxCacheSize: 50, // MB
    cacheTTL: 7, // dias
    compressData: true,
    encryptData: false
  },

  // Configurações de reconhecimento de voz
  voice: {
    enabled: true,
    autoStart: false,
    continuousListening: false,
    maxRecordingTime: 10, // segundos
    silenceThreshold: 0.01,
    silenceTimeout: 2000, // milissegundos
    autoStopOnSilence: true,
    languages: {
      'pt-BR': {
        name: 'Português (Brasil)',
        code: 'pt-BR',
        recognitionLang: 'pt-BR',
        synthesisLang: 'pt-BR',
        default: true,
        icon: '🇧🇷',
        voiceName: 'Google português do Brasil'
      },
      'en-US': {
        name: 'English (United States)',
        code: 'en-US',
        recognitionLang: 'en-US',
        synthesisLang: 'en-US',
        default: false,
        icon: '🇺🇸',
        voiceName: 'Google US English'
      },
      'es-ES': {
        name: 'Español (España)',
        code: 'es-ES',
        recognitionLang: 'es-ES',
        synthesisLang: 'es-ES',
        default: false,
        icon: '🇪🇸',
        voiceName: 'Google español'
      }
    }
  },

  // Configurações de tags
  tags: {
    enabled: true,
    maxTagsPerItem: 20,
    maxTagLength: 50,
    allowDuplicateTags: false,
    caseSensitive: false,
    autoSuggest: true,
    autoComplete: true,
    suggestLimit: 10
  },

  // Configurações de notificações
  notifications: {
    enabled: true,
    push: true,
    local: true,
    sound: true,
    vibration: true,
    badge: true,
    categories: [
      { id: 'movie', name: 'Filmes', icon: '🎬' },
      { id: 'person', name: 'Pessoas', icon: '👤' },
      { id: 'rating', name: 'Ratings', icon: '⭐' },
      { id: 'reminder', name: 'Lembretes', icon: '⏰' },
      { id: 'backup', name: 'Backup', icon: '💾' }
    ]
  },

  // Configurações de tema
  theme: {
    darkMode: false,
    primaryColor: '#3498db',
    secondaryColor: '#2ecc71',
    accentColor: '#e74c3c',
    backgroundColor: '#f5f5f5',
    textColor: '#333',
    cardColor: '#fff',
    shadowColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'System'
  },

  // Configurações de autenticação
  auth: {
    enabled: true,
    autoLogin: true,
    tokenExpiry: 7, // dias
    refreshToken: true,
    biometric: true,
    socialLogin: true,
    providers: ['google', 'apple', 'facebook']
  },

  // Configurações de internacionalização
  i18n: {
    supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
    defaultLanguage: 'pt-BR',
    autoDetectLanguage: true,
    translationCacheTTL: 86400 // 24 horas em segundos
  },

  // Configurações de acessibilidade
  accessibility: {
    highContrastMode: false,
    largeTextMode: false,
    screenReaderSupport: true,
    keyboardNavigation: true,
    focusIndicators: true
  },

  // Configurações de performance
  performance: {
    enableCompression: true,
    compressionLevel: 6,
    enableIndexing: true,
    maxConcurrentOperations: 5,
    operationTimeout: 30000 // 30 segundos
  },

  // Configurações de segurança
  security: {
    encryptLocalData: false,
    salt: 'movienizer-mobile-salt-16-chars!',
    algorithm: 'aes-256-cbc'
  },

  // Configurações de backup
  backup: {
    enabled: true,
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    maxBackups: 10,
    compressBackups: true,
    encryptBackups: false
  },

  // Configurações de importação/exportação
  importExport: {
    enabled: true,
    maxFileSize: 10, // MB
    allowedFormats: ['json', 'csv', 'txt'],
    defaultFormat: 'json',
    includeHierarchy: true,
    includeUsage: true
  },

  // Configurações de analytics
  analytics: {
    enabled: true,
    provider: 'firebase',
    trackEvents: true,
    trackScreens: true,
    trackErrors: true
  },

  // Configurações de feedback
  feedback: {
    enabled: true,
    email: 'feedback@movienizer.com',
    rateApp: true,
    contactForm: true
  },

  // Configurações de atualização
  updates: {
    enabled: true,
    checkFrequency: 'daily',
    autoUpdate: true,
    updateUrl: 'https://api.movienizer.com/updates',
    downloadUrl: 'https://api.movienizer.com/downloads'
  }
};

export default appConfig;