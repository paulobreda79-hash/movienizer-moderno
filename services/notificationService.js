const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('./emailService');

class NotificationService {
  static async createNotification(userId, notificationData) {
    try {
      // Criar notificação no banco
      const notification = Notification.create({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        related_movie_id: notificationData.related_movie_id,
        related_person_id: notificationData.related_person_id,
        expires_at: notificationData.expires_at
      });

      // Obter preferências do usuário
      const user = await User.findById(userId);
      const userPrefs = JSON.parse(user.preferences || '{}');

      // Enviar notificação push (Electron)
      if (userPrefs.notifications !== false) {
        this.sendPushNotification(userId, notification);
      }

      // Enviar e-mail (se configurado)
      if (userPrefs.email_notifications !== false && notificationData.send_email) {
        await this.sendEmailNotification(user, notification);
      }

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  static sendPushNotification(userId, notification) {
    // Esta função será chamada pelo processo principal do Electron
    // Para fins de demonstração, vamos apenas logar
    console.log(`[NOTIFICAÇÃO PUSH] Usuário ${userId}: ${notification.title} - ${notification.message}`);
    
    // Em produção, você usaria IPC para enviar para o renderer process
    // mainWindow.webContents.send('notification', notification);
  }

  static async sendEmailNotification(user, notification) {
    try {
      await EmailService.sendEmail({
        to: user.email,
        subject: `[MovieNizer] ${notification.title}`,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <hr>
          <p>Esta é uma notificação automática do MovieNizer.</p>
        `
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail de notificação:', error);
    }
  }

  static async getUserNotifications(userId, options = {}) {
    const { limit = 50, unreadOnly = false } = options;
    
    let notifications;
    if (unreadOnly) {
      notifications = Notification.findByUserId(userId, limit).filter(n => !n.is_read);
    } else {
      notifications = Notification.findByUserId(userId, limit);
    }

    return notifications;
  }

  static async markAsRead(notificationId) {
    Notification.markAsRead(notificationId);
  }

  static async markAllAsRead(userId) {
    Notification.markAllAsRead(userId);
  }

  static async deleteNotification(notificationId) {
    Notification.delete(notificationId);
  }

  static async getUnreadCount(userId) {
    const result = Notification.getUnreadCount(userId);
    return result.count;
  }

  // Tipos de notificações pré-definidas
  static async notifyMovieAdded(userId, movie) {
    return await this.createNotification(userId, {
      title: 'Novo Filme Adicionado',
      message: `O filme "${movie.title}" foi adicionado à sua coleção.`,
      type: 'success',
      priority: 'medium',
      related_movie_id: movie.id
    });
  }

  static async notifyMovieWatched(userId, movie) {
    return await this.createNotification(userId, {
      title: 'Filme Marcado como Visto',
      message: `Você marcou "${movie.title}" como visto.`,
      type: 'info',
      priority: 'low',
      related_movie_id: movie.id
    });
  }

  static async notifyReminderDue(userId, reminder) {
    return await this.createNotification(userId, {
      title: 'Lembrete Importante',
      message: `Lembrete: ${reminder.title}`,
      type: 'warning',
      priority: 'high',
      related_movie_id: reminder.related_movie_id,
      related_person_id: reminder.related_person_id
    });
  }

  static async notifyNewScrapeData(userId, dataType, count) {
    return await this.createNotification(userId, {
      title: 'Dados Atualizados',
      message: `Foram encontrados ${count} novos dados de ${dataType}.`,
      type: 'info',
      priority: 'medium'
    });
  }

  static async notifyBackupCompleted(userId, backupInfo) {
    return await this.createNotification(userId, {
      title: 'Backup Concluído',
      message: `Backup de ${backupInfo.size}MB concluído com sucesso.`,
      type: 'success',
      priority: 'low'
    });
  }

  static async notifyError(userId, errorInfo) {
    return await this.createNotification(userId, {
      title: 'Erro no Sistema',
      message: `Ocorreu um erro: ${errorInfo.message}`,
      type: 'error',
      priority: 'high'
    });
  }
}

module.exports = NotificationService;