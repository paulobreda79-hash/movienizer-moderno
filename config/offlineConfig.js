// offlineConfig.js

const offlineConfig = {
  // Configurações gerais de modo offline
  general: {
    enabled: process.env.OFFLINE_ENABLED === 'true' || true,
    autoSync: process.env.OFFLINE_AUTO_SYNC === 'true' || true,
    syncOnConnect: process.env.OFFLINE_SYNC_ON_CONNECT === 'true' || true,
    maxCacheSize: parseInt(process.env.OFFLINE_MAX_CACHE_SIZE) || 500, // MB
    cacheTTL: parseInt(process.env.OFFLINE_CACHE_TTL) || 7, // dias
    compressData: process.env.OFFLINE_COMPRESS_DATA === 'true' || true,
    encryptData: process.env.OFFLINE_ENCRYPT_DATA === 'true' || false
  },

  // Configurações de IndexedDB
  indexedDB: {
    dbName: process.env.OFFLINE_DB_NAME || 'MovieNizerOffline',
    version: parseInt(process.env.OFFLINE_DB_VERSION) || 1,
    stores: {
      movies: {
        name: 'movies',
        keyPath: 'id',
        indexes: ['title', 'year', 'genres', 'director', 'rating_imdb', 'created_at']
      },
      people: {
        name: 'people',
        keyPath: 'id',
        indexes: ['name', 'role', 'birth_date', 'created_at']
      },
      ratings: {
        name: 'ratings',
        keyPath: 'id',
        indexes: ['movie_id', 'api_source', 'rating_value', 'created_at']
      },
      watchlist: {
        name: 'watchlist',
        keyPath: 'id',
        indexes: ['user_id', 'movie_id', 'person_id', 'type', 'added_date']
      },
      favorites: {
        name: 'favorites',
        keyPath: 'id',
        indexes: ['user_id', 'movie_id', 'person_id', 'type', 'added_date']
      },
      reminders: {
        name: 'reminders',
        keyPath: 'id',
        indexes: ['user_id', 'reminder_date', 'is_completed', 'created_at']
      },
      notifications: {
        name: 'notifications',
        keyPath: 'id',
        indexes: ['user_id', 'is_read', 'type', 'priority', 'created_at']
      },
      settings: {
        name: 'settings',
        keyPath: 'key'
      },
      activityLogs: {
        name: 'activity_logs',
        keyPath: 'id',
        indexes: ['user_id', 'action', 'target_type', 'created_at']
      },
      backups: {
        name: 'backups',
        keyPath: 'id',
        indexes: ['user_id', 'type', 'status', 'created_at']
      },
      streaming: {
        name: 'streaming',
        keyPath: 'id',
        indexes: ['movie_id', 'platform', 'available', 'updated_at']
      },
      recommendations: {
        name: 'recommendations',
        keyPath: 'id',
        indexes: ['user_id', 'movie_id', 'score', 'created_at']
      }
    }
  },

  // Configurações de sincronização
  sync: {
    enabled: process.env.OFFLINE_SYNC_ENABLED === 'true' || true,
    frequency: process.env.OFFLINE_SYNC_FREQUENCY || 'hourly', // hourly, daily, weekly
    maxBatchSize: parseInt(process.env.OFFLINE_SYNC_BATCH_SIZE) || 100,
    retryAttempts: parseInt(process.env.OFFLINE_SYNC_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.OFFLINE_SYNC_RETRY_DELAY) || 5000, // 5 segundos
    conflictResolution: process.env.OFFLINE_CONFLICT_RESOLUTION || 'latest' // latest, manual, merge
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.OFFLINE_NOTIFICATIONS_ENABLED === 'true' || true,
    offlineMode: process.env.OFFLINE_NOTIFY_OFFLINE_MODE === 'true' || true,
    onlineMode: process.env.OFFLINE_NOTIFY_ONLINE_MODE === 'true' || true,
    syncComplete: process.env.OFFLINE_NOTIFY_SYNC_COMPLETE === 'true' || true,
    syncError: process.env.OFFLINE_NOTIFY_SYNC_ERROR === 'true' || true,
    dataSaved: process.env.OFFLINE_NOTIFY_DATA_SAVED === 'true' || true,
    dataRestored: process.env.OFFLINE_NOTIFY_DATA_RESTORED === 'true' || true
  },

  // Configurações de backup
  backup: {
    enabled: process.env.OFFLINE_BACKUP_ENABLED === 'true' || true,
    autoBackup: process.env.OFFLINE_AUTO_BACKUP === 'true' || true,
    backupFrequency: process.env.OFFLINE_BACKUP_FREQUENCY || 'daily', // hourly, daily, weekly
    retentionDays: parseInt(process.env.OFFLINE_BACKUP_RETENTION) || 30,
    maxBackups: parseInt(process.env.OFFLINE_MAX_BACKUPS) || 10,
    compressBackups: process.env.OFFLINE_COMPRESS_BACKUPS === 'true' || true,
    encryptBackups: process.env.OFFLINE_ENCRYPT_BACKUPS === 'true' || false
  },

  // Configurações de segurança
  security: {
    encryptionKey: process.env.OFFLINE_ENCRYPTION_KEY || 'movienizer-offline-key-32-chars!!',
    salt: process.env.OFFLINE_ENCRYPTION_SALT || 'movienizer-offline-salt-16-chars!',
    algorithm: process.env.OFFLINE_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de performance
  performance: {
    enableCompression: process.env.OFFLINE_ENABLE_COMPRESSION === 'true' || true,
    compressionLevel: parseInt(process.env.OFFLINE_COMPRESSION_LEVEL) || 6,
    enableIndexing: process.env.OFFLINE_ENABLE_INDEXING === 'true' || true,
    maxConcurrentOperations: parseInt(process.env.OFFLINE_MAX_CONCURRENT_OPERATIONS) || 5,
    operationTimeout: parseInt(process.env.OFFLINE_OPERATION_TIMEOUT) || 30000 // 30 segundos
  },

  // Configurações de interface
  ui: {
    showOfflineIndicator: process.env.OFFLINE_SHOW_INDICATOR === 'true' || true,
    offlineIndicatorPosition: process.env.OFFLINE_INDICATOR_POSITION || 'top-right', // top-left, top-right, bottom-left, bottom-right
    showSyncStatus: process.env.OFFLINE_SHOW_SYNC_STATUS === 'true' || true,
    syncStatusPosition: process.env.OFFLINE_SYNC_STATUS_POSITION || 'bottom', // top, bottom
    enableOfflineModeToggle: process.env.OFFLINE_MODE_TOGGLE === 'true' || true,
    offlineModeTogglePosition: process.env.OFFLINE_MODE_TOGGLE_POSITION || 'sidebar', // sidebar, header, footer
    showOfflineWarning: process.env.OFFLINE_SHOW_WARNING === 'true' || true,
    offlineWarningMessage: process.env.OFFLINE_WARNING_MESSAGE || 'Você está trabalhando offline. Os dados serão sincronizados quando a conexão for restabelecida.'
  },

  // Configurações de widgets
  widgets: {
    enableOfflineWidgets: process.env.OFFLINE_WIDGETS_ENABLED === 'true' || true,
    cacheWidgets: process.env.OFFLINE_CACHE_WIDGETS === 'true' || true,
    widgetCacheTTL: parseInt(process.env.OFFLINE_WIDGET_CACHE_TTL) || 3600, // segundos
    maxCachedWidgets: parseInt(process.env.OFFLINE_MAX_CACHED_WIDGETS) || 50
  },

  // Configurações de relatórios
  reports: {
    enableOfflineReports: process.env.OFFLINE_REPORTS_ENABLED === 'true' || true,
    cacheReports: process.env.OFFLINE_CACHE_REPORTS === 'true' || true,
    reportCacheTTL: parseInt(process.env.OFFLINE_REPORT_CACHE_TTL) || 7200, // segundos
    maxCachedReports: parseInt(process.env.OFFLINE_MAX_CACHED_REPORTS) || 20,
    allowExportOffline: process.env.OFFLINE_ALLOW_EXPORT === 'true' || true,
    exportFormats: process.env.OFFLINE_EXPORT_FORMATS ? 
      process.env.OFFLINE_EXPORT_FORMATS.split(',') : ['pdf', 'csv', 'json']
  },

  // Configurações de busca
  search: {
    enableOfflineSearch: process.env.OFFLINE_SEARCH_ENABLED === 'true' || true,
    searchCacheTTL: parseInt(process.env.OFFLINE_SEARCH_CACHE_TTL) || 1800, // segundos
    maxSearchResults: parseInt(process.env.OFFLINE_MAX_SEARCH_RESULTS) || 100,
    enableFuzzySearch: process.env.OFFLINE_FUZZY_SEARCH === 'true' || true,
    fuzzySearchThreshold: parseFloat(process.env.OFFLINE_FUZZY_THRESHOLD) || 0.6
  },

  // Configurações de edição
  editing: {
    enableOfflineEditing: process.env.OFFLINE_EDITING_ENABLED === 'true' || true,
    autoSaveDrafts: process.env.OFFLINE_AUTO_SAVE_DRAFTS === 'true' || true,
    draftSaveInterval: parseInt(process.env.OFFLINE_DRAFT_SAVE_INTERVAL) || 30000, // 30 segundos
    maxDrafts: parseInt(process.env.OFFLINE_MAX_DRAFTS) || 50,
    enableUndoRedo: process.env.OFFLINE_UNDO_REDO === 'true' || true,
    maxUndoSteps: parseInt(process.env.OFFLINE_MAX_UNDO_STEPS) || 10
  },

  // Configurações de importação/exportação
  importExport: {
    enableOfflineImport: process.env.OFFLINE_IMPORT_ENABLED === 'true' || true,
    enableOfflineExport: process.env.OFFLINE_EXPORT_ENABLED === 'true' || true,
    supportedImportFormats: process.env.OFFLINE_IMPORT_FORMATS ? 
      process.env.OFFLINE_IMPORT_FORMATS.split(',') : ['json', 'csv'],
    supportedExportFormats: process.env.OFFLINE_EXPORT_FORMATS ? 
      process.env.OFFLINE_EXPORT_FORMATS.split(',') : ['json', 'csv'],
    maxImportFileSize: parseInt(process.env.OFFLINE_MAX_IMPORT_SIZE) || 10, // MB
    maxExportFileSize: parseInt(process.env.OFFLINE_MAX_EXPORT_SIZE) || 50, // MB
    enableBatchImport: process.env.OFFLINE_BATCH_IMPORT === 'true' || true,
    enableBatchExport: process.env.OFFLINE_BATCH_EXPORT === 'true' || true
  },

  // Configurações de fallback
  fallback: {
    useFallbackMethods: process.env.OFFLINE_USE_FALLBACK === 'true' || true,
    fallbackToLocalStorage: process.env.OFFLINE_FALLBACK_TO_LOCAL === 'true' || true,
    maxLocalStorageSize: parseInt(process.env.OFFLINE_MAX_LOCAL_SIZE) || 10, // MB
    fallbackToMemory: process.env.OFFLINE_FALLBACK_TO_MEMORY === 'true' || true,
    maxMemorySize: parseInt(process.env.OFFLINE_MAX_MEMORY_SIZE) || 50, // MB
    maxFallbackAttempts: parseInt(process.env.OFFLINE_MAX_FALLBACK_ATTEMPTS) || 3
  },

  // Configurações de compatibilidade
  compatibility: {
    webSQL: process.env.OFFLINE_WEBSQL === 'true' || false,
    localStorage: process.env.OFFLINE_LOCALSTORAGE === 'true' || true,
    sessionStorage: process.env.OFFLINE_SESSIONSTORAGE === 'true' || true,
    fileSystem: process.env.OFFLINE_FILESYSTEM === 'true' || false,
    getUserMedia: process.env.OFFLINE_GET_USER_MEDIA === 'true' || true,
    mediaRecorder: process.env.OFFLINE_MEDIA_RECORDER === 'true' || true,
    audioContext: process.env.OFFLINE_AUDIO_CONTEXT === 'true' || true
  },

  // Configurações de acessibilidade
  accessibility: {
    highContrastMode: process.env.OFFLINE_HIGH_CONTRAST === 'true' || false,
    largeTextMode: process.env.OFFLINE_LARGE_TEXT === 'true' || false,
    screenReaderSupport: process.env.OFFLINE_SCREEN_READER === 'true' || true,
    keyboardNavigation: process.env.OFFLINE_KEYBOARD_NAV === 'true' || true,
    focusIndicators: process.env.OFFLINE_FOCUS_INDICATORS === 'true' || true
  },

  // Configurações de internacionalização
  i18n: {
    supportedLanguages: process.env.OFFLINE_SUPPORTED_LANGUAGES ? 
      process.env.OFFLINE_SUPPORTED_LANGUAGES.split(',') : ['pt-BR', 'en-US', 'es-ES'],
    defaultLanguage: process.env.OFFLINE_DEFAULT_LANGUAGE || 'pt-BR',
    autoDetectLanguage: process.env.OFFLINE_AUTO_DETECT_LANGUAGE === 'true' || true,
    translateOffline: process.env.OFFLINE_TRANSLATE === 'true' || true,
    translationCacheTTL: parseInt(process.env.OFFLINE_TRANSLATION_CACHE_TTL) || 86400 // segundos
  }
};

module.exports = offlineConfig;