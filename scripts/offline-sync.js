// offline-sync.js

/**
 * Sistema de Sincronização Offline para MovieNizer Desktop
 * Gerencia a sincronização automática entre dados locais (IndexedDB) e servidor
 * Executa tarefas em segundo plano e notifica o usuário sobre status
 */

class OfflineSync {
  constructor() {
    this.config = {
      // Configurações gerais
      enabled: true,
      autoSync: true,
      syncOnConnect: true,
      maxBatchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000, // 5 segundos
      conflictResolution: 'latest', // latest, manual, merge
      syncFrequency: 'hourly', // hourly, daily, weekly
      
      // Configurações de notificação
      notifications: {
        enabled: true,
        syncComplete: true,
        syncError: true,
        dataSaved: true,
        dataRestored: true,
        offlineMode: true,
        onlineMode: true
      },
      
      // Configurações de cache
      cache: {
        enabled: true,
        ttl: 7200, // 2 horas em segundos
        maxSize: 50, // MB
        cleanupInterval: 3600000 // 1 hora
      },
      
      // Configurações de segurança
      security: {
        encryptData: false,
        encryptionKey: 'movienizer-offline-key-32-chars!!',
        salt: 'movienizer-offline-salt-16-chars!',
        algorithm: 'aes-256-cbc'
      }
    };

    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.lastSync = null;
    this.syncQueue = [];
    this.init();
  }

  async init() {
    try {
      console.log('Inicializando sistema de sincronização offline...');
      
      // Verificar suporte a IndexedDB
      if (!('indexedDB' in window)) {
        throw new Error('IndexedDB não suportado neste navegador');
      }

      // Agendar tarefas automáticas
      await this.scheduleAutoTasks();

      // Monitorar eventos de conexão
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Verificar estado inicial da conexão
      this.isOnline = navigator.onLine;
      if (this.isOnline && this.config.autoSync) {
        await this.syncNow();
      }

      console.log('Sistema de sincronização offline inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar sistema de sincronização offline:', error);
      this.showNotification('Erro de Sincronização', `Falha na inicialização: ${error.message}`, 'error');
    }
  }

  // === Métodos de Sincronização ===

  async syncNow() {
    if (this.syncInProgress) {
      console.log('Sincronização já em andamento');
      return;
    }

    if (!this.isOnline) {
      console.log('Sem conexão com a internet. Sincronização adiada.');
      return;
    }

    this.syncInProgress = true;
    this.showProgressModal('Sincronizando Dados', 'Iniciando sincronização...');

    try {
      this.updateProgress(10, 'Preparando sincronização...');
      await this.sleep(1000);

      // Obter dados locais
      const localData = await this.getLocalData();
      this.updateProgress(20, 'Dados locais obtidos...');
      await this.sleep(1000);

      // Sincronizar com servidor
      const syncResults = await this.syncWithServer(localData);
      this.updateProgress(80, 'Sincronização concluída...');
      await this.sleep(1000);

      // Atualizar timestamp de última sincronização
      this.lastSync = new Date().toISOString();
      await this.saveLastSync(this.lastSync);

      this.updateProgress(95, 'Atualizando status...');
      await this.sleep(500);

      // Notificar usuário
      this.showNotification(
        'Sincronização Concluída',
        `Dados sincronizados com sucesso!\nFilmes: ${syncResults.movies.synced}\nPessoas: ${syncResults.people.synced}\nRatings: ${syncResults.ratings.synced}`,
        'success'
      );

      this.updateProgress(100, 'Concluído!');
      setTimeout(() => {
        this.hideProgressModal();
      }, 1000);

    } catch (error) {
      console.error('Erro na sincronização:', error);
      this.showNotification(
        'Erro na Sincronização',
        `Falha na sincronização: ${error.message}`,
        'error'
      );
      this.updateProgress(0, 'Erro na sincronização');
      setTimeout(() => {
        this.hideProgressModal();
      }, 3000);
    } finally {
      this.syncInProgress = false;
    }
  }

