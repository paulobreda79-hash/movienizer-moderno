// themeConfig.js

const themeConfig = {
  // Temas disponíveis
  themes: {
    light: {
      id: 'light',
      name: 'Claro',
      class: 'theme-light',
      icon: '☀️',
      colors: {
        primary: '#3498db',
        secondary: '#95a5a6',
        background: '#f5f5f5',
        surface: '#ffffff',
        text: '#333333',
        textSecondary: '#777777',
        border: '#dddddd',
        shadow: 'rgba(0,0,0,0.05)',
        accent: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        info: '#3498db'
      }
    },
    dark: {
      id: 'dark',
      name: 'Escuro',
      class: 'theme-dark',
      icon: '🌙',
      colors: {
        primary: '#3498db',
        secondary: '#7f8c8d',
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#bbbbbb',
        border: '#444444',
        shadow: 'rgba(0,0,0,0.3)',
        accent: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        info: '#3498db'
      }
    },
    auto: {
      id: 'auto',
      name: 'Automático',
      class: 'theme-auto',
      icon: '🌓',
      colors: {} // Herda do sistema
    },
    blue: {
      id: 'blue',
      name: 'Azul Profundo',
      class: 'theme-blue',
      icon: '🔵',
      colors: {
        primary: '#2980b9',
        secondary: '#34495e',
        background: '#ecf0f1',
        surface: '#ffffff',
        text: '#2c3e50',
        textSecondary: '#7f8c8d',
        border: '#bdc3c7',
        shadow: 'rgba(44, 62, 80, 0.1)',
        accent: '#3498db',
        success: '#27ae60',
        warning: '#f39c12',
        error: '#c0392b',
        info: '#2980b9'
      }
    },
    green: {
      id: 'green',
      name: 'Verde Natureza',
      class: 'theme-green',
      icon: '🌿',
      colors: {
        primary: '#27ae60',
        secondary: '#2ecc71',
        background: '#e8f5e9',
        surface: '#ffffff',
        text: '#2e7d32',
        textSecondary: '#4caf50',
        border: '#c8e6c9',
        shadow: 'rgba(46, 125, 50, 0.1)',
        accent: '#4caf50',
        success: '#27ae60',
        warning: '#ffb300',
        error: '#e53935',
        info: '#27ae60'
      }
    },
    purple: {
      id: 'purple',
      name: 'Roxo Místico',
      class: 'theme-purple',
      icon: '🟣',
      colors: {
        primary: '#8e44ad',
        secondary: '#9b59b6',
        background: '#f3e5f5',
        surface: '#ffffff',
        text: '#4a148c',
        textSecondary: '#7b1fa2',
        border: '#e1bee7',
        shadow: 'rgba(142, 68, 173, 0.1)',
        accent: '#9c27b0',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#9c27b0'
      }
    },
    highContrast: {
      id: 'highContrast',
      name: 'Alto Contraste',
      class: 'theme-high-contrast',
      icon: '🔆',
      colors: {
        primary: '#000000',
        secondary: '#333333',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        shadow: 'rgba(0,0,0,0.2)',
        accent: '#000000',
        success: '#006400',
        warning: '#8b4513',
        error: '#8b0000',
        info: '#000080'
      }
    }
  },

  // Configurações gerais
  general: {
    defaultTheme: process.env.DEFAULT_THEME || 'light',
    autoDetect: process.env.AUTO_DETECT_THEME === 'true' || true,
    transitionDuration: process.env.THEME_TRANSITION_DURATION || '0.3s',
    persistPreferences: process.env.PERSIST_THEME_PREFERENCES === 'true' || true,
    enableCustomThemes: process.env.ENABLE_CUSTOM_THEMES === 'true' || true
  },

  // Configurações de sistema
  system: {
    prefersDarkMediaQuery: '(prefers-color-scheme: dark)',
    prefersLightMediaQuery: '(prefers-color-scheme: light)'
  },

  // Configurações de armazenamento
  storage: {
    localStorageKey: 'movienizer-theme',
    sessionStorageKey: 'movienizer-theme-session',
    cookieKey: 'movienizer-theme-cookie'
  },

  // Configurações de acessibilidade
  accessibility: {
    respectSystemPreferences: process.env.RESPECT_SYSTEM_PREFERENCES === 'true' || true,
    highContrastMode: process.env.HIGH_CONTRAST_MODE === 'true' || false,
    reducedMotion: process.env.REDUCED_MOTION === 'true' || false
  }
};

module.exports = themeConfig;