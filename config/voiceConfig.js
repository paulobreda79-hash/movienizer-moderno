// voiceConfig.js

const voiceConfig = {
  // Configurações gerais de voz
  general: {
    enabled: process.env.VOICE_ENABLED === 'true' || true,
    autoStart: process.env.VOICE_AUTO_START === 'true' || false,
    continuousListening: process.env.VOICE_CONTINUOUS_LISTENING === 'true' || false,
    maxRecordingTime: parseInt(process.env.VOICE_MAX_RECORDING_TIME) || 10, // segundos
    silenceThreshold: parseFloat(process.env.VOICE_SILENCE_THRESHOLD) || 0.01,
    silenceTimeout: parseInt(process.env.VOICE_SILENCE_TIMEOUT) || 2000, // milissegundos
    autoStopOnSilence: process.env.VOICE_AUTO_STOP_ON_SILENCE === 'true' || true
  },

  // Idiomas suportados
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
    },
    'fr-FR': {
      name: 'Français (France)',
      code: 'fr-FR',
      recognitionLang: 'fr-FR',
      synthesisLang: 'fr-FR',
      default: false,
      icon: '🇫🇷',
      voiceName: 'Google français'
    },
    'de-DE': {
      name: 'Deutsch (Deutschland)',
      code: 'de-DE',
      recognitionLang: 'de-DE',
      synthesisLang: 'de-DE',
      default: false,
      icon: '🇩🇪',
      voiceName: 'Google Deutsch'
    },
    'it-IT': {
      name: 'Italiano (Italia)',
      code: 'it-IT',
      recognitionLang: 'it-IT',
      synthesisLang: 'it-IT',
      default: false,
      icon: '🇮🇹',
      voiceName: 'Google italiano'
    },
    'ja-JP': {
      name: '日本語 (日本)',
      code: 'ja-JP',
      recognitionLang: 'ja-JP',
      synthesisLang: 'ja-JP',
      default: false,
      icon: '🇯🇵',
      voiceName: 'Google 日本語'
    }
  },

  // Comandos de voz pré-definidos
  commands: {
    search: {
      pt: ['procure por', 'buscar', 'pesquisar', 'encontre', 'ache', 'mostre-me', 'mostre'],
      en: ['search for', 'find', 'look for', 'show me', 'display'],
      es: ['buscar', 'encontrar', 'mostrar'],
      fr: ['chercher', 'rechercher', 'trouver', 'afficher'],
      de: ['suchen nach', 'finden', 'anzeigen'],
      it: ['cercare', 'trovare', 'mostrare'],
      ja: ['検索', '探す', '表示']
    },
    movie: {
      pt: ['filme', 'filmes', 'longa', 'longas'],
      en: ['movie', 'movies', 'film', 'films'],
      es: ['película', 'películas'],
      fr: ['film', 'films'],
      de: ['Film', 'Filme'],
      it: ['film', 'film'],
      ja: ['映画', '映画']
    },
    person: {
      pt: ['ator', 'atores', 'diretor', 'diretores', 'pessoa', 'pessoas'],
      en: ['actor', 'actors', 'director', 'directors', 'person', 'people'],
      es: ['actor', 'actores', 'director', 'directores', 'persona', 'personas'],
      fr: ['acteur', 'acteurs', 'réalisateur', 'réalisateurs', 'personne', 'personnes'],
      de: ['Schauspieler', 'Schauspieler', 'Regisseur', 'Regisseure', 'Person', 'Leute'],
      it: ['attore', 'attori', 'regista', 'registi', 'persona', 'persone'],
      ja: ['俳優', '監督', '人物']
    },
    add: {
      pt: ['adicionar', 'adiciona', 'inclua', 'incluir'],
      en: ['add', 'include', 'insert'],
      es: ['añadir', 'incluir'],
      fr: ['ajouter', 'inclure'],
      de: ['hinzufügen', 'einfügen'],
      it: ['aggiungere', 'includere'],
      ja: ['追加', '含める']
    },
    remove: {
      pt: ['remover', 'excluir', 'deletar', 'apagar'],
      en: ['remove', 'delete', 'exclude'],
      es: ['eliminar', 'borrar', 'excluir'],
      fr: ['supprimer', 'enlever', 'exclure'],
      de: ['entfernen', 'löschen', 'ausschließen'],
      it: ['rimuovere', 'eliminare', 'escludere'],
      ja: ['削除', '除外']
    },
    favorite: {
      pt: ['favorito', 'favorita', 'marque como favorito', 'adicione aos favoritos'],
      en: ['favorite', 'mark as favorite', 'add to favorites'],
      es: ['favorito', 'marcar como favorito', 'añadir a favoritos'],
      fr: ['favori', 'marquer comme favori', 'ajouter aux favoris'],
      de: ['Favorit', 'als Favorit markieren', 'zu Favoriten hinzufügen'],
      it: ['preferito', 'segna come preferito', 'aggiungi ai preferiti'],
      ja: ['お気に入り', 'お気に入りに追加']
    },
    watched: {
      pt: ['visto', 'assistido', 'marque como visto', 'adicione aos vistos'],
      en: ['watched', 'seen', 'mark as watched', 'add to watched'],
      es: ['visto', 'marcar como visto', 'añadir a vistos'],
      fr: ['vu', 'marquer comme vu', 'ajouter aux vus'],
      de: ['gesehen', 'als gesehen markieren', 'zu gesehenen hinzufügen'],
      it: ['visto', 'segna come visto', 'aggiungi ai visti'],
      ja: ['視聴済み', '視聴済みに追加']
    },
    help: {
      pt: ['ajuda', 'socorro', 'comandos', 'o que posso dizer'],
      en: ['help', 'commands', 'what can I say'],
      es: ['ayuda', 'comandos', 'qué puedo decir'],
      fr: ['aide', 'commandes', 'que puis-je dire'],
      de: ['Hilfe', 'Befehle', 'was kann ich sagen'],
      it: ['aiuto', 'comandi', 'cosa posso dire'],
      ja: ['ヘルプ', 'コマンド', '何が言える']
    },
    stop: {
      pt: ['pare', 'parar', 'cancelar', 'interromper'],
      en: ['stop', 'cancel', 'interrupt'],
      es: ['detener', 'cancelar', 'interrumpir'],
      fr: ['arrêter', 'annuler', 'interrompre'],
      de: ['stoppen', 'abbrechen', 'unterbrechen'],
      it: ['fermare', 'annullare', 'interrompere'],
      ja: ['停止', 'キャンセル', '中断']
    },
    play: {
      pt: ['reproduzir', 'tocar', 'assitir', 'ver'],
      en: ['play', 'watch', 'view'],
      es: ['reproducir', 'ver'],
      fr: ['jouer', 'regarder'],
      de: ['abspielen', 'sehen'],
      it: ['riprodurre', 'guardare'],
      ja: ['再生', '視聴']
    },
    pause: {
      pt: ['pausar', 'parar'],
      en: ['pause', 'stop'],
      es: ['pausar', 'detener'],
      fr: ['pause', 'arrêter'],
      de: ['pausieren', 'stoppen'],
      it: ['mettere in pausa', 'fermare'],
      ja: ['一時停止', '停止']
    },
    next: {
      pt: ['próximo', 'seguinte', 'avançar'],
      en: ['next', 'forward'],
      es: ['siguiente', 'adelante'],
      fr: ['suivant', 'avancer'],
      de: ['nächstes', 'vorwärts'],
      it: ['prossimo', 'avanti'],
      ja: ['次へ', '進む']
    },
    previous: {
      pt: ['anterior', 'voltar', 'retroceder'],
      en: ['previous', 'back'],
      es: ['anterior', 'atrás'],
      fr: ['précédent', 'retour'],
      de: ['vorheriges', 'zurück'],
      it: ['precedente', 'indietro'],
      ja: ['前へ', '戻る']
    }
  },

  // Configurações de reconhecimento
  recognition: {
    interimResults: process.env.VOICE_INTERIM_RESULTS === 'true' || true,
    maxAlternatives: parseInt(process.env.VOICE_MAX_ALTERNATIVES) || 3,
    continuous: process.env.VOICE_CONTINUOUS === 'true' || false,
    lang: process.env.VOICE_DEFAULT_LANG || 'pt-BR'
  },

  // Configurações de síntese
  synthesis: {
    enabled: process.env.VOICE_SYNTHESIS_ENABLED === 'true' || true,
    volume: parseFloat(process.env.VOICE_SYNTHESIS_VOLUME) || 1.0,
    rate: parseFloat(process.env.VOICE_SYNTHESIS_RATE) || 1.0,
    pitch: parseFloat(process.env.VOICE_SYNTHESIS_PITCH) || 1.0,
    lang: process.env.VOICE_SYNTHESIS_LANG || 'pt-BR'
  },

  // Configurações de cache
  cache: {
    enabled: process.env.VOICE_CACHE_ENABLED === 'true' || true,
    directory: './cache/voice',
    ttl: parseInt(process.env.VOICE_CACHE_TTL) || 3600, // 1 hora em segundos
    maxSize: parseInt(process.env.VOICE_CACHE_MAX_SIZE) || 50, // MB
    cleanupInterval: parseInt(process.env.VOICE_CACHE_CLEANUP_INTERVAL) || 3600000 // 1 hora
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.VOICE_NOTIFICATIONS_ENABLED === 'true' || true,
    voiceFeedback: process.env.VOICE_FEEDBACK_ENABLED === 'true' || true,
    visualFeedback: process.env.VOICE_VISUAL_FEEDBACK === 'true' || true,
    soundEffects: process.env.VOICE_SOUND_EFFECTS === 'true' || true,
    commandRecognized: process.env.VOICE_NOTIFY_COMMAND_RECOGNIZED === 'true' || true,
    commandNotFound: process.env.VOICE_NOTIFY_COMMAND_NOT_FOUND === 'true' || true,
    recordingStarted: process.env.VOICE_NOTIFY_RECORDING_STARTED === 'true' || true,
    recordingStopped: process.env.VOICE_NOTIFY_RECORDING_STOPPED === 'true' || true,
    errorOccurred: process.env.VOICE_NOTIFY_ERROR_OCCURRED === 'true' || true
  },

  // Configurações de segurança
  security: {
    encryptVoiceData: process.env.VOICE_ENCRYPT_DATA === 'true' || false,
    salt: process.env.VOICE_ENCRYPTION_SALT || 'movienizer-voice-salt-16-chars!',
    algorithm: process.env.VOICE_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de aprendizado
  learning: {
    enabled: process.env.VOICE_LEARNING_ENABLED === 'true' || true,
    autoLearn: process.env.VOICE_AUTO_LEARN === 'true' || true,
    maxLearningItems: parseInt(process.env.VOICE_MAX_LEARNING_ITEMS) || 1000,
    confidenceThreshold: parseFloat(process.env.VOICE_CONFIDENCE_THRESHOLD) || 0.7
  },

  // Configurações de interface
  ui: {
    showVoiceButton: process.env.VOICE_SHOW_BUTTON === 'true' || true,
    voiceButtonPosition: process.env.VOICE_BUTTON_POSITION || 'bottom-right', // top-left, top-right, bottom-left, bottom-right
    showVoiceIndicator: process.env.VOICE_SHOW_INDICATOR === 'true' || true,
    voiceIndicatorPosition: process.env.VOICE_INDICATOR_POSITION || 'top', // top, bottom
    showVoiceCommands: process.env.VOICE_SHOW_COMMANDS === 'true' || true,
    voiceCommandsPosition: process.env.VOICE_COMMANDS_POSITION || 'sidebar', // sidebar, modal, dropdown
    enableVoiceShortcuts: process.env.VOICE_SHORTCUTS_ENABLED === 'true' || true,
    voiceShortcutKey: process.env.VOICE_SHORTCUT_KEY || 'Ctrl+Shift+V'
  },

  // Configurações de widgets
  widgets: {
    voiceSearch: {
      enabled: process.env.VOICE_WIDGET_SEARCH_ENABLED === 'true' || true,
      showMicButton: process.env.VOICE_WIDGET_SHOW_MIC === 'true' || true,
      showVoiceFeedback: process.env.VOICE_WIDGET_SHOW_FEEDBACK === 'true' || true,
      showCommandHistory: process.env.VOICE_WIDGET_SHOW_HISTORY === 'true' || true,
      maxHistoryItems: parseInt(process.env.VOICE_WIDGET_MAX_HISTORY) || 10
    },
    voiceCommands: {
      enabled: process.env.VOICE_WIDGET_COMMANDS_ENABLED === 'true' || true,
      showCommandList: process.env.VOICE_WIDGET_SHOW_COMMAND_LIST === 'true' || true,
      showVoiceTraining: process.env.VOICE_WIDGET_SHOW_TRAINING === 'true' || true,
      showVoiceStats: process.env.VOICE_WIDGET_SHOW_STATS === 'true' || true
    }
  },

  // Configurações de templates
  templates: {
    voiceSearch: {
      enabled: process.env.VOICE_TEMPLATE_SEARCH_ENABLED === 'true' || true,
      showVoiceInput: process.env.VOICE_TEMPLATE_SHOW_INPUT === 'true' || true,
      showVoiceResults: process.env.VOICE_TEMPLATE_SHOW_RESULTS === 'true' || true,
      showVoiceSuggestions: process.env.VOICE_TEMPLATE_SHOW_SUGGESTIONS === 'true' || true
    },
    voiceCommands: {
      enabled: process.env.VOICE_TEMPLATE_COMMANDS_ENABLED === 'true' || true,
      showVoiceCommands: process.env.VOICE_TEMPLATE_SHOW_COMMANDS === 'true' || true,
      showVoiceTraining: process.env.VOICE_TEMPLATE_SHOW_TRAINING === 'true' || true,
      showVoiceHelp: process.env.VOICE_TEMPLATE_SHOW_HELP === 'true' || true
    }
  },

  // Configurações de animações
  animations: {
    voiceButton: {
      enabled: process.env.VOICE_ANIMATION_BUTTON_ENABLED === 'true' || true,
      pulse: process.env.VOICE_ANIMATION_PULSE === 'true' || true,
      bounce: process.env.VOICE_ANIMATION_BOUNCE === 'true' || false,
      shake: process.env.VOICE_ANIMATION_SHAKE === 'true' || false
    },
    voiceIndicator: {
      enabled: process.env.VOICE_ANIMATION_INDICATOR_ENABLED === 'true' || true,
      fade: process.env.VOICE_ANIMATION_FADE === 'true' || true,
      slide: process.env.VOICE_ANIMATION_SLIDE === 'true' || false,
      zoom: process.env.VOICE_ANIMATION_ZOOM === 'true' || false
    },
    voiceFeedback: {
      enabled: process.env.VOICE_ANIMATION_FEEDBACK_ENABLED === 'true' || true,
      pop: process.env.VOICE_ANIMATION_POP === 'true' || true,
      wave: process.env.VOICE_ANIMATION_WAVE === 'true' || false,
      sparkle: process.env.VOICE_ANIMATION_SPARKLE === 'true' || false
    }
  },

  // Configurações de fallback
  fallback: {
    useFallbackMethods: process.env.VOICE_USE_FALLBACK === 'true' || true,
    fallbackToText: process.env.VOICE_FALLBACK_TO_TEXT === 'true' || true,
    fallbackToKeyboard: process.env.VOICE_FALLBACK_TO_KEYBOARD === 'true' || true,
    maxFallbackAttempts: parseInt(process.env.VOICE_MAX_FALLBACK_ATTEMPTS) || 3
  },

  // Configurações de compatibilidade
  compatibility: {
    webSpeechApi: process.env.VOICE_WEB_SPEECH_API === 'true' || true,
    mediaRecorder: process.env.VOICE_MEDIA_RECORDER === 'true' || true,
    audioContext: process.env.VOICE_AUDIO_CONTEXT === 'true' || true,
    getUserMedia: process.env.VOICE_GET_USER_MEDIA === 'true' || true
  },

  // Configurações de performance
  performance: {
    maxAudioBufferSize: parseInt(process.env.VOICE_MAX_AUDIO_BUFFER) || 1024,
    audioSampleRate: parseInt(process.env.VOICE_AUDIO_SAMPLE_RATE) || 44100,
    audioBitDepth: parseInt(process.env.VOICE_AUDIO_BIT_DEPTH) || 16,
    audioChannels: parseInt(process.env.VOICE_AUDIO_CHANNELS) || 1,
    maxProcessingTime: parseInt(process.env.VOICE_MAX_PROCESSING_TIME) || 5000 // 5 segundos
  },

  // Configurações de acessibilidade
  accessibility: {
    highContrastMode: process.env.VOICE_HIGH_CONTRAST === 'true' || false,
    largeTextMode: process.env.VOICE_LARGE_TEXT === 'true' || false,
    screenReaderSupport: process.env.VOICE_SCREEN_READER === 'true' || true,
    keyboardNavigation: process.env.VOICE_KEYBOARD_NAV === 'true' || true,
    focusIndicators: process.env.VOICE_FOCUS_INDICATORS === 'true' || true
  },

  // Configurações de internacionalização
  i18n: {
    supportedLanguages: Object.keys(voiceConfig.languages),
    defaultLanguage: process.env.VOICE_DEFAULT_LANGUAGE || 'pt-BR',
    autoDetectLanguage: process.env.VOICE_AUTO_DETECT_LANGUAGE === 'true' || true,
    translateCommands: process.env.VOICE_TRANSLATE_COMMANDS === 'true' || true,
    translateFeedback: process.env.VOICE_TRANSLATE_FEEDBACK === 'true' || true
  },

  // Configurações de integração
  integration: {
    withSearch: process.env.VOICE_INTEGRATE_SEARCH === 'true' || true,
    withMovies: process.env.VOICE_INTEGRATE_MOVIES === 'true' || true,
    withPeople: process.env.VOICE_INTEGRATE_PEOPLE === 'true' || true,
    withStreaming: process.env.VOICE_INTEGRATE_STREAMING === 'true' || true,
    withNotifications: process.env.VOICE_INTEGRATE_NOTIFICATIONS === 'true' || true,
    withReminders: process.env.VOICE_INTEGRATE_REMINDERS === 'true' || true,
    withReports: process.env.VOICE_INTEGRATE_REPORTS === 'true' || true,
    withCloud: process.env.VOICE_INTEGRATE_CLOUD === 'true' || true,
    withBackup: process.env.VOICE_INTEGRATE_BACKUP === 'true' || true,
    withThemes: process.env.VOICE_INTEGRATE_THEMES === 'true' || true,
    withWidgets: process.env.VOICE_INTEGRATE_WIDGETS === 'true' || true,
    withDashboards: process.env.VOICE_INTEGRATE_DASHBOARDS === 'true' || true
  }
};

module.exports = voiceConfig;