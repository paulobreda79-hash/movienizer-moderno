// themeService.js

const db = require('../data/database/init');
const themeConfig = require('../config/themeConfig');
const ThemeUtils = require('../utils/themeUtils');

class ThemeService {
  static async getUserThemePreferences(userId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM user_settings 
        WHERE user_id = ?
      `);
      const settings = stmt.get(userId);

      if (settings && settings.theme) {
        return settings.theme;
      }

      return themeConfig.general.defaultTheme;
    } catch (error) {
      console.error('Erro ao obter preferências de tema do usuário:', error);
      return themeConfig.general.defaultTheme;
    }
  }

  static async setUserThemePreferences(userId, themeId) {
    try {
      // Verificar se o tema existe
      if (!themeConfig.themes[themeId]) {
        throw new Error(`Tema não encontrado: ${themeId}`);
      }

      const stmt = db.prepare(`
        UPDATE user_settings 
        SET theme = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      stmt.run(themeId, userId);

      console.log(`Preferências de tema atualizadas para usuário ${userId}: ${themeId}`);
      return true;
    } catch (error) {
      console.error('Erro ao definir preferências de tema do usuário:', error);
      throw error;
    }
  }

  static async getAvailableThemes() {
    try {
      return Object.values(themeConfig.themes);
    } catch (error) {
      console.error('Erro ao obter temas disponíveis:', error);
      throw error;
    }
  }

  static async getThemeById(themeId) {
    try {
      return themeConfig.themes[themeId] || null;
    } catch (error) {
      console.error('Erro ao obter tema por ID:', error);
      throw error;
    }
  }

  static async createCustomTheme(themeData) {
    try {
      if (!themeConfig.general.enableCustomThemes) {
        throw new Error('Temas personalizados desativados');
      }

      const customTheme = ThemeUtils.createCustomTheme(themeData);
      return customTheme;
    } catch (error) {
      console.error('Erro ao criar tema personalizado:', error);
      throw error;
    }
  }

  static async removeCustomTheme(themeId, userId) {
    try {
      // Verificar se é tema personalizado
      if (!themeId.startsWith('custom-')) {
        throw new Error('Apenas temas personalizados podem ser removidos');
      }

      // Remover do config
      ThemeUtils.removeCustomTheme(themeId);

      // Atualizar preferências do usuário se estiver usando este tema
      const currentTheme = await this.getUserThemePreferences(userId);
      if (currentTheme === themeId) {
        await this.setUserThemePreferences(userId, themeConfig.general.defaultTheme);
      }

      console.log(`Tema personalizado ${themeId} removido para usuário ${userId}`);
      return true;
    } catch (error) {
      console.error('Erro ao remover tema personalizado:', error);
      throw error;
    }
  }

  static async exportTheme(themeId) {
    try {
      const theme = await this.getThemeById(themeId);
      if (!theme) {
        throw new Error(`Tema não encontrado: ${themeId}`);
      }

      const exportedData = {
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
        info: theme.colors.info,
        createdAt: new Date().toISOString()
      };

      return exportedData;
    } catch (error) {
      console.error('Erro ao exportar tema:', error);
      throw error;
    }
  }

  static async importTheme(themeData, userId) {
    try {
      if (!themeConfig.general.enableCustomThemes) {
        throw new Error('Temas personalizados desativados');
      }

      const importedTheme = await this.createCustomTheme(themeData);
      
      // Salvar nas preferências do usuário
      await this.setUserThemePreferences(userId, importedTheme.id);

      return importedTheme;
    } catch (error) {
      console.error('Erro ao importar tema:', error);
      throw error;
    }
  }

  static async getSystemThemePreference() {
    try {
      return ThemeUtils.getSystemThemePreference();
    } catch (error) {
      console.error('Erro ao obter preferência do sistema:', error);
      return 'light';
    }
  }

  static async applyTheme(userId, themeId = null) {
    try {
      let themeToApply = themeId;

      // Se não especificado, obter preferência do usuário
      if (!themeToApply) {
        themeToApply = await this.getUserThemePreferences(userId);
      }

      // Se for tema automático, detectar do sistema
      if (themeToApply === 'auto') {
        themeToApply = await this.getSystemThemePreference();
      }

      // Aplicar tema
      ThemeUtils.setTheme(themeToApply);

      return await this.getThemeById(themeToApply);
    } catch (error) {
      console.error('Erro ao aplicar tema:', error);
      throw error;
    }
  }

  static async getThemeStats(userId) {
    try {
      const themes = await this.getAvailableThemes();
      
      // Obter estatísticas de uso
      const usageStmt = db.prepare(`
        SELECT theme, COUNT(*) as count 
        FROM user_settings 
        WHERE theme IS NOT NULL 
        GROUP BY theme
      `);
      const usageStats = usageStmt.all();

      const stats = {
        totalThemes: themes.length,
        mostUsed: usageStats.length > 0 ? usageStats[0] : null,
        usageDistribution: usageStats,
        currentUserTheme: await this.getUserThemePreferences(userId)
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de temas:', error);
      throw error;
    }
  }

  static async resetUserTheme(userId) {
    try {
      await this.setUserThemePreferences(userId, themeConfig.general.defaultTheme);
      ThemeUtils.setTheme(themeConfig.general.defaultTheme);
      console.log(`Tema do usuário ${userId} redefinido para padrão`);
      return true;
    } catch (error) {
      console.error('Erro ao redefinir tema do usuário:', error);
      throw error;
    }
  }

  static async scheduleThemeUpdate() {
    try {
      // Verificar mudanças no sistema a cada minuto
      setInterval(async () => {
        const systemTheme = await this.getSystemThemePreference();
        const currentTheme = ThemeUtils.getCurrentTheme();
        
        // Se estiver no modo automático, atualizar conforme sistema
        if (currentTheme.id === 'auto') {
          ThemeUtils.setTheme(systemTheme, false);
        }
      }, 60000); // 1 minuto

      console.log('Monitoramento de tema agendado');
    } catch (error) {
      console.error('Erro ao agendar atualização de tema:', error);
    }
  }
}

module.exports = ThemeService;