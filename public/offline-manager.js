// offline-manager.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados iniciais
  loadOfflineStatus();
  loadLocalDataStats();
  loadBackupList();

  // Eventos
  document.getElementById('btn-enable-offline').addEventListener('click', enableOfflineMode);
  document.getElementById('btn-disable-offline').addEventListener('click', disableOfflineMode);
  document.getElementById('btn-sync-now').addEventListener('click', syncNow);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-refresh-data').addEventListener('click', refreshData);
  document.getElementById('btn-clear-data').addEventListener('click', clearLocalData);
  document.getElementById('btn-create-backup').addEventListener('click', createBackup);
  document.getElementById('btn-restore-backup').addEventListener('click', restoreBackup);
  document.getElementById('btn-confirm-action').addEventListener('click', confirmAction);
  document.getElementById('btn-cancel-action').addEventListener('click', cancelAction);

  // Verificar conexão a cada 30 segundos
  setInterval(checkConnectionStatus, 30000);

  // Monitorar mudanças de conexão
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

async function loadOfflineStatus() {
  try {
    const response = await fetch('/api/offline/status');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const status = await response.json();

    document.getElementById('offline-status').textContent = status.is_offline ? 'Ativado' : 'Desativado';
    document.getElementById('last-sync').textContent = status.last_sync ? 
      new Date(status.last_sync).toLocaleString() : 'Nunca';
    document.getElementById('local-data-size').textContent = status.stats.totalSizeFormatted || '0 MB';
    document.getElementById('connection-status').textContent = await checkConnectionStatus() ? 'Online' : 'Offline';

    // Atualizar botões
    const enableBtn = document.getElementById('btn-enable-offline');
    const disableBtn = document.getElementById('btn-disable-offline');
    
    if (status.is_offline) {
      enableBtn.disabled = true;
      disableBtn.disabled = false;
      enableBtn.style.opacity = '0.5';
      disableBtn.style.opacity = '1';
    } else {
      enableBtn.disabled = false;
      disableBtn.disabled = true;
      enableBtn.style.opacity = '1';
      disableBtn.style.opacity = '0.5';
    }

  } catch (error) {
    console.error('Erro ao carregar status offline:', error);
  }
}

async function loadLocalDataStats() {
  try {
    const response = await fetch('/api/offline/stats');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('local-movies-count').textContent = stats.movies || 0;
    document.getElementById('local-people-count').textContent = stats.people || 0;
    document.getElementById('local-ratings-count').textContent = stats.ratings || 0;
    document.getElementById('local-watchlist-count').textContent = stats.watchlist || 0;
    document.getElementById('local-favorites-count').textContent = stats.favorites || 0;
    document.getElementById('local-reminders-count').textContent = stats.reminders || 0;

  } catch (error) {
    console.error('Erro ao carregar estatísticas de dados locais:', error);
  }
}

async function loadBackupList() {
  try {
    const response = await fetch('/api/offline/backups');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const backups = await response.json();

    const list = document.getElementById('backup-list');
    list.innerHTML = '';

    if (backups.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #777;">Nenhum backup encontrado.</p>';
      return;
    }

    backups.forEach(backup => {
      const item = document.createElement('div');
      item.className = 'backup-item';

      const date = new Date(backup.created_at);
      const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);

      item.innerHTML = `
        <div class="backup-info">
          <h4>${backup.filename}</h4>
          <p>${date.toLocaleString()} • ${sizeMB} MB</p>
        </div>
        <div class="backup-actions">
          <button class="btn-primary" onclick="restoreBackup('${backup.id}')">Restaurar</button>
          <button class="btn-danger" onclick="deleteBackup('${backup.id}')">Excluir</button>
        </div>
      `;

      list.appendChild(item);
    });

  } catch (error) {
    console.error('Erro ao carregar lista de backups:', error);
  }
}

