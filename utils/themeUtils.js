// themeUtils.js

const themeConfig = require('../config/themeConfig');

class ThemeUtils {
  static getCurrentTheme() {
    try {
      // Verificar localStorage
      const storedTheme = localStorage.getItem(themeConfig.storage.localStorageKey);
      if (storedTheme && themeConfig.themes[storedTheme]) {
        return themeConfig.themes[storedTheme];
      }

      // Verificar sessionStorage
      const sessionTheme = sessionStorage.getItem(themeConfig.storage.sessionStorageKey);
      if (sessionTheme && themeConfig.themes[sessionTheme]) {
        return themeConfig.themes[sessionTheme];
      }

      // Verificar cookies
      const cookieTheme = this.getCookie(themeConfig.storage.cookieKey);
      if (cookieTheme && themeConfig.themes[cookieTheme]) {
        return themeConfig.themes[cookieTheme];
      }

      // Verificar preferências do sistema
      if (themeConfig.general.autoDetect) {
        const systemPrefersDark = window.matchMedia && 
          window.matchMedia(themeConfig.system.prefersDarkMediaQuery).matches;
        
        if (systemPrefersDark) {
          return themeConfig.themes.dark;
        }
      }

      // Retornar tema padrão
      return themeConfig.themes[themeConfig.general.defaultTheme] || 
             Object.values(themeConfig.themes)[0];
    } catch (error) {
      console.error('Erro ao obter tema atual:', error);
      return themeConfig.themes[themeConfig.general.defaultTheme];
    }
  }

