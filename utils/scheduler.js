const cron = require('node-cron');
const ReminderService = require('../services/reminderService');
const NotificationService = require('../services/notificationService');

class Scheduler {
  static start() {
    // Verificar lembretes a cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('[SCHEDULER] Verificando lembretes...');
      await ReminderService.checkPendingReminders();
    }, {
      timezone: 'America/Sao_Paulo'
    });

    // Limpar notificações expiradas diariamente
    cron.schedule('0 2 * * *', () => {
      console.log('[SCHEDULER] Limpando notificações expiradas...');
      // Notification.deleteExpired(); // Implementar no modelo
    }, {
      timezone: 'America/Sao_Paulo'
    });

    // Backup automático semanal (domingo às 3h)
    cron.schedule('0 3 * * 0', () => {
      console.log('[SCHEDULER] Executando backup automático...');
      // Implementar backup automático
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log('[SCHEDULER] Sistema de agendamento iniciado');
  }

  static scheduleCustomJob(cronExpression, jobFunction, options = {}) {
    try {
      const job = cron.schedule(cronExpression, jobFunction, {
        timezone: options.timezone || 'America/Sao_Paulo',
        ...options
      });
      return job;
    } catch (error) {
      console.error('Erro ao agendar trabalho customizado:', error);
      return null;
    }
  }

  static scheduleMovieReleaseNotification(movie, releaseDate) {
    // Agendar notificação para data de lançamento
    const date = new Date(releaseDate);
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const cronExpression = `${minutes} ${hours} ${day} ${month} * ${year}`;
    
    return this.scheduleCustomJob(cronExpression, async () => {
      // Enviar notificação de lançamento
      // await NotificationService.notifyMovieRelease(movie);
    });
  }

  static scheduleBirthdayReminder(person, birthDate) {
    // Agendar lembrete de aniversário (anualmente)
    const date = new Date(birthDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    const cronExpression = `0 9 ${day} ${month} *`; // 9h da manhã
    
    return this.scheduleCustomJob(cronExpression, async () => {
      // Enviar lembrete de aniversário
      // await NotificationService.notifyBirthday(person);
    });
  }
}

module.exports = Scheduler;