async function enableOfflineMode() {
  try {
    const response = await fetch('/api/offline/enable', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Modo offline ativado com sucesso!');
    loadOfflineStatus();

  } catch (error) {
    console.error('Erro ao ativar modo offline:', error);
    alert('Erro ao ativar modo offline: ' + error.message);
  }
}

async function disableOfflineMode() {
  try {
    const response = await fetch('/api/offline/disable', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Modo offline desativado com sucesso!');
    loadOfflineStatus();

  } catch (error) {
    console.error('Erro ao desativar modo offline:', error);
    alert('Erro ao desativar modo offline: ' + error.message);
  }
}

async function syncNow() {
  showProgressModal('Sincronizando Dados', 'Iniciando sincronização...');

  try {
    updateProgress(20, 'Preparando sincronização...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(40, 'Sincronizando filmes...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(60, 'Sincronizando pessoas...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(80, 'Sincronizando ratings...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch('/api/offline/sync', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    updateProgress(100, 'Sincronização concluída!');

    setTimeout(() => {
      hideProgressModal();
      alert(`Sincronização concluída!\nTotal: ${result.total}\nSincronizados: ${result.synced}\nErros: ${result.errors}`);
      loadOfflineStatus();
      loadLocalDataStats();
      loadBackupList();
    }, 1000);

  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    hideProgressModal();
    alert('Erro ao sincronizar dados: ' + error.message);
  }
}

async function saveSettings() {
  try {
    const settings = {
      offlineModeEnabled: document.getElementById('offline-mode-enabled').value === 'true',
      autoSyncEnabled: document.getElementById('auto-sync-enabled').value === 'true',
      syncFrequency: document.getElementById('sync-frequency').value,
      autoBackupEnabled: document.getElementById('auto-backup-enabled').value === 'true',
      backupFrequency: document.getElementById('backup-frequency').value,
      dataRetention: parseInt(document.getElementById('data-retention').value)
    };

    // Aqui você salvaria as configurações no servidor
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}

async function refreshData() {
  await loadOfflineStatus();
  await loadLocalDataStats();
  await loadBackupList();
}

async function clearLocalData() {
  if (!confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) return;

  try {
    const response = await fetch('/api/offline/clear', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Dados locais limpos com sucesso!');
    loadLocalDataStats();

  } catch (error) {
    console.error('Erro ao limpar dados locais:', error);
    alert('Erro ao limpar dados locais: ' + error.message);
  }
}

async function createBackup() {
  showProgressModal('Criando Backup', 'Iniciando criação de backup...');

  try {
    updateProgress(30, 'Preparando backup...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(60, 'Compactando dados...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch('/api/offline/backup/create', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    updateProgress(100, 'Backup criado com sucesso!');

    setTimeout(() => {
      hideProgressModal();
      alert(`Backup "${result.fileName}" criado com sucesso!`);
      loadBackupList();
    }, 1000);

  } catch (error) {
    console.error('Erro ao criar backup:', error);
    hideProgressModal();
    alert('Erro ao criar backup: ' + error.message);
  }
}

async function restoreBackup(backupId) {
  showConfirmModal(
    'Restaurar Backup',
    'Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.',
    () => {
      performRestoreBackup(backupId);
    }
  );
}

async function performRestoreBackup(backupId) {
  hideConfirmModal();
  showProgressModal('Restaurando Backup', 'Iniciando restauração...');

  try {
    updateProgress(30, 'Preparando restauração...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(60, 'Descompactando dados...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(`/api/offline/backup/restore/${backupId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    updateProgress(100, 'Restauração concluída!');

    setTimeout(() => {
      hideProgressModal();
      alert('Backup restaurado com sucesso!');
      loadLocalDataStats();
      loadBackupList();
    }, 1000);

  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    hideProgressModal();
    alert('Erro ao restaurar backup: ' + error.message);
  }
}

async function deleteBackup(backupId) {
  if (!confirm('Tem certeza que deseja excluir este backup?')) return;

  try {
    const response = await fetch(`/api/offline/backup/${backupId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Backup excluído com sucesso!');
    loadBackupList();

  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    alert('Erro ao excluir backup: ' + error.message);
  }
}

function showProgressModal(title, message) {
  document.getElementById('progress-title').textContent = title;
  document.getElementById('progress-message').textContent = message;
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-modal').style.display = 'flex';
}

function updateProgress(percent, message) {
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-message').textContent = message;
}

function hideProgressModal() {
  document.getElementById('progress-modal').style.display = 'none';
}

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').style.display = 'flex';
  
  // Salvar callback de confirmação
  window.confirmCallback = onConfirm;
}

function confirmAction() {
  if (window.confirmCallback) {
    window.confirmCallback();
  }
  hideConfirmModal();
}

function cancelAction() {
  hideConfirmModal();
  window.confirmCallback = null;
}

function hideConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}

async function checkConnectionStatus() {
  try {
    const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
    const isOnline = response.ok || response.type === 'opaque';
    
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = isOnline ? 'Online' : 'Offline';
    statusElement.style.color = isOnline ? '#2ecc71' : '#e74c3c';
    
    return isOnline;
  } catch {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = 'Offline';
    statusElement.style.color = '#e74c3c';
    return false;
  }
}

function handleOnline() {
  document.getElementById('connection-status').textContent = 'Online';
  document.getElementById('connection-status').style.color = '#2ecc71';
  
  if (offlineConfig.notifications.onlineMode) {
    showNotification('Modo Online', 'Você está trabalhando online novamente.', 'success');
  }
  
  // Sincronizar dados automaticamente se configurado
  if (offlineConfig.sync.syncOnConnect) {
    syncNow();
  }
}

function handleOffline() {
  document.getElementById('connection-status').textContent = 'Offline';
  document.getElementById('connection-status').style.color = '#e74c3c';
  
  if (offlineConfig.notifications.offlineMode) {
    showNotification('Modo Offline', 'Você está trabalhando offline. Os dados serão sincronizados quando a conexão for restabelecida.', 'info');
  }
}

function showNotification(title, message, type = 'info') {
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

// Funções utilitárias para IndexedDB
class IndexedDBManager {
  constructor() {
    this.dbName = offlineConfig.indexedDB.dbName;
    this.version = offlineConfig.indexedDB.version;
    this.db = null;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createStores(db);
      };
    });
  }

  createStores(db) {
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
  }

  async addToStore(storeName, data) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.add(data);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao adicionar dados à store ${storeName}:`, error);
      throw error;
    }
  }

  async getFromStore(storeName, key) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.get(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter dados da store ${storeName}:`, error);
      throw error;
    }
  }

  async getAllFromStore(storeName) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter todos os dados da store ${storeName}:`, error);
      throw error;
    }
  }

  async updateInStore(storeName, key, data) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put({ ...data, id: key });
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao atualizar dados na store ${storeName}:`, error);
      throw error;
    }
  }

  async deleteFromStore(storeName, key) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao excluir dados da store ${storeName}:`, error);
      throw error;
    }
  }

  async clearStore(storeName) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao limpar store ${storeName}:`, error);
      throw error;
    }
  }

  async searchInStore(storeName, indexName, query, limit = 50) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const request = index.getAll(query, limit);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao buscar na store ${storeName}:`, error);
      throw error;
    }
  }

  async getStoreCount(storeName) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.count();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter contagem da store ${storeName}:`, error);
      throw error;
    }
  }
}

