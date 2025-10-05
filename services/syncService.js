// syncService.js

const CloudService = require('./cloudService');
const db = require('../data/database/init');
const cloudConfig = require('../config/cloudConfig');
const EncryptionService = require('./encryptionService');
const fs = require('fs').promises;
const path = require('path');

class SyncService {
  constructor() {
    this.syncStatus = 'idle'; // idle, syncing, error, paused
    this.lastSync = null;
    this.conflicts = [];
    this.syncQueue = [];
  }

  async syncAllData(userId) {
    try {
      this.syncStatus = 'syncing';
      console.log('Iniciando sincronização completa...');

      // Obter todos os dados do usuário
      const userData = await this.getUserData(userId);
      
      // Serializar dados
      const serializedData = this.serializeUserData(userData);
      
      // Gerar nome do arquivo
      const fileName = `backup_${userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      // Upload para a nuvem
      await CloudService.uploadFile(fileName, serializedData, {
        userId: userId,
        type: 'full_backup',
        version: '1.0'
      });

      // Atualizar status de sincronização
      this.lastSync = new Date();
      this.syncStatus = 'idle';

      console.log('Sincronização completa concluída com sucesso');
      return { success: true, fileName };
    } catch (error) {
      console.error('Erro durante a sincronização completa:', error);
      this.syncStatus = 'error';
      throw error;
    }
  }

  async syncChanges(userId, changes) {
    try {
      this.syncStatus = 'syncing';
      console.log('Sincronizando mudanças...');

      // Processar mudanças
      const processedChanges = await this.processChanges(userId, changes);
      
      // Gerar nome do arquivo de mudanças
      const fileName = `changes_${userId}_${new Date().getTime()}.json`;
      
      // Upload para a nuvem
      await CloudService.uploadFile(fileName, processedChanges, {
        userId: userId,
        type: 'changes',
        timestamp: new Date().toISOString()
      });

      this.lastSync = new Date();
      this.syncStatus = 'idle';

      console.log('Sincronização de mudanças concluída');
      return { success: true, fileName };
    } catch (error) {
      console.error('Erro durante a sincronização de mudanças:', error);
      this.syncStatus = 'error';
      throw error;
    }
  }

  async getUserData(userId) {
    try {
      // Obter filmes do usuário
      const moviesStmt = db.prepare('SELECT * FROM movies WHERE user_id = ?');
      const movies = moviesStmt.all(userId);

      // Obter pessoas do usuário
      const peopleStmt = db.prepare('SELECT * FROM people WHERE user_id = ?');
      const people = peopleStmt.all(userId);

      // Obter lembretes do usuário
      const remindersStmt = db.prepare('SELECT * FROM reminders WHERE user_id = ?');
      const reminders = remindersStmt.all(userId);

      // Obter favoritos do usuário
      const favoritesStmt = db.prepare('SELECT * FROM favorites WHERE user_id = ?');
      const favorites = favoritesStmt.all(userId);

      // Obter configurações do usuário
      const settingsStmt = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
      const settings = settingsStmt.get(userId);

      return {
        movies,
        people,
        reminders,
        favorites,
        settings,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  }

  serializeUserData(userData) {
    return JSON.stringify(userData, null, 2);
  }

  deserializeUserData(serializedData) {
    return JSON.parse(serializedData);
  }

  async processChanges(userId, changes) {
    const processedChanges = {
      timestamp: new Date().toISOString(),
      userId: userId,
      operations: []
    };

    // Processar cada mudança
    for (const change of changes) {
      try {
        const operation = await this.processChange(change);
        processedChanges.operations.push(operation);
      } catch (error) {
        console.error(`Erro ao processar mudança:`, error);
        this.conflicts.push({
          change: change,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return processedChanges;
  }

  async processChange(change) {
    // Implementar lógica específica para cada tipo de mudança
    // Ex: INSERT, UPDATE, DELETE em tabelas específicas
    return {
      type: change.type,
      table: change.table,
      data: change.data,
      timestamp: new Date().toISOString()
    };
  }

  async restoreFromCloud(userId, fileName) {
    try {
      console.log(`Restaurando dados do usuário ${userId} do arquivo ${fileName}...`);

      // Download do arquivo da nuvem
      const serializedData = await CloudService.downloadFile(fileName);
      
      // Desserializar dados
      const userData = this.deserializeUserData(serializedData);
      
      // Restaurar dados no banco local
      await this.restoreUserData(userId, userData);

      console.log('Restauração concluída com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro durante a restauração:', error);
      throw error;
    }
  }

  async restoreUserData(userId, userData) {
    try {
      // Iniciar transação
      db.exec('BEGIN TRANSACTION');

      try {
        // Limpar dados existentes do usuário
        const clearStmts = [
          'DELETE FROM movies WHERE user_id = ?',
          'DELETE FROM people WHERE user_id = ?',
          'DELETE FROM reminders WHERE user_id = ?',
          'DELETE FROM favorites WHERE user_id = ?'
        ];

        clearStmts.forEach(sql => {
          const stmt = db.prepare(sql);
          stmt.run(userId);
        });

        // Restaurar filmes
        if (userData.movies) {
          const insertMovieStmt = db.prepare(`
            INSERT INTO movies (
              user_id, title, year, genres, countries, studio, director, writers,
              composers, cast, rating_imdb, rating_rottentomatoes, rating_letterboxd,
              rating_filmaffinity, personal_rating, duration, rating_age, language,
              awards, plot, poster, backdrop, trailer_url, watched, favorite,
              watched_date, favorite_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          userData.movies.forEach(movie => {
            insertMovieStmt.run(
              userId,
              movie.title,
              movie.year,
              movie.genres,
              movie.countries,
              movie.studio,
              movie.director,
              movie.writers,
              movie.composers,
              movie.cast,
              movie.rating_imdb,
              movie.rating_rottentomatoes,
              movie.rating_letterboxd,
              movie.rating_filmaffinity,
              movie.personal_rating,
              movie.duration,
              movie.rating_age,
              movie.language,
              movie.awards,
              movie.plot,
              movie.poster,
              movie.backdrop,
              movie.trailer_url,
              movie.watched,
              movie.favorite,
              movie.watched_date,
              movie.favorite_date,
              movie.created_at,
              movie.updated_at
            );
          });
        }

        // Restaurar pessoas
        if (userData.people) {
          const insertPersonStmt = db.prepare(`
            INSERT INTO people (
              user_id, name, full_name, birth_date, birth_place, role, height,
              nickname, biography, image, links, movies, watched, favorite,
              followed, watched_date, favorite_date, followed_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          userData.people.forEach(person => {
            insertPersonStmt.run(
              userId,
              person.name,
              person.full_name,
              person.birth_date,
              person.birth_place,
              person.role,
              person.height,
              person.nickname,
              person.biography,
              person.image,
              person.links,
              person.movies,
              person.watched,
              person.favorite,
              person.followed,
              person.watched_date,
              person.favorite_date,
              person.followed_date,
              person.created_at,
              person.updated_at
            );
          });
        }

        // Restaurar lembretes
        if (userData.reminders) {
          const insertReminderStmt = db.prepare(`
            INSERT INTO reminders (
              user_id, title, description, reminder_date, is_recurring,
              recurrence_pattern, is_completed, completed_at, related_movie_id,
              related_person_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          userData.reminders.forEach(reminder => {
            insertReminderStmt.run(
              userId,
              reminder.title,
              reminder.description,
              reminder.reminder_date,
              reminder.is_recurring,
              reminder.recurrence_pattern,
              reminder.is_completed,
              reminder.completed_at,
              reminder.related_movie_id,
              reminder.related_person_id,
              reminder.created_at,
              reminder.updated_at
            );
          });
        }

        // Restaurar favoritos
        if (userData.favorites) {
          const insertFavoriteStmt = db.prepare(`
            INSERT INTO favorites (
              user_id, movie_id, person_id, type, added_date
            ) VALUES (?, ?, ?, ?, ?)
          `);

          userData.favorites.forEach(favorite => {
            insertFavoriteStmt.run(
              userId,
              favorite.movie_id,
              favorite.person_id,
              favorite.type,
              favorite.added_date
            );
          });
        }

        // Commit transação
        db.exec('COMMIT');
        console.log('Dados restaurados com sucesso');
      } catch (error) {
        // Rollback em caso de erro
        db.exec('ROLLBACK');
        console.error('Erro ao restaurar dados:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro durante a restauração dos dados:', error);
      throw error;
    }
  }

  async getAvailableBackups(userId) {
    try {
      // Listar arquivos da nuvem
      const files = await CloudService.listFiles(`backup_${userId}_`);
      
      // Filtrar e formatar backups
      const backups = files
        .filter(file => file.name && file.name.startsWith(`backup_${userId}_`))
        .map(file => ({
          fileName: file.name,
          size: file.size || 0,
          modifiedTime: file.modifiedTime || file.LastModified,
          metadata: file.metadata || file.Metadata
        }))
        .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

      return backups;
    } catch (error) {
      console.error('Erro ao obter backups disponíveis:', error);
      throw error;
    }
  }

  async deleteBackup(fileName) {
    try {
      await CloudService.deleteFile(fileName);
      console.log(`Backup ${fileName} excluído com sucesso`);
      return { success: true };
    } catch (error) {
      console.error(`Erro ao excluir backup ${fileName}:`, error);
      throw error;
    }
  }

  getStatus() {
    return {
      status: this.syncStatus,
      lastSync: this.lastSync,
      conflicts: this.conflicts.length,
      queueLength: this.syncQueue.length
    };
  }

  pauseSync() {
    this.syncStatus = 'paused';
    console.log('Sincronização pausada');
  }

  resumeSync() {
    this.syncStatus = 'idle';
    console.log('Sincronização retomada');
  }

  clearConflicts() {
    this.conflicts = [];
    console.log('Conflitos limpos');
  }

  async scheduleAutoSync(userId) {
    if (cloudConfig.sync.autoSync) {
      setInterval(async () => {
        try {
          await this.syncAllData(userId);
        } catch (error) {
          console.error('Erro na sincronização automática:', error);
        }
      }, cloudConfig.sync.syncInterval);
    }
  }
}

module.exports = new SyncService();