  async getLocalData() {
    try {
      const db = await this.openDatabase();
      
      const tables = [
        { name: 'movies', key: 'movie_id' },
        { name: 'people', key: 'person_id' },
        { name: 'ratings', key: 'rating_id' },
        { name: 'watchlist', key: 'watchlist_id' },
        { name: 'favorites', key: 'favorite_id' },
        { name: 'reminders', key: 'reminder_id' },
        { name: 'notifications', key: 'notification_id' },
        { name: 'settings', key: 'setting_id' },
        { name: 'activity_logs', key: 'log_id' },
        { name: 'backups', key: 'backup_id' },
        { name: 'streaming', key: 'streaming_id' },
        { name: 'recommendations', key: 'recommendation_id' }
      ];

      const localData = {};

      for (const table of tables) {
        localData[table.name] = await this.getAllFromStore(db, table.name);
      }

      return localData;

    } catch (error) {
      console.error('Erro ao obter dados locais:', error);
      throw error;
    }
  }

  async syncWithServer(localData) {
    try {
      const results = {
        movies: { synced: 0, errors: 0 },
        people: { synced: 0, errors: 0 },
        ratings: { synced: 0, errors: 0 },
        watchlist: { synced: 0, errors: 0 },
        favorites: { synced: 0, errors: 0 },
        reminders: { synced: 0, errors: 0 },
        notifications: { synced: 0, errors: 0 },
        settings: { synced: 0, errors: 0 },
        activity_logs: { synced: 0, errors: 0 },
        backups: { synced: 0, errors: 0 },
        streaming: { synced: 0, errors: 0 },
        recommendations: { synced: 0, errors: 0 }
      };

      // Sincronizar cada tabela
      for (const [tableName, data] of Object.entries(localData)) {
        if (data.length > 0) {
          const result = await this.syncTable(tableName, data);
          results[tableName].synced = result.synced;
          results[tableName].errors = result.errors;
        }
      }

      return results;

    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error);
      throw error;
    }
  }

  async syncTable(tableName, data) {
    try {
      const response = await fetch(`/api/offline/sync/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [tableName]: data })
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error(`Erro ao sincronizar tabela ${tableName}:`, error);
      return { synced: 0, errors: data.length };
    }
  }

  // === Métodos de Banco de Dados Local ===

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MovieNizerOffline', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Criar ou atualizar stores
        const stores = [
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

        for (const storeName of stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            
            // Adicionar índices padrão
            store.createIndex('created_at', 'created_at', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
            store.createIndex('user_id', 'user_id', { unique: false });
          }
        }
      };
    });
  }

  async getAllFromStore(db, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveLastSync(timestamp) {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({
        id: 'lastSync',
        value: timestamp,
        updated_at: new Date().toISOString()
      });

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao salvar último sync:', error);
      throw error;
    }
  }

  async getLastSync() {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const request = store.get('lastSync');
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result?.value || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao obter último sync:', error);
      return null;
    }
  }

  // === Métodos de Interface ===

  showProgressModal(title, message) {
    const modal = document.createElement('div');
    modal.id = 'offline-sync-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${title}</h3>
        <div class="progress-bar">
          <div class="progress-fill" id="sync-progress-fill"></div>
        </div>
        <p id="sync-progress-message">${message}</p>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  }

  updateProgress(percent, message) {
    const progressFill = document.getElementById('sync-progress-fill');
    const progressMessage = document.getElementById('sync-progress-message');
    
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    
    if (progressMessage) {
      progressMessage.textContent = message;
    }
  }

  hideProgressModal() {
    const modal = document.getElementById('offline-sync-modal');
    if (modal) {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
    }
  }

  showNotification(title, message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <h4>${title}</h4>
      <p>${message}</p>
    `;

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Remover após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // === Métodos de Eventos ===

  handleOnline() {
    this.isOnline = true;
    console.log('Conexão restaurada');
    
    if (this.config.notifications.onlineMode) {
      this.showNotification('Modo Online', 'Você está trabalhando online novamente.', 'success');
    }
    
    // Sincronizar dados automaticamente se configurado
    if (this.config.syncOnConnect) {
      this.syncNow();
    }
  }

  handleOffline() {
    this.isOnline = false;
    console.log('Conexão perdida');
    
    if (this.config.notifications.offlineMode) {
      this.showNotification('Modo Offline', 'Você está trabalhando offline. Os dados serão sincronizados quando a conexão for restabelecida.', 'info');
    }
  }

  // === Métodos de Agendamento ===

  async scheduleAutoTasks() {
    try {
      // Agendar sincronização automática
      if (this.config.autoSync) {
        await this.scheduleAutoSync();
      }

      // Agendar limpeza automática
      await this.scheduleAutoCleanup();

      // Agendar backup automático
      await this.scheduleAutoBackup();

      console.log('Tarefas automáticas agendadas com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar tarefas automáticas:', error);
    }
  }

  async scheduleAutoSync() {
    const cron = require('node-cron');
    
    if (!this.config.autoSync) {
      console.log('Sincronização automática desativada');
      return;
    }

    const schedule = this.getSchedule(this.config.syncFrequency);
    if (!schedule) {
      console.error('Agendamento inválido:', this.config.syncFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando sincronização automática...`);
        await this.syncNow();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na sincronização automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Sincronização automática agendada para executar ${this.config.syncFrequency}`);
  }

  async scheduleAutoCleanup() {
    const cron = require('node-cron');
    
    if (!this.config.cleanup.enabled) {
      console.log('Limpeza automática desativada');
      return;
    }

    const schedule = this.getSchedule(this.config.cleanup.frequency);
    if (!schedule) {
      console.error('Agendamento inválido:', this.config.cleanup.frequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando limpeza automática...`);
        await this.cleanupOldData(this.config.cleanup.days);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na limpeza automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Limpeza automática agendada para executar ${this.config.cleanup.frequency}`);
  }

  async scheduleAutoBackup() {
    const cron = require('node-cron');
    
    if (!this.config.backup.autoBackup) {
      console.log('Backup automático desativado');
      return;
    }

    const schedule = this.getSchedule(this.config.backup.backupFrequency);
    if (!schedule) {
      console.error('Agendamento inválido:', this.config.backup.backupFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando backup automático...`);
        
        // Aqui você obteria o userId do contexto
        const userId = 1; // Placeholder
        
        await this.createBackup(userId);
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro no backup automático:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Backup automático agendado para executar ${this.config.backup.backupFrequency}`);
  }

  getSchedule(frequency) {
    switch (frequency) {
      case 'hourly':
        return '0 * * * *'; // A cada hora
      case 'daily':
        return '0 0 * * *'; // Diariamente à meia-noite
      case 'weekly':
        return '0 0 * * 0'; // Semanalmente aos domingos à meia-noite
      default:
        return '0 0 * * *'; // Padrão: diariamente
    }
  }

  async createBackup(userId) {
    try {
      // Obter todos os dados do usuário
      const localData = await this.getLocalData();
      
      // Criar backup
      const backupData = {
        ...localData,
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar backup no IndexedDB
      const db = await this.openDatabase();
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      
      const backupId = Date.now();
      const backupFileName = `movienizer-backup-user-${userId}-${backupId}.json`;
      
      const request = store.add({
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

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // Salvar dados em arquivo
          const fs = require('fs').promises;
          fs.writeFile(`./backups/${backupFileName}`, JSON.stringify(backupData, null, 2))
            .then(() => {
              // Notificar usuário
              if (this.config.notifications.dataSaved) {
                this.showNotification(
                  'Backup Criado',
                  `Backup "${backupFileName}" criado com sucesso!`,
                  'success'
                );
              }
              resolve({ success: true, fileName: backupFileName });
            })
            .catch(error => {
              console.error('Erro ao salvar backup em arquivo:', error);
              reject(error);
            });
        };
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  async cleanupOldData(days = 30) {
    try {
      const db = await this.openDatabase();
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
      
      for (const tableName of tables) {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        
        const allItems = await this.getAllFromStore(db, tableName);
        const oldItems = allItems.filter(item => 
          new Date(item.updated_at || item.created_at) < cutoffDate
        );
        
        for (const item of oldItems) {
          const deleteRequest = store.delete(item.id);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        }
      }

      console.log(`Dados offline anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  // === Métodos Utilitários ===

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para testes
  async testSync() {
    try {
      console.log('Iniciando teste de sincronização...');
      await this.syncNow();
      console.log('Teste de sincronização concluído!');
    } catch (error) {
      console.error('Erro no teste de sincronização:', error);
    }
  }
}

// Inicializar o sistema de sincronização
document.addEventListener('DOMContentLoaded', () => {
  window.offlineSync = new OfflineSync();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineSync;
}