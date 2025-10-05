const Reminder = require('../models/Reminder');
const NotificationService = require('./notificationService');
const cron = require('node-cron');

class ReminderService {
  static async createReminder(userId, reminderData) {
    try {
      const reminder = Reminder.create({
        user_id: userId,
        title: reminderData.title,
        description: reminderData.description,
        reminder_date: reminderData.reminder_date,
        is_recurring: reminderData.is_recurring || false,
        recurrence_pattern: reminderData.recurrence_pattern,
        related_movie_id: reminderData.related_movie_id,
        related_person_id: reminderData.related_person_id
      });

      // Agendar verificação
      this.scheduleReminderCheck(reminder);

      return reminder;
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      throw error;
    }
  }

  static async getUserReminders(userId) {
    return Reminder.findByUserId(userId);
  }

  static async getUpcomingReminders(userId, days = 7) {
    return Reminder.findUpcoming(userId, days);
  }

  static async getOverdueReminders(userId) {
    return Reminder.findOverdue(userId);
  }

  static async completeReminder(reminderId) {
    Reminder.complete(reminderId);
  }

  static async updateReminder(reminderId, reminderData) {
    Reminder.update(reminderId, reminderData);
  }

  static async deleteReminder(reminderId) {
    Reminder.delete(reminderId);
  }

  static async getReminderById(reminderId) {
    return Reminder.getById(reminderId);
  }

  // Agendar verificação de lembretes
  static scheduleReminderCheck(reminder) {
    // Converter data para formato cron
    const date = new Date(reminder.reminder_date);
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;

    // Agendar para verificar na data/hora do lembrete
    const cronExpression = `${minutes} ${hours} ${dayOfMonth} ${month} *`;
    
    try {
      cron.schedule(cronExpression, async () => {
        await this.checkAndNotifyReminder(reminder);
      }, {
        timezone: 'America/Sao_Paulo'
      });
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
    }
  }

  // Verificar e notificar lembrete
  static async checkAndNotifyReminder(reminder) {
    try {
      // Verificar se o lembrete ainda não foi completado
      const currentReminder = await this.getReminderById(reminder.id);
      if (currentReminder && !currentReminder.is_completed) {
        // Criar notificação
        await NotificationService.notifyReminderDue(reminder.user_id, reminder);
        
        // Se for recorrente, criar novo lembrete
        if (reminder.is_recurring) {
          await this.handleRecurringReminder(reminder);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar lembrete:', error);
    }
  }

  // Lidar com lembretes recorrentes
  static async handleRecurringReminder(reminder) {
    try {
      const nextDate = this.calculateNextRecurrence(reminder);
      if (nextDate) {
        const newReminder = await this.createReminder(reminder.user_id, {
          title: reminder.title,
          description: reminder.description,
          reminder_date: nextDate.toISOString(),
          is_recurring: reminder.is_recurring,
          recurrence_pattern: reminder.recurrence_pattern,
          related_movie_id: reminder.related_movie_id,
          related_person_id: reminder.related_person_id
        });

        // Agendar novo lembrete
        this.scheduleReminderCheck(newReminder);
      }
    } catch (error) {
      console.error('Erro ao lidar com lembrete recorrente:', error);
    }
  }

  // Calcular próxima data de recorrência
  static calculateNextRecurrence(reminder) {
    const currentDate = new Date(reminder.reminder_date);
    const pattern = reminder.recurrence_pattern;

    switch (pattern) {
      case 'daily':
        return new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'yearly':
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear;
      default:
        return null;
    }
  }

  // Verificar lembretes pendentes (executado periodicamente)
  static async checkPendingReminders() {
    try {
      // Obter todos os usuários
      const users = await User.findAll();
      
      for (const user of users) {
        // Verificar lembretes próximos (próximas 24 horas)
        const upcomingReminders = await this.getUpcomingReminders(user.id, 1);
        
        for (const reminder of upcomingReminders) {
          // Notificar usuário
          await NotificationService.notifyReminderDue(user.id, reminder);
        }
        
        // Verificar lembretes atrasados
        const overdueReminders = await this.getOverdueReminders(user.id);
        
        for (const reminder of overdueReminders) {
          // Notificar usuário sobre lembrete atrasado
          await NotificationService.createNotification(user.id, {
            title: 'Lembrete Atrasado',
            message: `Lembrete atrasado: ${reminder.title}`,
            type: 'error',
            priority: 'high',
            related_movie_id: reminder.related_movie_id,
            related_person_id: reminder.related_person_id
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar lembretes pendentes:', error);
    }
  }
}

// Agendar verificação periódica (a cada hora)
cron.schedule('0 * * * *', async () => {
  await ReminderService.checkPendingReminders();
}, {
  timezone: 'America/Sao_Paulo'
});

module.exports = ReminderService;