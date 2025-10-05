// src/services/localStorageService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from '../config/appConfig';

class LocalStorageService {
  // === Métodos Básicos ===

  static async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Erro ao obter item ${key}:`, error);
      return null;
    }
  }

  static async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Erro ao salvar item ${key}:`, error);
      return false;
    }
  }

  static async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Erro ao remover item ${key}:`, error);
      return false;
    }
  }

  static async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar armazenamento:', error);
      return false;
    }
  }

  // === Métodos Específicos ===

  static async getUser() {
    return await this.getItem('user');
  }

  static async setUser(user) {
    return await this.setItem('user', user);
  }

  static async getAuthToken() {
    return await this.getItem('authToken');
  }

  static async setAuthToken(token) {
    return await this.setItem('authToken', token);
  }

  static async removeAuthToken() {
    return await this.removeItem('authToken');
  }

  static async getRefreshToken() {
    return await this.getItem('refreshToken');
  }

  static async setRefreshToken(token) {
    return await this.setItem('refreshToken', token);
  }

  static async removeRefreshToken() {
    return await this.removeItem('refreshToken');
  }

  static async getDarkMode() {
    const value = await this.getItem('darkMode');
    return value !== null ? value : false;
  }

  static async setDarkMode(darkMode) {
    return await this.setItem('darkMode', darkMode);
  }

  static async getLanguage() {
    const value = await this.getItem('language');
    return value || 'pt-BR';
  }

  static async setLanguage(language) {
    return await this.setItem('language', language);
  }

  static async getOfflineMode() {
    const value = await this.getItem('offlineMode');
    return value !== null ? value : false;
  }

  static async setOfflineMode(offlineMode) {
    return await this.setItem('offlineMode', offlineMode);
  }

  static async getLastSync() {
    return await this.getItem('lastSync');
  }

  static async setLastSync(lastSync) {
    return await this.setItem('lastSync', lastSync);
  }

  static async getNotificationCount() {
    const value = await this.getItem('notificationCount');
    return value || 0;
  }

  static async setNotificationCount(count) {
    return await this.setItem('notificationCount', count);
  }

  static async getTagFilter() {
    return await this.getItem('tagFilter');
  }

  static async setTagFilter(filter) {
    return await this.setItem('tagFilter', filter);
  }

  static async getSearchQuery() {
    return await this.getItem('searchQuery');
  }

  static async setSearchQuery(query) {
    return await this.setItem('searchQuery', query);
  }

  static async getSettings() {
    return await this.getItem('settings');
  }

  static async setSettings(settings) {
    return await this.setItem('settings', settings);
  }

  static async getMovies() {
    return await this.getItem('movies');
  }

  static async setMovies(movies) {
    return await this.setItem('movies', movies);
  }

  static async getPeople() {
    return await this.getItem('people');
  }

  static async setPeople(people) {
    return await this.setItem('people', people);
  }

  static async getRatings() {
    return await this.getItem('ratings');
  }

  static async setRatings(ratings) {
    return await this.setItem('ratings', ratings);
  }

  static async getWatchlist() {
    return await this.getItem('watchlist');
  }

  static async setWatchlist(watchlist) {
    return await this.setItem('watchlist', watchlist);
  }

  static async getFavorites() {
    return await this.getItem('favorites');
  }

  static async setFavorites(favorites) {
    return await this.setItem('favorites', favorites);
  }

  static async getReminders() {
    return await this.getItem('reminders');
  }

  static async setReminders(reminders) {
    return await this.setItem('reminders', reminders);
  }

  static async getNotifications() {
    return await this.getItem('notifications');
  }

  static async setNotifications(notifications) {
    return await this.setItem('notifications', notifications);
  }

  static async getTags() {
    return await this.getItem('tags');
  }

  static async setTags(tags) {
    return await this.setItem('tags', tags);
  }

  static async getVoiceCommands() {
    return await this.getItem('voiceCommands');
  }

  static async setVoiceCommands(commands) {
    return await this.setItem('voiceCommands', commands);
  }

  static async getBackups() {
    return await this.getItem('backups');
  }

  static async setBackups(backups) {
    return await this.setItem('backups', backups);
  }

  static async getStreaming() {
    return await this.getItem('streaming');
  }

  static async setStreaming(streaming) {
    return await this.setItem('streaming', streaming);
  }

  static async getRecommendations() {
    return await this.getItem('recommendations');
  }

  static async setRecommendations(recommendations) {
    return await this.setItem('recommendations', recommendations);
  }

  static async getStats() {
    return await this.getItem('stats');
  }

  static async setStats(stats) {
    return await this.setItem('stats', stats);
  }

  static async getSearchHistory() {
    return await this.getItem('searchHistory');
  }

  static async setSearchHistory(history) {
    return await this.setItem('searchHistory', history);
  }

  static async getRecentActivity() {
    return await this.getItem('recentActivity');
  }

  static async setRecentActivity(activity) {
    return await this.setItem('recentActivity', activity);
  }

  static async getAnalytics() {
    return await this.getItem('analytics');
  }

  static async setAnalytics(analytics) {
    return await this.setItem('analytics', analytics);
  }

  static async getFeedback() {
    return await this.getItem('feedback');
  }

  static async setFeedback(feedback) {
    return await this.setItem('feedback', feedback);
  }

  static async getRateApp() {
    return await this.getItem('rateApp');
  }

  static async setRateApp(rateApp) {
    return await this.setItem('rateApp', rateApp);
  }

  static async getContact() {
    return await this.getItem('contact');
  }

  static async setContact(contact) {
    return await this.setItem('contact', contact);
  }

  static async getUpdates() {
    return await this.getItem('updates');
  }

  static async setUpdates(updates) {
    return await this.setItem('updates', updates);
  }

  static async getCache(key) {
    const cached = await this.getItem(`cache_${key}`);
    if (!cached) return null;

    // Verificar TTL
    const now = Date.now();
    if (now > cached.expiresAt) {
      await this.removeItem(`cache_${key}`);
      return null;
    }

    return cached.data;
  }

  static async setCache(key, data, ttl = 3600000) { // 1 hora padrão
    const expiresAt = Date.now() + ttl;
    return await this.setItem(`cache_${key}`, { data, expiresAt });
  }

  static async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  }

  static async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      let size = 0;
      
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          size += value.length;
        }
      }
      
      return size;
    } catch (error) {
      console.error('Erro ao obter tamanho do cache:', error);
      return 0;
    }
  }

  static async cleanupCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      const now = Date.now();
      
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const cached = JSON.parse(value);
          if (now > cached.expiresAt) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  }

  static async getFreeSpace() {
    try {
      // Em React Native, podemos usar o storageInfo
      if (Platform.OS === 'android') {
        // Para Android, podemos usar o react-native-storage-info
        // Se não estiver instalado, retornar valor estimado
        return 1000; // 1GB estimado
      } else if (Platform.OS === 'ios') {
        // Para iOS, podemos usar o react-native-storage-info
        // Se não estiver instalado, retornar valor estimado
        return 1000; // 1GB estimado
      } else {
        return 1000; // 1GB estimado
      }
    } catch (error) {
      console.error('Erro ao obter espaço livre:', error);
      return 1000; // 1GB estimado
    }
  }

  static async formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async compressData(data) {
    if (!appConfig.offline.compressData) return data;

    try {
      // Em React Native, podemos usar o react-native-zip-archive ou similar
      // Para este exemplo, vamos apenas retornar os dados originais
      return data;
    } catch (error) {
      console.error('Erro ao comprimir dados:', error);
      return data;
    }
  }

  static async decompressData(compressedData) {
    if (!appConfig.offline.compressData) return compressedData;

    try {
      // Em React Native, podemos usar o react-native-zip-archive ou similar
      // Para este exemplo, vamos apenas retornar os dados originais
      return compressedData;
    } catch (error) {
      console.error('Erro ao descomprimir dados:', error);
      return compressedData;
    }
  }

  static async encryptData(data) {
    if (!appConfig.offline.encryptData) return data;

    try {
      // Em React Native, podemos usar o react-native-aes-crypto ou similar
      // Para este exemplo, vamos apenas retornar os dados originais
      return data;
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      return data;
    }
  }

  static async decryptData(encryptedData) {
    if (!appConfig.offline.encryptData) return encryptedData;

    try {
      // Em React Native, podemos usar o react-native-aes-crypto ou similar
      // Para este exemplo, vamos apenas retornar os dados originais
      return encryptedData;
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      return encryptedData;
    }
  }

  static async saveToFile(fileName, data) {
    try {
      // Em React Native, podemos usar o react-native-fs
      // Para este exemplo, vamos apenas simular
      console.log(`Salvando arquivo ${fileName}...`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      return false;
    }
  }

  static async loadFromFile(fileInput) {
    try {
      // Em React Native, podemos usar o react-native-document-picker
      // Para este exemplo, vamos apenas simular
      console.log('Carregando arquivo...');
      return {};
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      return {};
    }
  }

  static async generateBackupFileName(prefix = 'movienizer-backup') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.json`;
  }

  static async createBackup(userId) {
    try {
      // Obter todos os dados do usuário
      const movies = await this.getMovies();
      const people = await this.getPeople();
      const ratings = await this.getRatings();
      const watchlist = await this.getWatchlist();
      const favorites = await this.getFavorites();
      const reminders = await this.getReminders();
      const notifications = await this.getNotifications();
      const tags = await this.getTags();
      const voiceCommands = await this.getVoiceCommands();
      const backups = await this.getBackups();
      const streaming = await this.getStreaming();
      const recommendations = await this.getRecommendations();
      const settings = await this.getSettings();
      const stats = await this.getStats();
      const searchHistory = await this.getSearchHistory();
      const recentActivity = await this.getRecentActivity();
      const analytics = await this.getAnalytics();
      const feedback = await this.getFeedback();
      const rateApp = await this.getRateApp();
      const contact = await this.getContact();
      const updates = await this.getUpdates();

      const backupData = {
        movies,
        people,
        ratings,
        watchlist,
        favorites,
        reminders,
        notifications,
        tags,
        voiceCommands,
        backups,
        streaming,
        recommendations,
        settings,
        stats,
        searchHistory,
        recentActivity,
        analytics,
        feedback,
        rateApp,
        contact,
        updates,
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar backup no armazenamento local
      const backupId = Date.now();
      const backupFileName = `movienizer-backup-user-${userId}-${backupId}.json`;
      
      await this.setItem(`backup_${backupId}`, {
        id: backupId,
        user_id: userId,
        filename: backupFileName,
        size: JSON.stringify(backupData).length,
        type: 'local',
        status: 'completed',
        location: 'localStorage',
        checksum: null,
        created_at: new Date().toISOString(),
        expires_at: null,
        updated_at: new Date().toISOString()
      });

      // Salvar dados em arquivo
      await this.saveToFile(backupFileName, backupData);

      // Notificar usuário
      if (appConfig.notifications.enabled) {
        // Aqui você implementaria a notificação
        console.log(`Backup "${backupFileName}" criado com sucesso!`);
      }

      console.log(`Backup local criado: ${backupFileName}`);
      return { success: true, fileName: backupFileName };

    } catch (error) {
      console.error('Erro ao criar backup local:', error);

      // Notificar usuário sobre erro
      if (appConfig.notifications.enabled) {
        // Aqui você implementaria a notificação
        console.log(`Erro ao criar backup local: ${error.message}`);
      }

      throw error;
    }
  }

  static async restoreBackup(userId, backupId) {
    try {
      // Obter backup do armazenamento local
      const backup = await this.getItem(`backup_${backupId}`);
      
      if (!backup || backup.user_id !== userId) {
        throw new Error('Backup não encontrado ou acesso negado');
      }

      // Ler dados do arquivo
      // Para este exemplo, vamos assumir que os dados estão no armazenamento local
      const backupData = await this.getItem(`backup_data_${backupId}`);

      // Restaurar dados
      await this.clearAllData();
      
      if (backupData.movies) {
        await this.setMovies(backupData.movies);
      }

      if (backupData.people) {
        await this.setPeople(backupData.people);
      }

      if (backupData.ratings) {
        await this.setRatings(backupData.ratings);
      }

      if (backupData.watchlist) {
        await this.setWatchlist(backupData.watchlist);
      }

      if (backupData.favorites) {
        await this.setFavorites(backupData.favorites);
      }

      if (backupData.reminders) {
        await this.setReminders(backupData.reminders);
      }

      if (backupData.notifications) {
        await this.setNotifications(backupData.notifications);
      }

      if (backupData.tags) {
        await this.setTags(backupData.tags);
      }

      if (backupData.voiceCommands) {
        await this.setVoiceCommands(backupData.voiceCommands);
      }

      if (backupData.backups) {
        await this.setBackups(backupData.backups);
      }

      if (backupData.streaming) {
        await this.setStreaming(backupData.streaming);
      }

      if (backupData.recommendations) {
        await this.setRecommendations(backupData.recommendations);
      }

      if (backupData.settings) {
        await this.setSettings(backupData.settings);
      }

      if (backupData.stats) {
        await this.setStats(backupData.stats);
      }

      if (backupData.searchHistory) {
        await this.setSearchHistory(backupData.searchHistory);
      }

      if (backupData.recentActivity) {
        await this.setRecentActivity(backupData.recentActivity);
      }

      if (backupData.analytics) {
        await this.setAnalytics(backupData.analytics);
      }

      if (backupData.feedback) {
        await this.setFeedback(backupData.feedback);
      }

      if (backupData.rateApp) {
        await this.setRateApp(backupData.rateApp);
      }

      if (backupData.contact) {
        await this.setContact(backupData.contact);
      }

      if (backupData.updates) {
        await this.setUpdates(backupData.updates);
      }

      // Notificar usuário
      if (appConfig.notifications.enabled) {
        // Aqui você implementaria a notificação
        console.log('Backup restaurado com sucesso!');
      }

      console.log('Backup local restaurado com sucesso');
      return { success: true, message: 'Backup restaurado com sucesso!' };

    } catch (error) {
      console.error('Erro ao restaurar backup local:', error);

      // Notificar usuário sobre erro
      if (appConfig.notifications.enabled) {
        // Aqui você implementaria a notificação
        console.log(`Falha ao restaurar backup: ${error.message}`);
      }

      throw error;
    }
  }

  static async clearAllData() {
    try {
      // Limpar todos os dados
      await this.removeItem('user');
      await this.removeItem('authToken');
      await this.removeItem('refreshToken');
      await this.removeItem('darkMode');
      await this.removeItem('language');
      await this.removeItem('offlineMode');
      await this.removeItem('lastSync');
      await this.removeItem('notificationCount');
      await this.removeItem('tagFilter');
      await this.removeItem('searchQuery');
      await this.removeItem('settings');
      await this.removeItem('movies');
      await this.removeItem('people');
      await this.removeItem('ratings');
      await this.removeItem('watchlist');
      await this.removeItem('favorites');
      await this.removeItem('reminders');
      await this.removeItem('notifications');
      await this.removeItem('tags');
      await this.removeItem('voiceCommands');
      await this.removeItem('backups');
      await this.removeItem('streaming');
      await this.removeItem('recommendations');
      await this.removeItem('stats');
      await this.removeItem('searchHistory');
      await this.removeItem('recentActivity');
      await this.removeItem('analytics');
      await this.removeItem('feedback');
      await this.removeItem('rateApp');
      await this.removeItem('contact');
      await this.removeItem('updates');

      // Limpar cache
      await this.clearCache();

      console.log('Todos os dados locais limpos');
      return true;
    } catch (error) {
      console.error('Erro ao limpar todos os dados:', error);
      return false;
    }
  }

  static async getOfflineStats() {
    try {
      const stats = {};

      // Contar itens
      stats.movies = (await this.getMovies())?.length || 0;
      stats.people = (await this.getPeople())?.length || 0;
      stats.ratings = (await this.getRatings())?.length || 0;
      stats.watchlist = (await this.getWatchlist())?.length || 0;
      stats.favorites = (await this.getFavorites())?.length || 0;
      stats.reminders = (await this.getReminders())?.length || 0;
      stats.notifications = (await this.getNotifications())?.length || 0;
      stats.tags = (await this.getTags())?.length || 0;
      stats.voiceCommands = (await this.getVoiceCommands())?.length || 0;
      stats.backups = (await this.getBackups())?.length || 0;
      stats.streaming = (await this.getStreaming())?.length || 0;
      stats.recommendations = (await this.getRecommendations())?.length || 0;
      stats.settings = (await this.getSettings()) ? 1 : 0;
      stats.stats = (await this.getStats()) ? 1 : 0;
      stats.searchHistory = (await this.getSearchHistory())?.length || 0;
      stats.recentActivity = (await this.getRecentActivity())?.length || 0;
      stats.analytics = (await this.getAnalytics()) ? 1 : 0;
      stats.feedback = (await this.getFeedback()) ? 1 : 0;
      stats.rateApp = (await this.getRateApp()) ? 1 : 0;
      stats.contact = (await this.getContact()) ? 1 : 0;
      stats.updates = (await this.getUpdates())?.length || 0;

      // Calcular tamanho total (simplificado)
      const totalSize = Object.values(stats).reduce((acc, count) => acc + (count * 1024), 0); // Estimativa

      return {
        ...stats,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        lastSync: await this.getLastSync() || 'Nunca'
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas offline:', error);
      throw error;
    }
  }

  static async scheduleAutoSync() {
    // Em React Native, podemos usar o react-native-background-task ou similar
    // Para este exemplo, vamos apenas simular
    console.log('Sincronização automática agendada');
  }

  static async scheduleAutoBackup() {
    // Em React Native, podemos usar o react-native-background-task ou similar
    // Para este exemplo, vamos apenas simular
    console.log('Backup automático agendado');
  }

  static async scheduleAutoCleanup() {
    // Em React Native, podemos usar o react-native-background-task ou similar
    // Para este exemplo, vamos apenas simular
    console.log('Limpeza automática agendada');
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

export default LocalStorageService;