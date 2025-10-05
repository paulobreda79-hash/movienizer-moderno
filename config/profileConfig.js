// profileConfig.js

const profileConfig = {
  // Configurações gerais de perfil
  general: {
    enabled: process.env.PROFILE_ENABLED === 'true' || true,
    maxProfiles: parseInt(process.env.PROFILE_MAX_PROFILES) || 5,
    defaultProfile: process.env.PROFILE_DEFAULT || 'main',
    autoSave: process.env.PROFILE_AUTO_SAVE === 'true' || true,
    syncAcrossDevices: process.env.PROFILE_SYNC_DEVICES === 'true' || true
  },

  // Campos de perfil disponíveis
  fields: {
    personal: {
      name: 'Informações Pessoais',
      icon: '👤',
      fields: [
        { id: 'fullName', name: 'Nome Completo', type: 'text', required: false },
        { id: 'nickname', name: 'Apelido', type: 'text', required: false },
        { id: 'birthDate', name: 'Data de Nascimento', type: 'date', required: false },
        { id: 'birthPlace', name: 'Local de Nascimento', type: 'text', required: false },
        { id: 'height', name: 'Altura', type: 'text', required: false },
        { id: 'bio', name: 'Biografia', type: 'textarea', required: false },
        { id: 'avatar', name: 'Avatar', type: 'image', required: false },
        { id: 'coverImage', name: 'Imagem de Capa', type: 'image', required: false }
      ]
    },
    preferences: {
      name: 'Preferências',
      icon: '⚙️',
      fields: [
        { id: 'language', name: 'Idioma', type: 'select', options: ['pt-BR', 'en-US', 'es-ES', 'fr-FR'], default: 'pt-BR' },
        { id: 'theme', name: 'Tema', type: 'select', options: ['light', 'dark', 'auto', 'blue', 'green', 'purple'], default: 'light' },
        { id: 'fontSize', name: 'Tamanho da Fonte', type: 'select', options: ['small', 'medium', 'large'], default: 'medium' },
        { id: 'layout', name: 'Layout', type: 'select', options: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
        { id: 'defaultView', name: 'Visualização Padrão', type: 'select', options: ['grid', 'list', 'table'], default: 'grid' },
        { id: 'sortBy', name: 'Ordenar Por', type: 'select', options: ['title', 'year', 'rating', 'date_added'], default: 'title' },
        { id: 'sortOrder', name: 'Ordem', type: 'select', options: ['asc', 'desc'], default: 'asc' },
        { id: 'itemsPerPage', name: 'Itens por Página', type: 'number', min: 10, max: 100, default: 20 }
      ]
    },
    privacy: {
      name: 'Privacidade',
      icon: '🔒',
      fields: [
        { id: 'profileVisibility', name: 'Visibilidade do Perfil', type: 'select', options: ['public', 'friends', 'private'], default: 'public' },
        { id: 'activityVisibility', name: 'Visibilidade da Atividade', type: 'select', options: ['public', 'friends', 'private'], default: 'friends' },
        { id: 'watchlistVisibility', name: 'Visibilidade da Watchlist', type: 'select', options: ['public', 'friends', 'private'], default: 'private' },
        { id: 'favoritesVisibility', name: 'Visibilidade dos Favoritos', type: 'select', options: ['public', 'friends', 'private'], default: 'private' },
        { id: 'ratingsVisibility', name: 'Visibilidade das Avaliações', type: 'select', options: ['public', 'friends', 'private'], default: 'friends' },
        { id: 'allowMessaging', name: 'Permitir Mensagens', type: 'boolean', default: true },
        { id: 'allowFollowing', name: 'Permitir Seguidores', type: 'boolean', default: true },
        { id: 'showOnlineStatus', name: 'Mostrar Status Online', type: 'boolean', default: true }
      ]
    },
    notifications: {
      name: 'Notificações',
      icon: '🔔',
      fields: [
        { id: 'emailNotifications', name: 'Notificações por E-mail', type: 'boolean', default: true },
        { id: 'pushNotifications', name: 'Notificações Push', type: 'boolean', default: true },
        { id: 'desktopNotifications', name: 'Notificações Desktop', type: 'boolean', default: true },
        { id: 'smsNotifications', name: 'Notificações SMS', type: 'boolean', default: false },
        { id: 'newMovieNotifications', name: 'Notificações de Novos Filmes', type: 'boolean', default: true },
        { id: 'newPersonNotifications', name: 'Notificações de Novas Pessoas', type: 'boolean', default: true },
        { id: 'streamingAvailabilityNotifications', name: 'Notificações de Disponibilidade em Streaming', type: 'boolean', default: true },
        { id: 'recommendationNotifications', name: 'Notificações de Recomendações', type: 'boolean', default: true },
        { id: 'reminderNotifications', name: 'Notificações de Lembretes', type: 'boolean', default: true },
        { id: 'backupNotifications', name: 'Notificações de Backup', type: 'boolean', default: true },
        { id: 'syncNotifications', name: 'Notificações de Sincronização', type: 'boolean', default: true },
        { id: 'newsletterNotifications', name: 'Newsletter', type: 'boolean', default: false }
      ]
    },
    streaming: {
      name: 'Streaming',
      icon: '📺',
      fields: [
        { id: 'preferredPlatforms', name: 'Plataformas Preferidas', type: 'multiselect', options: ['netflix', 'disney', 'prime', 'apple', 'hbo', 'hulu', 'paramount', 'starz', 'showtime', 'crunchyroll', 'tubi', 'kanopy'], default: [] },
        { id: 'autoCheckStreaming', name: 'Verificação Automática de Streaming', type: 'boolean', default: true },
        { id: 'notifyStreamingChanges', name: 'Notificar Mudanças de Disponibilidade', type: 'boolean', default: true },
        { id: 'streamingRegion', name: 'Região de Streaming', type: 'select', options: ['BR', 'US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'IN'], default: 'BR' },
        { id: 'maxStreamingResults', name: 'Máximo de Resultados de Streaming', type: 'number', min: 1, max: 50, default: 10 },
        { id: 'showStreamingPrices', name: 'Mostrar Preços de Streaming', type: 'boolean', default: true },
        { id: 'showStreamingTrailers', name: 'Mostrar Trailers de Streaming', type: 'boolean', default: true }
      ]
    },
    widgets: {
      name: 'Widgets',
      icon: '🧩',
      fields: [
        { id: 'favoriteWidgets', name: 'Widgets Favoritos', type: 'multiselect', options: ['movie-stats', 'person-stats', 'streaming-availability', 'recommendations', 'recently-added', 'top-rated', 'watchlist', 'upcoming-releases', 'favorites', 'genre-distribution', 'year-distribution', 'quick-actions', 'calendar', 'notifications'], default: [] },
        { id: 'defaultDashboardLayout', name: 'Layout Padrão do Dashboard', type: 'select', options: ['grid', 'flex', 'masonry'], default: 'grid' },
        { id: 'dashboardColumns', name: 'Colunas do Dashboard', type: 'number', min: 1, max: 12, default: 4 },
        { id: 'autoRefreshWidgets', name: 'Atualização Automática de Widgets', type: 'boolean', default: true },
        { id: 'widgetRefreshInterval', name: 'Intervalo de Atualização (minutos)', type: 'number', min: 1, max: 60, default: 5 }
      ]
    },
    backup: {
      name: 'Backup',
      icon: '💾',
      fields: [
        { id: 'autoBackupEnabled', name: 'Backup Automático', type: 'boolean', default: true },
        { id: 'backupFrequency', name: 'Frequência de Backup', type: 'select', options: ['hourly', 'daily', 'weekly', 'monthly'], default: 'daily' },
        { id: 'backupRetention', name: 'Retenção de Backups (dias)', type: 'number', min: 1, max: 365, default: 30 },
        { id: 'cloudBackupEnabled', name: 'Backup na Nuvem', type: 'boolean', default: false },
        { id: 'cloudProvider', name: 'Provedor de Nuvem', type: 'select', options: ['aws', 'google', 'dropbox', 'onedrive'], default: 'aws' },
        { id: 'encryptBackups', name: 'Criptografar Backups', type: 'boolean', default: true },
        { id: 'compressBackups', name: 'Comprimir Backups', type: 'boolean', default: true }
      ]
    },
    integration: {
      name: 'Integração',
      icon: '🔗',
      fields: [
        { id: 'imdbIntegration', name: 'Integração com IMDb', type: 'boolean', default: true },
        { id: 'tmdbIntegration', name: 'Integração com TMDb', type: 'boolean', default: true },
        { id: 'rottenTomatoesIntegration', name: 'Integração com Rotten Tomatoes', type: 'boolean', default: true },
        { id: 'letterboxdIntegration', name: 'Integração com Letterboxd', type: 'boolean', default: false },
        { id: 'adorocinemaIntegration', name: 'Integração com AdoroCinema', type: 'boolean', default: true },
        { id: 'traktIntegration', name: 'Integração com Trakt.tv', type: 'boolean', default: false },
        { id: 'justwatchIntegration', name: 'Integração com JustWatch', type: 'boolean', default: true },
        { id: 'syncWithSocialMedia', name: 'Sincronizar com Redes Sociais', type: 'boolean', default: false }
      ]
    }
  },

  // Configurações de validação
  validation: {
    fullName: { maxLength: 100, minLength: 2 },
    nickname: { maxLength: 50, minLength: 2 },
    bio: { maxLength: 1000 },
    birthDate: { format: 'YYYY-MM-DD' },
    birthPlace: { maxLength: 100 },
    height: { pattern: /^\d{1,3}(\.\d{1,2})?$/ },
    itemsPerPage: { min: 10, max: 100 },
    backupRetention: { min: 1, max: 365 },
    widgetRefreshInterval: { min: 1, max: 60 }
  },

  // Configurações de segurança
  security: {
    encryptSensitiveData: process.env.PROFILE_ENCRYPT_SENSITIVE === 'true' || true,
    salt: process.env.PROFILE_SECURITY_SALT || 'movienizer-profile-salt-16-chars!',
    algorithm: process.env.PROFILE_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de sincronização
  sync: {
    enabled: process.env.PROFILE_SYNC_ENABLED === 'true' || true,
    frequency: process.env.PROFILE_SYNC_FREQUENCY || 'hourly', // hourly, daily, weekly
    conflictResolution: process.env.PROFILE_CONFLICT_RESOLUTION || 'latest', // latest, manual, merge
    maxHistory: parseInt(process.env.PROFILE_MAX_HISTORY) || 100
  },

  // Configurações de cache
  cache: {
    enabled: process.env.PROFILE_CACHE_ENABLED === 'true' || true,
    ttl: parseInt(process.env.PROFILE_CACHE_TTL) || 3600, // segundos
    maxSize: parseInt(process.env.PROFILE_CACHE_MAX_SIZE) || 50 // MB
  }
};

module.exports = profileConfig;