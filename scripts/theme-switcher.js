// theme-switcher.js

const ThemeService = require('../services/themeService');

class ThemeSwitcher {
  static async start() {
    try {
      console.log('Iniciando sistema de temas...');

      // Agendar monitoramento de mudanças do sistema
      await ThemeService.scheduleThemeUpdate();

      console.log('Sistema de temas iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar sistema de temas:', error);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  ThemeSwitcher.start();
}

module.exports = ThemeSwitcher;