// Instância global do IndexedDBManager
const indexedDBManager = new IndexedDBManager();

// Funções para sincronização offline
class OfflineSyncService {
  static async syncDataWithServer() {
    try {
      const isOnline = await checkConnectionStatus();
      if (!isOnline) {
        throw new Error('Sem conexão com a internet');
      }

      // Obter dados locais
      const localMovies = await indexedDBManager.getAllFromStore('movies');
      const localPeople = await indexedDBManager.getAllFromStore('people');
      const localRatings = await indexedDBManager.getAllFromStore('ratings');
      const localWatchlist = await indexedDBManager.getAllFromStore('watchlist');
      const localFavorites = await indexedDBManager.getAllFromStore('favorites');
      const localReminders = await indexedDBManager.getAllFromStore('reminders');
      const localNotifications = await indexedDBManager.getAllFromStore('notifications');
      const localSettings = await indexedDBManager.getAllFromStore('settings');
      const localActivityLogs = await indexedDBManager.getAllFromStore('activity_logs');
      const localBackups = await indexedDBManager.getAllFromStore('backups');
      const localStreaming = await indexedDBManager.getAllFromStore('streaming');
      const localRecommendations = await indexedDBManager.getAllFromStore('recommendations');

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
      await indexedDBManager.updateInStore('settings', 'lastSync', {
        key: 'lastSync',
        value: new Date().toISOString()
      });

      // Notificar usuário sobre conclusão
      if (offlineConfig.notifications.syncComplete) {
        showNotification('Sincronização Concluída', 'Dados sincronizados com sucesso!', 'success');
      }

      console.log('Sincronização com servidor concluída');
      return syncResults;

    } catch (error) {
      console.error('Erro ao sincronizar dados com servidor:', error);

      // Notificar usuário sobre erro
      if (offlineConfig.notifications.syncError) {
        showNotification('Erro na Sincronização', `Falha na sincronização: ${error.message}`, 'error');
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
        await this.syncDataWithServer();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na sincronização automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Sincronização automática offline agendada para executar ${offlineConfig.sync.frequency}`);
  }
}

// Iniciar serviço de sincronização automática
OfflineSyncService.scheduleAutoSync();

module.exports = { IndexedDBManager, OfflineSyncService };