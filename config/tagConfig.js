// tagConfig.js

const tagConfig = {
  // Configurações gerais de tags
  general: {
    enabled: process.env.TAGS_ENABLED === 'true' || true,
    maxTagsPerItem: parseInt(process.env.TAGS_MAX_PER_ITEM) || 20,
    maxTagLength: parseInt(process.env.TAGS_MAX_LENGTH) || 50,
    allowDuplicateTags: process.env.TAGS_ALLOW_DUPLICATES === 'true' || false,
    caseSensitive: process.env.TAGS_CASE_SENSITIVE === 'true' || false,
    autoSuggest: process.env.TAGS_AUTO_SUGGEST === 'true' || true,
    autoComplete: process.env.TAGS_AUTO_COMPLETE === 'true' || true,
    suggestLimit: parseInt(process.env.TAGS_SUGGEST_LIMIT) || 10
  },

  // Categorias de tags
  categories: {
    genre: {
      id: 'genre',
      name: 'Gênero',
      icon: '🎭',
      color: '#3498db',
      description: 'Tags relacionadas a gêneros cinematográficos',
      allowSubcategories: true,
      maxDepth: 3
    },
    mood: {
      id: 'mood',
      name: 'Humor',
      icon: '😊',
      color: '#2ecc71',
      description: 'Tags relacionadas ao humor do filme',
      allowSubcategories: true,
      maxDepth: 2
    },
    theme: {
      id: 'theme',
      name: 'Tema',
      icon: '💭',
      color: '#9b59b6',
      description: 'Tags relacionadas aos temas do filme',
      allowSubcategories: true,
      maxDepth: 3
    },
    style: {
      id: 'style',
      name: 'Estilo',
      icon: '🎨',
      color: '#f39c12',
      description: 'Tags relacionadas ao estilo visual do filme',
      allowSubcategories: true,
      maxDepth: 2
    },
    era: {
      id: 'era',
      name: 'Época',
      icon: '🕰️',
      color: '#e74c3c',
      description: 'Tags relacionadas à época histórica do filme',
      allowSubcategories: true,
      maxDepth: 2
    },
    audience: {
      id: 'audience',
      name: 'Público-Alvo',
      icon: '👥',
      color: '#1abc9c',
      description: 'Tags relacionadas ao público-alvo do filme',
      allowSubcategories: true,
      maxDepth: 2
    },
    award: {
      id: 'award',
      name: 'Prêmio',
      icon: '🏆',
      color: '#f1c40f',
      description: 'Tags relacionadas a prêmios e indicações',
      allowSubcategories: true,
      maxDepth: 3
    },
    franchise: {
      id: 'franchise',
      name: 'Franquia',
      icon: '🎪',
      color: '#34495e',
      description: 'Tags relacionadas a franquias e séries',
      allowSubcategories: true,
      maxDepth: 4
    },
    character: {
      id: 'character',
      name: 'Personagem',
      icon: '👤',
      color: '#e67e22',
      description: 'Tags relacionadas a personagens importantes',
      allowSubcategories: true,
      maxDepth: 3
    },
    setting: {
      id: 'setting',
      name: 'Ambientação',
      icon: '🌍',
      color: '#16a085',
      description: 'Tags relacionadas à ambientação do filme',
      allowSubcategories: true,
      maxDepth: 3
    },
    technique: {
      id: 'technique',
      name: 'Técnica',
      icon: '🎬',
      color: '#8e44ad',
      description: 'Tags relacionadas a técnicas cinematográficas',
      allowSubcategories: true,
      maxDepth: 2
    },
    custom: {
      id: 'custom',
      name: 'Personalizado',
      icon: '⚙️',
      color: '#95a5a6',
      description: 'Tags personalizadas criadas pelo usuário',
      allowSubcategories: true,
      maxDepth: 5
    }
  },

  // Cores padrão para tags
  colors: {
    default: '#3498db',
    primary: '#3498db',
    secondary: '#95a5a6',
    success: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#1abc9c',
    light: '#f8f9fa',
    dark: '#343a40',
    custom: '#9b59b6'
  },

  // Ícones padrão para tags
  icons: {
    default: '🏷️',
    genre: '🎭',
    mood: '😊',
    theme: '💭',
    style: '🎨',
    era: '🕰️',
    audience: '👥',
    award: '🏆',
    franchise: '🎪',
    character: '👤',
    setting: '🌍',
    technique: '🎬',
    custom: '⚙️'
  },

  // Configurações de validação
  validation: {
    tagName: {
      minLength: 1,
      maxLength: 50,
      allowedChars: /^[a-zA-Z0-9À-ú\s\-_]+$/,
      reservedWords: ['todos', 'todas', 'all', 'none', 'nada']
    },
    tagDescription: {
      maxLength: 200
    },
    tagHierarchy: {
      maxDepth: 5,
      maxChildren: 50
    }
  },

  // Configurações de cache
  cache: {
    enabled: process.env.TAGS_CACHE_ENABLED === 'true' || true,
    ttl: parseInt(process.env.TAGS_CACHE_TTL) || 3600, // 1 hora em segundos
    maxSize: parseInt(process.env.TAGS_CACHE_MAX_SIZE) || 50, // MB
    cleanupInterval: parseInt(process.env.TAGS_CACHE_CLEANUP_INTERVAL) || 3600000 // 1 hora
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.TAGS_NOTIFICATIONS_ENABLED === 'true' || true,
    email: process.env.TAGS_NOTIFICATION_EMAIL === 'true' || false,
    system: process.env.TAGS_NOTIFICATION_SYSTEM === 'true' || true,
    newTag: process.env.TAGS_NOTIFY_NEW_TAG === 'true' || true,
    tagDeleted: process.env.TAGS_NOTIFY_TAG_DELETED === 'true' || true,
    tagUpdated: process.env.TAGS_NOTIFY_TAG_UPDATED === 'true' || true,
    tagAssigned: process.env.TAGS_NOTIFY_TAG_ASSIGNED === 'true' || false,
    tagRemoved: process.env.TAGS_NOTIFY_TAG_REMOVED === 'true' || false
  },

  // Configurações de importação/exportação
  importExport: {
    enabled: process.env.TAGS_IMPORT_EXPORT_ENABLED === 'true' || true,
    maxFileSize: parseInt(process.env.TAGS_MAX_FILE_SIZE) || 10, // MB
    allowedFormats: ['json', 'csv', 'txt'],
    defaultFormat: 'json',
    includeHierarchy: process.env.TAGS_INCLUDE_HIERARCHY === 'true' || true,
    includeUsage: process.env.TAGS_INCLUDE_USAGE === 'true' || true
  },

  // Configurações de sincronização
  sync: {
    enabled: process.env.TAGS_SYNC_ENABLED === 'true' || true,
    frequency: process.env.TAGS_SYNC_FREQUENCY || 'daily', // hourly, daily, weekly
    conflictResolution: process.env.TAGS_CONFLICT_RESOLUTION || 'latest', // latest, manual, merge
    maxHistory: parseInt(process.env.TAGS_MAX_HISTORY) || 100
  },

  // Configurações de segurança
  security: {
    encryptSensitiveData: process.env.TAGS_ENCRYPT_SENSITIVE === 'true' || true,
    salt: process.env.TAGS_SECURITY_SALT || 'movienizer-tags-salt-16-chars!',
    algorithm: process.env.TAGS_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de interface
  ui: {
    showTagCloud: process.env.TAGS_SHOW_TAG_CLOUD === 'true' || true,
    tagCloudLimit: parseInt(process.env.TAGS_TAG_CLOUD_LIMIT) || 50,
    showTagHierarchy: process.env.TAGS_SHOW_HIERARCHY === 'true' || true,
    showTagUsage: process.env.TAGS_SHOW_USAGE === 'true' || true,
    showTagColors: process.env.TAGS_SHOW_COLORS === 'true' || true,
    showTagIcons: process.env.TAGS_SHOW_ICONS === 'true' || true,
    enableTagEditing: process.env.TAGS_ENABLE_EDITING === 'true' || true,
    enableTagDeletion: process.env.TAGS_ENABLE_DELETION === 'true' || true,
    enableTagCreation: process.env.TAGS_ENABLE_CREATION === 'true' || true
  }
};

module.exports = tagConfig;