  static setTheme(themeId, persist = true) {
    try {
      const theme = themeConfig.themes[themeId];
      if (!theme) {
        throw new Error(`Tema não encontrado: ${themeId}`);
      }

      // Remover classes antigas de tema
      Object.values(themeConfig.themes).forEach(t => {
        document.body.classList.remove(t.class);
      });

      // Adicionar nova classe de tema
      document.body.classList.add(theme.class);

      // Aplicar variáveis CSS personalizadas
      if (theme.colors && Object.keys(theme.colors).length > 0) {
        Object.entries(theme.colors).forEach(([property, value]) => {
          document.documentElement.style.setProperty(`--theme-${property}`, value);
        });
      }

      // Persistir preferência se solicitado
      if (persist && themeConfig.general.persistPreferences) {
        localStorage.setItem(themeConfig.storage.localStorageKey, themeId);
        sessionStorage.setItem(themeConfig.storage.sessionStorageKey, themeId);
        this.setCookie(themeConfig.storage.cookieKey, themeId, 365);
      }

      // Disparar evento de mudança de tema
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { themeId, theme }
      }));

      console.log(`Tema alterado para: ${theme.name}`);
      return theme;

    } catch (error) {
      console.error('Erro ao definir tema:', error);
      throw error;
    }
  }

  static toggleTheme() {
    try {
      const currentTheme = this.getCurrentTheme();
      const themeKeys = Object.keys(themeConfig.themes);
      const currentIndex = themeKeys.indexOf(currentTheme.id);
      const nextIndex = (currentIndex + 1) % themeKeys.length;
      const nextThemeId = themeKeys[nextIndex];

      return this.setTheme(nextThemeId);
    } catch (error) {
      console.error('Erro ao alternar tema:', error);
      throw error;
    }
  }

  static setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    } catch (error) {
      console.error('Erro ao definir cookie:', error);
    }
  }

  static getCookie(name) {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter cookie:', error);
      return null;
    }
  }

  static removeCookie(name) {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
    } catch (error) {
      console.error('Erro ao remover cookie:', error);
    }
  }

  static getAvailableThemes() {
    return Object.values(themeConfig.themes);
  }

  static getThemeById(themeId) {
    return themeConfig.themes[themeId] || null;
  }

  static isDarkTheme() {
    const currentTheme = this.getCurrentTheme();
    return currentTheme.id === 'dark' || 
           (currentTheme.id === 'auto' && 
            window.matchMedia && 
            window.matchMedia(themeConfig.system.prefersDarkMediaQuery).matches);
  }

  static applyThemeTransitions() {
    try {
      const style = document.createElement('style');
      style.textContent = `
        * {
          transition: background-color ${themeConfig.general.transitionDuration} ease,
                      color ${themeConfig.general.transitionDuration} ease,
                      border-color ${themeConfig.general.transitionDuration} ease,
                      box-shadow ${themeConfig.general.transitionDuration} ease !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      console.error('Erro ao aplicar transições de tema:', error);
    }
  }

  static initializeTheme() {
    try {
      // Aplicar transições
      if (!themeConfig.accessibility.reducedMotion) {
        this.applyThemeTransitions();
      }

      // Definir tema inicial
      const initialTheme = this.getCurrentTheme();
      this.setTheme(initialTheme.id, false);

      // Ouvir mudanças no sistema
      if (themeConfig.general.autoDetect && window.matchMedia) {
        const darkMediaQuery = window.matchMedia(themeConfig.system.prefersDarkMediaQuery);
        darkMediaQuery.addListener((e) => {
          if (this.getCurrentTheme().id === 'auto') {
            const newTheme = e.matches ? 'dark' : 'light';
            this.setTheme(newTheme, false);
          }
        });
      }

      console.log('Sistema de temas inicializado');
    } catch (error) {
      console.error('Erro ao inicializar sistema de temas:', error);
    }
  }

  static createCustomTheme(themeData) {
    try {
      if (!themeConfig.general.enableCustomThemes) {
        throw new Error('Temas personalizados desativados');
      }

      const customTheme = {
        id: `custom-${Date.now()}`,
        name: themeData.name || 'Tema Personalizado',
        class: `theme-custom-${Date.now()}`,
        icon: themeData.icon || '🎨',
        colors: {
          primary: themeData.primary || '#3498db',
          secondary: themeData.secondary || '#95a5a6',
          background: themeData.background || '#f5f5f5',
          surface: themeData.surface || '#ffffff',
          text: themeData.text || '#333333',
          textSecondary: themeData.textSecondary || '#777777',
          border: themeData.border || '#dddddd',
          shadow: themeData.shadow || 'rgba(0,0,0,0.05)',
          accent: themeData.accent || '#3498db',
          success: themeData.success || '#2ecc71',
          warning: themeData.warning || '#f39c12',
          error: themeData.error || '#e74c3c',
          info: themeData.info || '#3498db'
        }
      };

      // Adicionar ao config
      themeConfig.themes[customTheme.id] = customTheme;

      return customTheme;
    } catch (error) {
      console.error('Erro ao criar tema personalizado:', error);
      throw error;
    }
  }

  static removeCustomTheme(themeId) {
    try {
      if (!themeId.startsWith('custom-')) {
        throw new Error('Apenas temas personalizados podem ser removidos');
      }

      delete themeConfig.themes[themeId];
      console.log(`Tema personalizado ${themeId} removido`);
    } catch (error) {
      console.error('Erro ao remover tema personalizado:', error);
      throw error;
    }
  }

  static exportTheme(themeId) {
    try {
      const theme = this.getThemeById(themeId);
      if (!theme) {
        throw new Error(`Tema não encontrado: ${themeId}`);
      }

      const themeData = {
        name: theme.name,
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        background: theme.colors.background,
        surface: theme.colors.surface,
        text: theme.colors.text,
        textSecondary: theme.colors.textSecondary,
        border: theme.colors.border,
        shadow: theme.colors.shadow,
        accent: theme.colors.accent,
        success: theme.colors.success,
        warning: theme.colors.warning,
        error: theme.colors.error,
        info: theme.colors.info
      };

      return themeData;
    } catch (error) {
      console.error('Erro ao exportar tema:', error);
      throw error;
    }
  }

  static importTheme(themeData) {
    try {
      const importedTheme = this.createCustomTheme(themeData);
      return importedTheme;
    } catch (error) {
      console.error('Erro ao importar tema:', error);
      throw error;
    }
  }

  static getSystemThemePreference() {
    try {
      if (!window.matchMedia) {
        return 'light';
      }

      const darkQuery = window.matchMedia(themeConfig.system.prefersDarkMediaQuery);
      const lightQuery = window.matchMedia(themeConfig.system.prefersLightMediaQuery);

      if (darkQuery.matches) return 'dark';
      if (lightQuery.matches) return 'light';
      return 'light';
    } catch (error) {
      console.error('Erro ao obter preferência do sistema:', error);
      return 'light';
    }
  }
}

module.exports = ThemeUtils;