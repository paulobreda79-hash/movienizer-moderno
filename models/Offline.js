// models/Offline.js

const db = require('../data/database/init');
const offlineConfig = require('../config/offlineConfig');

class Offline {
  // === Métodos de Inicialização ===

  static async initialize() {
    try {
      // Verificar suporte a IndexedDB
      if (!('indexedDB' in window)) {
        throw new Error('IndexedDB não suportado neste navegador');
      }

      // Criar estrutura de banco de dados
      await this.createDatabaseStructure();

      // Agendar tarefas automáticas
      await this.scheduleAutoTasks();

      console.log('Modelo Offline inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar modelo Offline:', error);
      throw error;
    }
  }

  static async createDatabaseStructure() {
    try {
      const db = await this.getDatabase();
      
      // Criar tabelas principais
      const tables = [
        'movies',
        'people',
        'ratings',
        'watchlist',
        'favorites',
        'reminders',
        'notifications',
        'settings',
        'activity_logs',
        'backups',
        'streaming',
        'recommendations'
      ];

      for (const table of tables) {
        await this.createTable(table);
      }

      console.log('Estrutura de banco de dados Offline criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar estrutura de banco de dados Offline:', error);
      throw error;
    }
  }

  static async getDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(offlineConfig.indexedDB.dbName, offlineConfig.indexedDB.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Criar ou atualizar stores
        Object.values(offlineConfig.indexedDB.stores).forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
            
            if (storeConfig.indexes) {
              storeConfig.indexes.forEach(index => {
                store.createIndex(index, index, { unique: false });
              });
            }
          }
        });
      };
    });
  }

  static async createTable(tableName) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      
      // Apenas cria se não existir
      if (!db.objectStoreNames.contains(tableName)) {
        const store = db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
        
        // Adicionar índices padrão
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('updated_at', 'updated_at', { unique: false });
        store.createIndex('user_id', 'user_id', { unique: false });
      }

      console.log(`Tabela ${tableName} criada ou verificada com sucesso.`);
    } catch (error) {
      console.error(`Erro ao criar tabela ${tableName}:`, error);
      throw error;
    }
  }

  // === Métodos de Dados Locais ===

  static async addData(tableName, data) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      
      // Gerar ID único se necessário
      if (!data.id) {
        data.id = Date.now();
      }
      
      data.created_at = new Date().toISOString();
      data.updated_at = new Date().toISOString();
      
      const request = store.add(data);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao adicionar dados na tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async getData(tableName, id) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      
      const request = store.get(id);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter dados da tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async getAllData(tableName) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter todos os dados da tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async updateData(tableName, id, data) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      
      const existing = await this.getData(tableName, id);
      if (!existing) {
        throw new Error(`Registro ${id} não encontrado na tabela ${tableName}`);
      }
      
      const updatedData = { ...existing, ...data };
      updatedData.updated_at = new Date().toISOString();
      
      const request = store.put(updatedData);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao atualizar dados na tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async deleteData(tableName, id) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      
      const request = store.delete(id);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao excluir dados da tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async clearTable(tableName) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      
      const request = store.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao limpar tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async searchInTable(tableName, indexName, query, limit = 50) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      const index = store.index(indexName);
      
      const request = index.getAll(query, limit);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao buscar na tabela ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableCount(tableName) {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      
      const request = store.count();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter contagem da tabela ${tableName}:`, error);
      throw error;
    }
  }

  // === Métodos de Sincronização ===

  static async syncWithServer() {
    try {
      const isOnline = await this.checkInternetConnection();
      if (!isOnline) {
        throw new Error('Sem conexão com a internet');
      }

      // Obter dados locais
      const localMovies = await this.getAllData('movies');
      const localPeople = await this.getAllData('people');
      const localRatings = await this.getAllData('ratings');
      const localWatchlist = await this.getAllData('watchlist');
      const localFavorites = await this.getAllData('favorites');
      const localReminders = await this.getAllData('reminders');
      const localNotifications = await this.getAllData('notifications');
      const localSettings = await this.getAllData('settings');
      const localActivityLogs = await this.getAllData('activity_logs');
      const localBackups = await this.getAllData('backups');
      const localStreaming = await this.getAllData('streaming');
      const localRecommendations = await this.getAllData('recommendations');

      // Enviar dados para o servidor
      const syncResults = {
        movies: await this.syncMoviesWithServer(localMovies),
        people: await this.syncPeopleWithServer(localPeople),
        ratings: await this.syncRatingsWithServer(localRatings),
        watchlist: await this.syncWatchlistWithServer(localWatchlist),
        favorites: await this.syncFavoritesWithServer(localFavorites),
        reminders: await this.syncRemindersWithServer(localReminders),
        notifications: await this.syncNotificationsWithServer(localNotifications),
        settings: await this.syncSettingsWithServer(localSettings),
        activityLogs: await this.syncActivityLogsWithServer(localActivityLogs),
        backups: await this.syncBackupsWithServer(localBackups),
        streaming: await this.syncStreamingWithServer(localStreaming),
        recommendations: await this.syncRecommendationsWithServer(localRecommendations)
      };

      // Atualizar timestamp de última sincronização
      await this.updateSetting('lastSync', new Date().toISOString());

      // Notificar usuário sobre conclusão
      if (offlineConfig.notifications.syncComplete) {
        await this.createNotification({
          title: 'Sincronização Concluída',
          message: 'Dados sincronizados com sucesso!',
          type: 'success',
          priority: 'low'
        });
      }

      console.log('Sincronização com servidor concluída');
      return syncResults;

    } catch (error) {
      console.error('Erro ao sincronizar dados com servidor:', error);

      // Notificar usuário sobre erro
      if (offlineConfig.notifications.syncError) {
        await this.createNotification({
          title: 'Erro na Sincronização',
          message: `Falha na sincronização: ${error.message}`,
          type: 'error',
          priority: 'high'
        });
      }

      throw error;
    }
  }

  static async syncMoviesWithServer(localMovies) {
    try {
      const response = await fetch('/api/offline/sync/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: localMovies })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar filmes com servidor:', error);
      throw error;
    }
  }

  static async syncPeopleWithServer(localPeople) {
    try {
      const response = await fetch('/api/offline/sync/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: localPeople })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar pessoas com servidor:', error);
      throw error;
    }
  }

  static async syncRatingsWithServer(localRatings) {
    try {
      const response = await fetch('/api/offline/sync/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: localRatings })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar ratings com servidor:', error);
      throw error;
    }
  }

  static async syncWatchlistWithServer(localWatchlist) {
    try {
      const response = await fetch('/api/offline/sync/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: localWatchlist })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar watchlist com servidor:', error);
      throw error;
    }
  }

  static async syncFavoritesWithServer(localFavorites) {
    try {
      const response = await fetch('/api/offline/sync/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: localFavorites })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar favoritos com servidor:', error);
      throw error;
    }
  }

  static async syncRemindersWithServer(localReminders) {
    try {
      const response = await fetch('/api/offline/sync/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminders: localReminders })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar lembretes com servidor:', error);
      throw error;
    }
  }

  static async syncNotificationsWithServer(localNotifications) {
    try {
      const response = await fetch('/api/offline/sync/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: localNotifications })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar notificações com servidor:', error);
      throw error;
    }
  }

  static async syncSettingsWithServer(localSettings) {
    try {
      const response = await fetch('/api/offline/sync/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: localSettings })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar configurações com servidor:', error);
      throw error;
    }
  }

  static async syncActivityLogsWithServer(localActivityLogs) {
    try {
      const response = await fetch('/api/offline/sync/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityLogs: localActivityLogs })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar logs de atividade com servidor:', error);
      throw error;
    }
  }

  static async syncBackupsWithServer(localBackups) {
    try {
      const response = await fetch('/api/offline/sync/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backups: localBackups })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar backups com servidor:', error);
      throw error;
    }
  }

  static async syncStreamingWithServer(localStreaming) {
    try {
      const response = await fetch('/api/offline/sync/streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streaming: localStreaming })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar streaming com servidor:', error);
      throw error;
    }
  }

  static async syncRecommendationsWithServer(localRecommendations) {
    try {
      const response = await fetch('/api/offline/sync/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendations: localRecommendations })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erro ao sincronizar recomendações com servidor:', error);
      throw error;
    }
  }

  // === Métodos de Backup e Restauração ===

  static async createBackup(userId) {
    try {
      // Obter todos os dados do usuário
      const movies = await this.getAllData('movies');
      const people = await this.getAllData('people');
      const ratings = await this.getAllData('ratings');
      const watchlist = await this.getAllData('watchlist');
      const favorites = await this.getAllData('favorites');
      const reminders = await this.getAllData('reminders');
      const notifications = await this.getAllData('notifications');
      const settings = await this.getAllData('settings');
      const activityLogs = await this.getAllData('activity_logs');
      const backups = await this.getAllData('backups');
      const streaming = await this.getAllData('streaming');
      const recommendations = await this.getAllData('recommendations');

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
      
      await this.addData('backups', {
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

  static async restoreBackup(userId, backupId) {
    try {
      // Obter backup do IndexedDB
      const backup = await this.getData('backups', backupId);
      
      if (!backup || backup.user_id !== userId) {
        throw new Error('Backup não encontrado ou acesso negado');
      }

      // Ler dados do arquivo
      const fs = require('fs').promises;
      const backupData = JSON.parse(await fs.readFile(`./backups/${backup.filename}`, 'utf8'));

      // Restaurar dados
      await this.clearAllTables();
      
      if (backupData.movies) {
        for (const movie of backupData.movies) {
          await this.addData('movies', movie);
        }
      }

      if (backupData.people) {
        for (const person of backupData.people) {
          await this.addData('people', person);
        }
      }

      if (backupData.ratings) {
        for (const rating of backupData.ratings) {
          await this.addData('ratings', rating);
        }
      }

      if (backupData.watchlist) {
        for (const item of backupData.watchlist) {
          await this.addData('watchlist', item);
        }
      }

      if (backupData.favorites) {
        for (const item of backupData.favorites) {
          await this.addData('favorites', item);
        }
      }

      if (backupData.reminders) {
        for (const reminder of backupData.reminders) {
          await this.addData('reminders', reminder);
        }
      }

      if (backupData.notifications) {
        for (const notification of backupData.notifications) {
          await this.addData('notifications', notification);
        }
      }

      if (backupData.settings) {
        for (const setting of backupData.settings) {
          await this.addData('settings', setting);
        }
      }

      if (backupData.activityLogs) {
        for (const log of backupData.activityLogs) {
          await this.addData('activity_logs', log);
        }
      }

      if (backupData.backups) {
        for (const backupItem of backupData.backups) {
          await this.addData('backups', backupItem);
        }
      }

      if (backupData.streaming) {
        for (const item of backupData.streaming) {
          await this.addData('streaming', item);
        }
      }

      if (backupData.recommendations) {
        for (const recommendation of backupData.recommendations) {
          await this.addData('recommendations', recommendation);
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

  // === Métodos de Configuração e Preferências ===

  static async getSetting(key) {
    try {
      const settings = await this.getAllData('settings');
      const setting = settings.find(s => s.key === key);
      return setting ? setting.value : null;
    } catch (error) {
      console.error(`Erro ao obter configuração ${key}:`, error);
      return null;
    }
  }

  static async saveSetting(key, value) {
    try {
      const settings = await this.getAllData('settings');
      const existing = settings.find(s => s.key === key);
      
      if (existing) {
        await this.updateData('settings', existing.id, {
          key: key,
          value: value,
          updated_at: new Date().toISOString()
        });
      } else {
        await this.addData('settings', {
          key: key,
          value: value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      console.error(`Erro ao salvar configuração ${key}:`, error);
      throw error;
    }
  }

  static async updateSetting(key, value) {
    return await this.saveSetting(key, value);
  }

  // === Métodos de Notificações ===

  static async createNotification(notificationData) {
    try {
      const notificationId = Date.now();
      
      await this.addData('notifications', {
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
      const notifications = await this.getAllData('notifications');
      return notifications;
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      const notification = await this.getData('notifications', notificationId);
      
      if (notification) {
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
        await this.updateData('notifications', notificationId, notification);
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId) {
    try {
      await this.deleteData('notifications', notificationId);
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

  // === Métodos de Utilitários ===

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

  static async createLocalBackup(userId) {
    return await this.createBackup(userId);
  }

  static async restoreLocalBackup(userId, fileInput) {
    return await this.restoreBackup(userId, fileInput);
  }

  static async clearAllTables() {
    try {
      const tables = [
        'movies',
        'people',
        'ratings',
        'watchlist',
        'favorites',
        'reminders',
        'notifications',
        'settings',
        'activity_logs',
        'backups',
        'streaming',
        'recommendations'
      ];

      for (const table of tables) {
        await this.clearTable(table);
      }

      console.log('Todos os dados locais limpos');
      return true;
    } catch (error) {
      console.error('Erro ao limpar todas as tabelas:', error);
      throw error;
    }
  }

  static async getOfflineStats() {
    try {
      const stats = {};

      const tables = [
        'movies',
        'people',
        'ratings',
        'watchlist',
        'favorites',
        'reminders',
        'notifications',
        'settings',
        'activity_logs',
        'backups',
        'streaming',
        'recommendations'
      ];

      for (const table of tables) {
        stats[table] = await this.getTableCount(table);
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
      console.error('Erro ao obter estatísticas offline:', error);
      throw error;
    }
  }

  static async scheduleAutoSync() {
    const cron = require('node-cron');
    
    if (!offlineConfig.sync.enabled) {
      console.log('Sincronização automática offline desativada');
      return;
    }

    const schedule = offlineConfig.schedule[offlineConfig.sync.frequency];
    if (!schedule) {
      console.error('Agendamento inválido:', offlineConfig.sync.frequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando sincronização automática offline...`);
        await this.syncWithServer();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na sincronização automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Sincronização automática offline agendada para executar ${offlineConfig.sync.frequency}`);
  }

  static async cleanupOldData(days = 30) {
    try {
      // Limpar dados antigos do cache
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Excluir registros antigos
      const tables = [
        'movies',
        'people',
        'ratings',
        'watchlist',
        'favorites',
        'reminders',
        'notifications',
        'activity_logs'
      ];
      
      for (const table of tables) {
        const allItems = await this.getAllData(table);
        const oldItems = allItems.filter(item => 
          new Date(item.updated_at || item.created_at) < cutoffDate
        );
        
        for (const item of oldItems) {
          await this.deleteData(table, item.id);
        }
      }

      console.log(`Dados offline anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
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

  static async scheduleAutoCleanup() {
    const cron = require('node-cron');
    
    if (!offlineConfig.cleanup.enabled) {
      console.log('Limpeza automática offline desativada');
      return;
    }

    const schedule = offlineConfig.schedule[offlineConfig.cleanup.frequency];
    if (!schedule) {
      console.error('Agendamento inválido:', offlineConfig.cleanup.frequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando limpeza automática offline...`);
        await this.cleanupOldData(offlineConfig.cleanup.days);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na limpeza automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Limpeza automática offline agendada para executar ${offlineConfig.cleanup.frequency}`);
  }

  static async scheduleAutoTasks() {
    await this.scheduleAutoSync();
    await this.scheduleAutoBackup();
    await this.scheduleAutoCleanup();
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Offline;