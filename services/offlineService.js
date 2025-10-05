// offlineService.js

const offlineConfig = require('../config/offlineConfig');
const { IndexedDBManager, OfflineSyncService } = require('../utils/offlineUtils');
const db = require('../data/database/init');

class OfflineService {
  static async initialize() {
    try {
      // Verificar suporte a IndexedDB
      if (!('indexedDB' in window)) {
        throw new Error('IndexedDB não suportado neste navegador');
      }

      // Criar diretórios necessários
      await this.createDirectories();

      // Inicializar IndexedDB
      await this.initializeIndexedDB();

      // Agendar sincronização automática
      await OfflineSyncService.scheduleAutoSync();

      console.log('Serviço offline inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar serviço offline:', error);
      throw error;
    }
  }

  static async createDirectories() {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // Criar diretório de cache
      await fs.mkdir(offlineConfig.cache.directory, { recursive: true });

      // Criar diretório de backups
      await fs.mkdir('./backups', { recursive: true });

      console.log('Diretórios offline criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar diretórios offline:', error);
    }
  }

  static async initializeIndexedDB() {
    try {
      const indexedDBManager = new IndexedDBManager();
      await indexedDBManager.openDB();
      console.log('IndexedDB inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar IndexedDB:', error);
      throw error;
    }
  }

  static async enableOfflineMode() {
    try {
      // Salvar preferência de modo offline
      await this.saveSetting('offlineMode', true);
      
      // Notificar usuário
      if (offlineConfig.notifications.offlineMode) {
        await this.createNotification({
          title: 'Modo Offline Ativado',
          message: 'Você está trabalhando offline. Os dados serão sincronizados quando a conexão for restabelecida.',
          type: 'info',
          priority: 'medium'
        });
      }

      console.log('Modo offline ativado');
      return { success: true, message: 'Modo offline ativado!' };

    } catch (error) {
      console.error('Erro ao ativar modo offline:', error);
      throw error;
    }
  }

  static async disableOfflineMode() {
    try {
      // Salvar preferência de modo offline
      await this.saveSetting('offlineMode', false);
      
      // Notificar usuário
      if (offlineConfig.notifications.onlineMode) {
        await this.createNotification({
          title: 'Modo Online Restabelecido',
          message: 'Você está trabalhando online novamente.',
          type: 'success',
          priority: 'low'
        });
      }

      console.log('Modo offline desativado');
      return { success: true, message: 'Modo offline desativado!' };

    } catch (error) {
      console.error('Erro ao desativar modo offline:', error);
      throw error;
    }
  }

  static async isOfflineMode() {
    try {
      const setting = await this.getSetting('offlineMode');
      return setting === true;
    } catch (error) {
      console.error('Erro ao verificar modo offline:', error);
      return false;
    }
  }

  static async syncDataWithServer() {
    try {
      return await OfflineSyncService.syncDataWithServer();
    } catch (error) {
      console.error('Erro ao sincronizar dados com servidor:', error);
      throw error;
    }
  }

  static async saveDataLocally(dataType, data) {
    try {
      const indexedDBManager = new IndexedDBManager();
      await indexedDBManager.addToStore(dataType, data);
      
      // Notificar usuário sobre dados salvos
      if (offlineConfig.notifications.dataSaved) {
        await this.createNotification({
          title: 'Dados Salvos Localmente',
          message: `Os dados de ${dataType} foram salvos localmente.`,
          type: 'success',
          priority: 'low'
        });
      }

      console.log(`Dados de ${dataType} salvos localmente`);
      return { success: true, message: `Dados de ${dataType} salvos localmente!` };

    } catch (error) {
      console.error(`Erro ao salvar dados de ${dataType} localmente:`, error);

      // Notificar usuário sobre erro
      if (offlineConfig.notifications.syncError) {
        await this.createNotification({
          title: 'Erro ao Salvar Dados',
          message: `Falha ao salvar dados de ${dataType}: ${error.message}`,
          type: 'error',
          priority: 'high'
        });
      }

      throw error;
    }
  }

  static async loadDataLocally(dataType, key = null) {
    try {
      const indexedDBManager = new IndexedDBManager();
      
      if (key) {
        return await indexedDBManager.getFromStore(dataType, key);
      } else {
        return await indexedDBManager.getAllFromStore(dataType);
      }

    } catch (error) {
      console.error(`Erro ao carregar dados de ${dataType} localmente:`, error);
      throw error;
    }
  }

  static async updateDataLocally(dataType, key, data) {
    try {
      const indexedDBManager = new IndexedDBManager();
      await indexedDBManager.updateInStore(dataType, key, data);
      console.log(`Dados de ${dataType} atualizados localmente`);
      return { success: true, message: `Dados de ${dataType} atualizados localmente!` };

    } catch (error) {
      console.error(`Erro ao atualizar dados de ${dataType} localmente:`, error);
      throw error;
    }
  }

  static async deleteDataLocally(dataType, key) {
    try {
      const indexedDBManager = new IndexedDBManager();
      await indexedDBManager.deleteFromStore(dataType, key);
      console.log(`Dados de ${dataType} excluídos localmente`);
      return { success: true, message: `Dados de ${dataType} excluídos localmente!` };

    } catch (error) {
      console.error(`Erro ao excluir dados de ${dataType} localmente:`, error);
      throw error;
    }
  }

  static async clearLocalData(dataType = null) {
    try {
      const indexedDBManager = new IndexedDBManager();
      
      if (dataType) {
        await indexedDBManager.clearStore(dataType);
        console.log(`Dados de ${dataType} limpos localmente`);
      } else {
        // Limpar todas as stores
        for (const storeName of Object.keys(offlineConfig.indexedDB.stores)) {
          await indexedDBManager.clearStore(storeName);
        }
        console.log('Todos os dados locais limpos');
      }

      return { success: true, message: `Dados ${dataType ? `de ${dataType}` : 'locais'} limpos com sucesso!` };

    } catch (error) {
      console.error(`Erro ao limpar dados ${dataType ? `de ${dataType}` : 'locais'}:`, error);
      throw error;
    }
  }

  static async getLocalDataStats() {
    try {
      const indexedDBManager = new IndexedDBManager();
      const stats = {};

      for (const storeName of Object.keys(offlineConfig.indexedDB.stores)) {
        stats[storeName] = await indexedDBManager.getStoreCount(storeName);
      }

      // Calcular tamanho total (simplificado)
      const totalSize = Object.values(stats).reduce((acc, count) => acc + (count * 1024), 0); // Estimativa

      return {
        ...stats,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        lastSync: await this.getSetting('lastSync') || 'Nunca'
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas de dados locais:', error);
      throw error;
    }
  }

  static async createLocalBackup(userId) {
    try {
      // Obter todos os dados do usuário
      const indexedDBManager = new IndexedDBManager();
      
      const movies = await indexedDBManager.getAllFromStore('movies');
      const people = await indexedDBManager.getAllFromStore('people');
      const ratings = await indexedDBManager.getAllFromStore('ratings');
      const watchlist = await indexedDBManager.getAllFromStore('watchlist');
      const favorites = await indexedDBManager.getAllFromStore('favorites');
      const reminders = await indexedDBManager.getAllFromStore('reminders');
      const notifications = await indexedDBManager.getAllFromStore('notifications');
      const settings = await indexedDBManager.getAllFromStore('settings');
      const activityLogs = await indexedDBManager.getAllFromStore('activity_logs');
      const backups = await indexedDBManager.getAllFromStore('backups');
      const streaming = await indexedDBManager.getAllFromStore('streaming');
      const recommendations = await indexedDBManager.getAllFromStore('recommendations');

      const backupData = {
        movies,
        people,
        ratings,
        watchlist,
        favorites,
        reminders,
        notifications,
        settings,
        activityLogs,
        backups,
        streaming,
        recommendations,
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar backup no IndexedDB
      const backupId = Date.now();
      const backupFileName = `movienizer-backup-user-${userId}-${backupId}.json`;
      
      await indexedDBManager.addToStore('backups', {
        id: backupId,
        user_id: userId,
        filename: backupFileName,
        size: JSON.stringify(backupData).length,
        type: 'local',
        status: 'completed',
        location: 'indexeddb',
        checksum: null,
        created_at: new Date().toISOString(),
        expires_at: null,
        updated_at: new Date().toISOString()
      });

      // Salvar dados em arquivo
      const fs = require('fs').promises;
      await fs.writeFile(`./backups/${backupFileName}`, JSON.stringify(backupData, null, 2));

      // Notificar usuário
      if (offlineConfig.backup.autoBackup) {
        await this.createNotification({
          title: 'Backup Local Criado',
          message: `Backup "${backupFileName}" criado com sucesso!`,
          type: 'success',
          priority: 'medium'
        });
      }

      console.log(`Backup local criado: ${backupFileName}`);
      return { success: true, fileName: backupFileName };

    } catch (error) {
      console.error('Erro ao criar backup local:', error);

      // Notificar usuário sobre erro
      if (offlineConfig.notifications.syncError) {
        await this.createNotification({
          title: 'Erro ao Criar Backup',
          message: `Falha ao criar backup local: ${error.message}`,
          type: 'error',
          priority: 'high'
        });
      }

      throw error;
    }
  }

  static async restoreLocalBackup(userId, backupId) {
    try {
      // Obter backup do IndexedDB
      const indexedDBManager = new IndexedDBManager();
      const backup = await indexedDBManager.getFromStore('backups', backupId);
      
      if (!backup || backup.user_id !== userId) {
        throw new Error('Backup não encontrado ou acesso negado');
      }

      // Ler dados do arquivo
      const fs = require('fs').promises;
      const backupData = JSON.parse(await fs.readFile(`./backups/${backup.filename}`, 'utf8'));

      // Restaurar dados
      await this.clearLocalData();
      
      if (backupData.movies) {
        for (const movie of backupData.movies) {
          await indexedDBManager.addToStore('movies', movie);
        }
      }

      if (backupData.people) {
        for (const person of backupData.people) {
          await indexedDBManager.addToStore('people', person);
        }
      }

      if (backupData.ratings) {
        for (const rating of backupData.ratings) {
          await indexedDBManager.addToStore('ratings', rating);
        }
      }

      if (backupData.watchlist) {
        for (const item of backupData.watchlist) {
          await indexedDBManager.addToStore('watchlist', item);
        }
      }

      if (backupData.favorites) {
        for (const item of backupData.favorites) {
          await indexedDBManager.addToStore('favorites', item);
        }
      }

      if (backupData.reminders) {
        for (const reminder of backupData.reminders) {
          await indexedDBManager.addToStore('reminders', reminder);
        }
      }

      if (backupData.notifications) {
        for (const notification of backupData.notifications) {
          await indexedDBManager.addToStore('notifications', notification);
        }
      }

      if (backupData.settings) {
        for (const setting of backupData.settings) {
          await indexedDBManager.addToStore('settings', setting);
        }
      }

      if (backupData.activityLogs) {
        for (const log of backupData.activityLogs) {
          await indexedDBManager.addToStore('activity_logs', log);
        }
      }

      if (backupData.backups) {
        for (const backupItem of backupData.backups) {
          await indexedDBManager.addToStore('backups', backupItem);
        }
      }

      if (backupData.streaming) {
        for (const item of backupData.streaming) {
          await indexedDBManager.addToStore('streaming', item);
        }
      }

      if (backupData.recommendations) {
        for (const recommendation of backupData.recommendations) {
          await indexedDBManager.addToStore('recommendations', recommendation);
        }
      }

      // Notificar usuário
      if (offlineConfig.notifications.dataRestored) {
        await this.createNotification({
          title: 'Backup Restaurado',
          message: 'Backup restaurado com sucesso!',
          type: 'success',
          priority: 'high'
        });
      }

      console.log('Backup local restaurado com sucesso');
      return { success: true, message: 'Backup restaurado com sucesso!' };

    } catch (error) {
      console.error('Erro ao restaurar backup local:', error);

      // Notificar usuário sobre erro
      if (offlineConfig.notifications.syncError) {
        await this.createNotification({
          title: 'Erro ao Restaurar Backup',
          message: `Falha ao restaurar backup: ${error.message}`,
          type: 'error',
          priority: 'high'
        });
      }

      throw error;
    }
  }

  static async scheduleAutoBackup() {
    const cron = require('node-cron');
    
    if (!offlineConfig.backup.autoBackup) {
      console.log('Backup automático offline desativado');
      return;
    }

    const schedule = offlineConfig.schedule[offlineConfig.backup.backupFrequency];
    if (!schedule) {
      console.error('Agendamento inválido:', offlineConfig.backup.backupFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando backup automático offline...`);
        
        // Aqui você obteria o userId do contexto
        const userId = 1; // Placeholder
        
        await this.createLocalBackup(userId);
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro no backup automático:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Backup automático offline agendado para executar ${offlineConfig.backup.backupFrequency}`);
  }

  static async cleanupOldData(days = 30) {
    try {
      const indexedDBManager = new IndexedDBManager();
      
      // Limpar dados antigos do cache
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Excluir registros antigos
      const stores = ['movies', 'people', 'ratings', 'watchlist', 'favorites', 'reminders', 'notifications'];
      
      for (const storeName of stores) {
        const allItems = await indexedDBManager.getAllFromStore(storeName);
        const oldItems = allItems.filter(item => 
          new Date(item.updated_at || item.created_at) < cutoffDate
        );
        
        for (const item of oldItems) {
          await indexedDBManager.deleteFromStore(storeName, item.id);
        }
      }

      console.log(`Dados offline anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  static async getSetting(key) {
    try {
      const indexedDBManager = new IndexedDBManager();
      const setting = await indexedDBManager.getFromStore('settings', key);
      return setting ? setting.value : null;
    } catch (error) {
      console.error(`Erro ao obter configuração ${key}:`, error);
      return null;
    }
  }

  static async saveSetting(key, value) {
    try {
      const indexedDBManager = new IndexedDBManager();
      await indexedDBManager.updateInStore('settings', key, {
        key: key,
        value: value,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error(`Erro ao salvar configuração ${key}:`, error);
      throw error;
    }
  }

  static async createNotification(notificationData) {
    try {
      const indexedDBManager = new IndexedDBManager();
      const notificationId = Date.now();
      
      await indexedDBManager.addToStore('notifications', {
        id: notificationId,
        user_id: 1, // Placeholder
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        is_read: false,
        read_at: null,
        related_movie_id: notificationData.related_movie_id || null,
        related_person_id: notificationData.related_person_id || null,
        created_at: new Date().toISOString(),
        expires_at: null
      });

      // Mostrar notificação na interface
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(notificationData.title, notificationData.message, notificationData.type);
      }

      return { id: notificationId, ...notificationData };
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  static async getNotifications(userId, limit = 50) {
    try {
      const indexedDBManager = new IndexedDBManager();
      return await indexedDBManager.getAllFromStore('notifications');
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      const indexedDBManager = new IndexedDBManager();
      const notification = await indexedDBManager.getFromStore('notifications', notificationId);
      
      if (notification) {
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
        await indexedDBManager.updateInStore('notifications', notificationId, notification);
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId) {
    try {
      const indexedDBManager = new IndexedDBManager();
      await indexedDBManager.deleteFromStore('notifications', notificationId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }

  static async getUnreadNotificationsCount(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(n => !n.is_read).length;
    } catch (error) {
      console.error('Erro ao obter contagem de notificações não lidas:', error);
      return 0;
    }
  }

  static async checkInternetConnection() {
    try {
      const online = navigator.onLine;
      if (!online) return false;

      const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      return response.ok || response.type === 'opaque';
    } catch {
      return false;
    }
  }

  static async waitForOnline() {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve();
        return;
      }

      const onlineHandler = () => {
        window.removeEventListener('online', onlineHandler);
        resolve();
      };

      window.addEventListener('online', onlineHandler);
    });
  }

  static async waitForOffline() {
    return new Promise((resolve) => {
      if (!navigator.onLine) {
        resolve();
        return;
      }

      const offlineHandler = () => {
        window.removeEventListener('offline', offlineHandler);
        resolve();
      };

      window.addEventListener('offline', offlineHandler);
    });
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async getFreeSpace() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.quota - estimate.usage;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao obter espaço livre:', error);
      return 0;
    }
  }

  static async compressData(data) {
    if (!offlineConfig.general.compressData) return data;

    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(typeof data === 'string' ? data : JSON.stringify(data));
      return compressed.toString('base64');
    } catch (error) {
      console.error('Erro ao comprimir dados:', error);
      return data;
    }
  }

  static async decompressData(compressedData) {
    if (!offlineConfig.general.compressData) return compressedData;

    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return decompressed.toString('utf8');
    } catch (error) {
      console.error('Erro ao descomprimir dados:', error);
      return compressedData;
    }
  }

  static async encryptData(data) {
    if (!offlineConfig.general.encryptData) return data;

    try {
      const crypto = require('crypto');
      const key = crypto.scryptSync(offlineConfig.security.encryptionKey, offlineConfig.security.salt, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(offlineConfig.security.algorithm, key);
      
      let encrypted = cipher.update(typeof data === 'string' ? data : JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      throw error;
    }
  }

  static async decryptData(encryptedData) {
    if (!offlineConfig.general.encryptData) return encryptedData;

    try {
      const crypto = require('crypto');
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = crypto.scryptSync(offlineConfig.security.encryptionKey, offlineConfig.security.salt, 32);
      const decipher = crypto.createDecipher(offlineConfig.security.algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      throw error;
    }
  }

  static async saveToFile(fileName, data) {
    try {
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      throw error;
    }
  }

  static async loadFromFile(fileInput) {
    return new Promise((resolve, reject) => {
      const file = fileInput.files[0];
      if (!file) {
        reject(new Error('Nenhum arquivo selecionado'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Arquivo inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  static async generateBackupFileName(prefix = 'movienizer-backup') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.json`;
  }

  static async createBackup(userId) {
    try {
      return await this.createLocalBackup(userId);
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  static async restoreBackup(userId, fileInput) {
    try {
      return await this.restoreLocalBackup(userId, fileInput);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  static async clearAllStores() {
    try {
      const indexedDBManager = new IndexedDBManager();
      for (const storeName of Object.keys(offlineConfig.indexedDB.stores)) {
        await indexedDBManager.clearStore(storeName);
      }
      return true;
    } catch (error) {
      console.error('Erro ao limpar todas as stores:', error);
      throw error;
    }
  }

  static async getOfflineStats() {
    try {
      return await this.getLocalDataStats();
    } catch (error) {
      console.error('Erro ao obter estatísticas offline:', error);
      throw error;
    }
  }

  static async scheduleAutoSync() {
    return await OfflineSyncService.scheduleAutoSync();
  }

  static async syncOfflineData() {
    try {
      return await OfflineSyncService.syncDataWithServer();
    } catch (error) {
      console.error('Erro ao sincronizar dados offline:', error);
      throw error;
    }
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OfflineService;