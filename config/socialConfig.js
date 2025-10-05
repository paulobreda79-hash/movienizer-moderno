// socialConfig.js

const socialConfig = {
  // Configurações gerais de redes sociais
  general: {
    enabled: process.env.SOCIAL_ENABLED === 'true' || true,
    autoShare: process.env.SOCIAL_AUTO_SHARE === 'true' || false,
    shareOnAdd: process.env.SOCIAL_SHARE_ON_ADD === 'true' || false,
    shareOnWatch: process.env.SOCIAL_SHARE_ON_WATCH === 'true' || false,
    shareOnRate: process.env.SOCIAL_SHARE_ON_RATE === 'true' || false,
    maxSharesPerDay: parseInt(process.env.SOCIAL_MAX_SHARES_PER_DAY) || 10,
    shareCooldown: parseInt(process.env.SOCIAL_SHARE_COOLDOWN) || 300, // segundos
    showShareButtons: process.env.SOCIAL_SHOW_BUTTONS === 'true' || true,
    showShareModal: process.env.SOCIAL_SHOW_MODAL === 'true' || true,
    enableAnalytics: process.env.SOCIAL_ENABLE_ANALYTICS === 'true' || true,
    enableEngagementTracking: process.env.SOCIAL_ENABLE_ENGAGEMENT === 'true' || true,
    enableAutoTagging: process.env.SOCIAL_AUTO_TAGGING === 'true' || true,
    autoTagPrefix: process.env.SOCIAL_AUTO_TAG_PREFIX || '#MovieNizer',
    defaultShareMessage: process.env.SOCIAL_DEFAULT_MESSAGE || 'Confira este filme incrível!',
    defaultHashtags: process.env.SOCIAL_DEFAULT_HASHTAGS ? 
      process.env.SOCIAL_DEFAULT_HASHTAGS.split(',') : ['MovieNizer', 'Filmes', 'Cinema']
  },

  // Redes sociais suportadas
  platforms: {
    facebook: {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: '#3b5998',
      enabled: process.env.SOCIAL_FACEBOOK_ENABLED === 'true' || true,
      appId: process.env.SOCIAL_FACEBOOK_APP_ID || 'your_facebook_app_id',
      apiVersion: process.env.SOCIAL_FACEBOOK_API_VERSION || 'v17.0',
      permissions: process.env.SOCIAL_FACEBOOK_PERMISSIONS ? 
        process.env.SOCIAL_FACEBOOK_PERMISSIONS.split(',') : ['publish_to_groups', 'pages_read_engagement'],
      shareUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={title}',
      shareImage: 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    },
    twitter: {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1da1f2',
      enabled: process.env.SOCIAL_TWITTER_ENABLED === 'true' || true,
      consumerKey: process.env.SOCIAL_TWITTER_CONSUMER_KEY || 'your_twitter_consumer_key',
      consumerSecret: process.env.SOCIAL_TWITTER_CONSUMER_SECRET || 'your_twitter_consumer_secret',
      shareUrl: 'https://twitter.com/intent/tweet?url={url}&text={title} {hashtags}',
      shareImage: 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    },
    instagram: {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: '#e1306c',
      enabled: process.env.SOCIAL_INSTAGRAM_ENABLED === 'true' || true,
      clientId: process.env.SOCIAL_INSTAGRAM_CLIENT_ID || 'your_instagram_client_id',
      redirectUri: process.env.SOCIAL_INSTAGRAM_REDIRECT_URI || 'https://yourdomain.com/callback',
      shareUrl: 'https://www.instagram.com/share?url={url}',
      shareImage: 'https://via.placeholder.com/1080x1080?text=MovieNizer+Share'
    },
    linkedin: {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: '#0077b5',
      enabled: process.env.SOCIAL_LINKEDIN_ENABLED === 'true' || true,
      clientId: process.env.SOCIAL_LINKEDIN_CLIENT_ID || 'your_linkedin_client_id',
      redirectUri: process.env.SOCIAL_LINKEDIN_REDIRECT_URI || 'https://yourdomain.com/callback',
      shareUrl: 'https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}&summary={description}&source=MovieNizer',
      shareImage: 'https://via.placeholder.com/1200x627?text=MovieNizer+Share'
    },
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      enabled: process.env.SOCIAL_WHATSAPP_ENABLED === 'true' || true,
      shareUrl: 'https://api.whatsapp.com/send?text={title}%20-%20{url}',
      shareImage: 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    },
    telegram: {
      id: 'telegram',
      name: 'Telegram',
      icon: '📱',
      color: '#0088cc',
      enabled: process.env.SOCIAL_TELEGRAM_ENABLED === 'true' || true,
      shareUrl: 'https://t.me/share/url?url={url}&text={title}',
      shareImage: 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    },
    email: {
      id: 'email',
      name: 'Email',
      icon: '✉️',
      color: '#333',
      enabled: process.env.SOCIAL_EMAIL_ENABLED === 'true' || true,
      shareUrl: 'mailto:?subject={title}&body={title}%20-%20{url}%0A%0A{description}',
      shareImage: 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    },
    sms: {
      id: 'sms',
      name: 'SMS',
      icon: '📲',
      color: '#666',
      enabled: process.env.SOCIAL_SMS_ENABLED === 'true' || true,
      shareUrl: 'sms:?body={title}%20-%20{url}',
      shareImage: 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    }
  },

  // Configurações de compartilhamento
  sharing: {
    enabled: process.env.SOCIAL_SHARING_ENABLED === 'true' || true,
    includeThumbnail: process.env.SOCIAL_INCLUDE_THUMBNAIL === 'true' || true,
    includeDescription: process.env.SOCIAL_INCLUDE_DESCRIPTION === 'true' || true,
    includeRating: process.env.SOCIAL_INCLUDE_RATING === 'true' || true,
    includeGenre: process.env.SOCIAL_INCLUDE_GENRE === 'true' || true,
    includeYear: process.env.SOCIAL_INCLUDE_YEAR === 'true' || true,
    includeDirector: process.env.SOCIAL_INCLUDE_DIRECTOR === 'true' || true,
    includeCast: process.env.SOCIAL_INCLUDE_CAST === 'true' || true,
    includeRuntime: process.env.SOCIAL_INCLUDE_RUNTIME === 'true' || true,
    includeLanguage: process.env.SOCIAL_INCLUDE_LANGUAGE === 'true' || true,
    includeCountry: process.env.SOCIAL_INCLUDE_COUNTRY === 'true' || true,
    includeReleaseDate: process.env.SOCIAL_INCLUDE_RELEASE_DATE === 'true' || true,
    includeIMDbLink: process.env.SOCIAL_INCLUDE_IMDB_LINK === 'true' || true,
    includeRottenTomatoesLink: process.env.SOCIAL_INCLUDE_RT_LINK === 'true' || true,
    includeLetterboxdLink: process.env.SOCIAL_INCLUDE_LBXD_LINK === 'true' || true,
    includeFilmAffinityLink: process.env.SOCIAL_INCLUDE_FILMAFFINITY_LINK === 'true' || true,
    includeTraktLink: process.env.SOCIAL_INCLUDE_TRAKT_LINK === 'true' || true,
    includeMetacriticLink: process.env.SOCIAL_INCLUDE_METACRITIC_LINK === 'true' || true,
    includeTMDbLink: process.env.SOCIAL_INCLUDE_TMDB_LINK === 'true' || true
  },

  // Configurações de cache
  cache: {
    enabled: process.env.SOCIAL_CACHE_ENABLED === 'true' || true,
    ttl: parseInt(process.env.SOCIAL_CACHE_TTL) || 3600, // 1 hora em segundos
    maxSize: parseInt(process.env.SOCIAL_CACHE_MAX_SIZE) || 50, // MB
    cleanupInterval: parseInt(process.env.SOCIAL_CACHE_CLEANUP_INTERVAL) || 3600000 // 1 hora
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.SOCIAL_NOTIFICATIONS_ENABLED === 'true' || true,
    shareSuccess: process.env.SOCIAL_NOTIFY_SHARE_SUCCESS === 'true' || true,
    shareError: process.env.SOCIAL_NOTIFY_SHARE_ERROR === 'true' || true,
    shareStarted: process.env.SOCIAL_NOTIFY_SHARE_STARTED === 'true' || true,
    shareCompleted: process.env.SOCIAL_NOTIFY_SHARE_COMPLETED === 'true' || true,
    engagementReceived: process.env.SOCIAL_NOTIFY_ENGAGEMENT_RECEIVED === 'true' || true,
    newFollower: process.env.SOCIAL_NOTIFY_NEW_FOLLOWER === 'true' || true,
    newLike: process.env.SOCIAL_NOTIFY_NEW_LIKE === 'true' || true,
    newComment: process.env.SOCIAL_NOTIFY_NEW_COMMENT === 'true' || true,
    newShare: process.env.SOCIAL_NOTIFY_NEW_SHARE === 'true' || true
  },

  // Configurações de segurança
  security: {
    encryptData: process.env.SOCIAL_ENCRYPT_DATA === 'true' || false,
    salt: process.env.SOCIAL_SECURITY_SALT || 'movienizer-social-salt-16-chars!',
    algorithm: process.env.SOCIAL_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de interface
  ui: {
    showShareButton: process.env.SOCIAL_SHOW_SHARE_BUTTON === 'true' || true,
    shareButtonPosition: process.env.SOCIAL_SHARE_BUTTON_POSITION || 'bottom-right', // top-left, top-right, bottom-left, bottom-right
    showShareModal: process.env.SOCIAL_SHOW_SHARE_MODAL === 'true' || true,
    shareModalPosition: process.env.SOCIAL_SHARE_MODAL_POSITION || 'center', // center, top, bottom, left, right
    enableShareShortcuts: process.env.SOCIAL_ENABLE_SHORTCUTS === 'true' || true,
    shareShortcutKey: process.env.SOCIAL_SHARE_SHORTCUT_KEY || 'Ctrl+Shift+S'
  },

  // Configurações de widgets
  widgets: {
    shareWidget: {
      enabled: process.env.SOCIAL_WIDGET_SHARE_ENABLED === 'true' || true,
      showShareCount: process.env.SOCIAL_WIDGET_SHOW_COUNT === 'true' || true,
      showPlatformIcons: process.env.SOCIAL_WIDGET_SHOW_ICONS === 'true' || true,
      showShareButtons: process.env.SOCIAL_WIDGET_SHOW_BUTTONS === 'true' || true,
      maxShareCount: parseInt(process.env.SOCIAL_WIDGET_MAX_COUNT) || 5
    },
    engagementWidget: {
      enabled: process.env.SOCIAL_WIDGET_ENGAGEMENT_ENABLED === 'true' || true,
      showLikes: process.env.SOCIAL_WIDGET_SHOW_LIKES === 'true' || true,
      showComments: process.env.SOCIAL_WIDGET_SHOW_COMMENTS === 'true' || true,
      showShares: process.env.SOCIAL_WIDGET_SHOW_SHARES === 'true' || true,
      showFollowers: process.env.SOCIAL_WIDGET_SHOW_FOLLOWERS === 'true' || true,
      maxEngagementCount: parseInt(process.env.SOCIAL_WIDGET_MAX_ENGAGEMENT) || 10
    }
  },

  // Configurações de templates
  templates: {
    shareTemplate: {
      enabled: process.env.SOCIAL_TEMPLATE_SHARE_ENABLED === 'true' || true,
      title: process.env.SOCIAL_TEMPLATE_TITLE || '{title} - {year}',
      description: process.env.SOCIAL_TEMPLATE_DESCRIPTION || '{description}',
      hashtags: process.env.SOCIAL_TEMPLATE_HASHTAGS ? 
        process.env.SOCIAL_TEMPLATE_HASHTAGS.split(',') : ['MovieNizer', 'Filmes', 'Cinema'],
      image: process.env.SOCIAL_TEMPLATE_IMAGE || 'https://via.placeholder.com/1200x630?text=MovieNizer+Share'
    },
    engagementTemplate: {
      enabled: process.env.SOCIAL_TEMPLATE_ENGAGEMENT_ENABLED === 'true' || true,
      likeTemplate: process.env.SOCIAL_TEMPLATE_LIKE || 'Você gostou de {title}!',
      commentTemplate: process.env.SOCIAL_TEMPLATE_COMMENT || 'Comentário sobre {title}: {comment}',
      shareTemplate: process.env.SOCIAL_TEMPLATE_SHARE || 'Você compartilhou {title}!',
      followerTemplate: process.env.SOCIAL_TEMPLATE_FOLLOWER || 'Novo seguidor: {user}'
    }
  },

  // Configurações de animações
  animations: {
    shareButton: {
      enabled: process.env.SOCIAL_ANIMATION_BUTTON_ENABLED === 'true' || true,
      pulse: process.env.SOCIAL_ANIMATION_PULSE === 'true' || true,
      bounce: process.env.SOCIAL_ANIMATION_BOUNCE === 'true' || false,
      shake: process.env.SOCIAL_ANIMATION_SHAKE === 'true' || false
    },
    shareModal: {
      enabled: process.env.SOCIAL_ANIMATION_MODAL_ENABLED === 'true' || true,
      fade: process.env.SOCIAL_ANIMATION_FADE === 'true' || true,
      slide: process.env.SOCIAL_ANIMATION_SLIDE === 'true' || false,
      zoom: process.env.SOCIAL_ANIMATION_ZOOM === 'true' || false
    },
    shareFeedback: {
      enabled: process.env.SOCIAL_ANIMATION_FEEDBACK_ENABLED === 'true' || true,
      pop: process.env.SOCIAL_ANIMATION_POP === 'true' || true,
      wave: process.env.SOCIAL_ANIMATION_WAVE === 'true' || false,
      sparkle: process.env.SOCIAL_ANIMATION_SPARKLE === 'true' || false
    }
  },

  // Configurações de fallback
  fallback: {
    useFallbackMethods: process.env.SOCIAL_USE_FALLBACK === 'true' || true,
    fallbackToText: process.env.SOCIAL_FALLBACK_TO_TEXT === 'true' || true,
    fallbackToClipboard: process.env.SOCIAL_FALLBACK_TO_CLIPBOARD === 'true' || true,
    maxFallbackAttempts: parseInt(process.env.SOCIAL_MAX_FALLBACK_ATTEMPTS) || 3
  },

  // Configurações de compatibilidade
  compatibility: {
    webShareApi: process.env.SOCIAL_WEB_SHARE_API === 'true' || true,
    mediaRecorder: process.env.SOCIAL_MEDIA_RECORDER === 'true' || true,
    audioContext: process.env.SOCIAL_AUDIO_CONTEXT === 'true' || true,
    getUserMedia: process.env.SOCIAL_GET_USER_MEDIA === 'true' || true
  },

  // Configurações de performance
  performance: {
    maxAudioBufferSize: parseInt(process.env.SOCIAL_MAX_AUDIO_BUFFER) || 1024,
    audioSampleRate: parseInt(process.env.SOCIAL_AUDIO_SAMPLE_RATE) || 44100,
    audioBitDepth: parseInt(process.env.SOCIAL_AUDIO_BIT_DEPTH) || 16,
    audioChannels: parseInt(process.env.SOCIAL_AUDIO_CHANNELS) || 1,
    maxProcessingTime: parseInt(process.env.SOCIAL_MAX_PROCESSING_TIME) || 5000 // 5 segundos
  },

  // Configurações de acessibilidade
  accessibility: {
    highContrastMode: process.env.SOCIAL_HIGH_CONTRAST === 'true' || false,
    largeTextMode: process.env.SOCIAL_LARGE_TEXT === 'true' || false,
    screenReaderSupport: process.env.SOCIAL_SCREEN_READER === 'true' || true,
    keyboardNavigation: process.env.SOCIAL_KEYBOARD_NAV === 'true' || true,
    focusIndicators: process.env.SOCIAL_FOCUS_INDICATORS === 'true' || true
  },

  // Configurações de internacionalização
  i18n: {
    supportedLanguages: Object.keys(socialConfig.platforms),
    defaultLanguage: process.env.SOCIAL_DEFAULT_LANGUAGE || 'pt-BR',
    autoDetectLanguage: process.env.SOCIAL_AUTO_DETECT_LANGUAGE === 'true' || true,
    translateMessages: process.env.SOCIAL_TRANSLATE_MESSAGES === 'true' || true,
    translationCacheTTL: parseInt(process.env.SOCIAL_TRANSLATION_CACHE_TTL) || 86400 // segundos
  },

  // Configurações de integração
  integration: {
    withSearch: process.env.SOCIAL_INTEGRATE_SEARCH === 'true' || true,
    withMovies: process.env.SOCIAL_INTEGRATE_MOVIES === 'true' || true,
    withPeople: process.env.SOCIAL_INTEGRATE_PEOPLE === 'true' || true,
    withStreaming: process.env.SOCIAL_INTEGRATE_STREAMING === 'true' || true,
    withNotifications: process.env.SOCIAL_INTEGRATE_NOTIFICATIONS === 'true' || true,
    withReminders: process.env.SOCIAL_INTEGRATE_REMINDERS === 'true' || true,
    withReports: process.env.SOCIAL_INTEGRATE_REPORTS === 'true' || true,
    withCloud: process.env.SOCIAL_INTEGRATE_CLOUD === 'true' || true,
    withBackup: process.env.SOCIAL_INTEGRATE_BACKUP === 'true' || true,
    withThemes: process.env.SOCIAL_INTEGRATE_THEMES === 'true' || true,
    withWidgets: process.env.SOCIAL_INTEGRATE_WIDGETS === 'true' || true,
    withDashboards: process.env.SOCIAL_INTEGRATE_DASHBOARDS === 'true' || true
  }
};

module.exports = socialConfig;