// backupService.js

const path = require('path');
const fs = require('fs').promises;
const db = require('../data/database/init');
const Backup = require('../models/Backup');
const BackupUtils = require('../utils/backupUtils');
const backupConfig = require('../config/backupConfig');
const CloudService = require('./cloudService');
const NotificationService = require('./notificationService');

class BackupService {
  static async createBackup(userId, options = {}) {
    try {
      console.log(`[${new Date().toISOString()}] Iniciando backup para usuário ${userId}...`);

      // Verificar espaço disponível
      const freeSpace = await BackupUtils.getFreeSpace(backupConfig.local.directory);
      if (freeSpace < 100 * 1024 * 1024) { // Menos de 100MB
        throw new Error('Espaço insuficiente para backup');
      }

      // Criar diretório de backup se não existir
      await BackupUtils.createDirectory(backupConfig.local.directory);

      // Obter dados do usuário
      const userData = await this.getUserData(userId);
      
      // Serializar dados
      const serializedData = JSON.stringify(userData, null, 2);
      
      // Gerar nome do arquivo
      const baseName = `movienizer_backup_user_${userId}`;
      const fileName = BackupUtils.generateFileName(baseName, 'json');
      const filePath = path.join(backupConfig.local.directory, fileName);

      // Escrever dados no arquivo
      await fs.writeFile(filePath, serializedData, 'utf8');

      let finalFilePath = filePath;
      let fileSize = serializedData.length;

      // Comprimir se necessário
      if (backupConfig.general.compression) {
        const compressedPath = filePath.replace('.json', '.json.gz');
        await BackupUtils.compressFile(filePath, compressedPath);
        await fs.unlink(filePath); // Excluir arquivo original
        finalFilePath = compressedPath;
        fileSize = await BackupUtils.getFileSize(compressedPath);
      }

      // Criptografar se necessário
      if (backupConfig.general.encryption) {
        const encryptedPath = finalFilePath + '.enc';
        await BackupUtils.encryptFile(
          finalFilePath,
          encryptedPath,
          backupConfig.security.encryptionKey,
          backupConfig.security.salt,
          backupConfig.security.algorithm
        );
        await fs.unlink(finalFilePath); // Excluir arquivo não criptografado
        finalFilePath = encryptedPath;
        fileSize = await BackupUtils.getFileSize(encryptedPath);
      }

      // Calcular checksum
      const checksum = await BackupUtils.calculateChecksum(finalFilePath);

      // Registrar backup no banco de dados
      const backupRecord = Backup.create({
        user_id: userId,
        filename: path.basename(finalFilePath),
        size: fileSize,
        type: 'local',
        location: finalFilePath,
        checksum: checksum,
        expires_at: this.calculateExpirationDate()
      });

      // Upload para a nuvem se configurado
      if (backupConfig.cloud.enabled) {
        await this.uploadToCloud(userId, finalFilePath, backupRecord);
      }

      // Notificar usuário
      if (backupConfig.notifications.enabled) {
        await NotificationService.createNotification(userId, {
          title: 'Backup Concluído',
          message: `Backup de ${BackupUtils.formatBytes(fileSize)} concluído com sucesso.`,
          type: 'success',
          priority: 'low'
        });
      }

      console.log(`[${new Date().toISOString()}] Backup concluído para usuário ${userId}`);
      return { success: true, backup: backupRecord, size: fileSize };

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro no backup para usuário ${userId}:`, error);

      // Registrar falha no banco de dados
      if (userId) {
        const backupRecord = Backup.create({
          user_id: userId,
          filename: `failed_backup_${new Date().getTime()}.log`,
          size: 0,
          type: 'local',
          status: 'failed',
          location: 'error_log',
          checksum: null,
          expires_at: this.calculateExpirationDate()
        });

        // Notificar erro
        if (backupConfig.notifications.enabled) {
          await NotificationService.createNotification(userId, {
            title: 'Erro no Backup',
            message: `Falha no backup: ${error.message}`,
            type: 'error',
            priority: 'high'
          });
        }
      }

      throw error;
    }
  }

  static async getUserData(userId) {
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

      // Obter notificações não lidas
      const notificationsStmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND is_read = 0');
      const notifications = notificationsStmt.all(userId);

      return {
        movies,
        people,
        reminders,
        favorites,
        settings,
        notifications,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  }

  static async uploadToCloud(userId, filePath, backupRecord) {
    try {
      console.log(`[${new Date().toISOString()}] Upload do backup ${backupRecord.filename} para a nuvem...`);

      // Ler conteúdo do arquivo
      const fileContent = await fs.readFile(filePath);

      // Upload para a nuvem
      const cloudResult = await CloudService.uploadFile(
        backupRecord.filename,
        fileContent,
        {
          userId: userId,
          type: 'backup',
          size: backupRecord.size,
          timestamp: backupRecord.created_at
        }
      );

      // Atualizar registro do backup
      Backup.updateStatus(backupRecord.id, 'completed');

      console.log(`[${new Date().toISOString()}] Upload concluído para a nuvem`);
      return cloudResult;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro no upload para a nuvem:`, error);

      // Atualizar status do backup como falho
      Backup.updateStatus(backupRecord.id, 'failed');

      throw error;
    }
  }

  static async restoreBackup(userId, backupId) {
    try {
      console.log(`[${new Date().toISOString()}] Iniciando restauração do backup ${backupId} para usuário ${userId}...`);

      // Obter informações do backup
      const backup = Backup.findById(backupId);
      if (!backup) {
        throw new Error('Backup não encontrado');
      }

      if (backup.user_id !== userId) {
        throw new Error('Acesso negado ao backup');
      }

      let filePath = backup.location;

      // Verificar se o arquivo existe localmente
      if (!(await BackupUtils.fileExists(filePath))) {
        // Tentar baixar da nuvem
        if (backupConfig.cloud.enabled) {
          filePath = await this.downloadFromCloud(userId, backup);
        } else {
          throw new Error('Arquivo de backup não encontrado localmente e nuvem desativada');
        }
      }

      // Descriptografar se necessário
      if (backupConfig.general.encryption && filePath.endsWith('.enc')) {
        const decryptedPath = filePath.replace('.enc', '.dec');
        await BackupUtils.decryptFile(
          filePath,
          decryptedPath,
          backupConfig.security.encryptionKey,
          backupConfig.security.salt,
          backupConfig.security.algorithm
        );
        filePath = decryptedPath;
      }

      // Descomprimir se necessário
      if (backupConfig.general.compression && filePath.endsWith('.gz')) {
        const decompressedPath = filePath.replace('.gz', '');
        await BackupUtils.decompressFile(filePath, decompressedPath);
        filePath = decompressedPath;
      }

      // Verificar checksum
      if (backup.checksum) {
        const isValid = await BackupUtils.verifyChecksum(filePath, backup.checksum);
        if (!isValid) {
          throw new Error('Checksum inválido - arquivo corrompido');
        }
      }

      // Ler e parsear dados
      const fileContent = await fs.readFile(filePath, 'utf8');
      const userData = JSON.parse(fileContent);

      // Restaurar dados no banco
      await this.restoreUserData(userId, userData);

      // Notificar usuário
      if (backupConfig.notifications.enabled) {
        await NotificationService.createNotification(userId, {
          title: 'Restauração Concluída',
          message: 'Dados restaurados com sucesso do backup.',
          type: 'success',
          priority: 'medium'
        });
      }

      console.log(`[${new Date().toISOString()}] Restauração concluída para usuário ${userId}`);
      return { success: true };

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na restauração do backup ${backupId}:`, error);

      // Notificar erro
      if (backupConfig.notifications.enabled) {
        await NotificationService.createNotification(userId, {
          title: 'Erro na Restauração',
          message: `Falha na restauração: ${error.message}`,
          type: 'error',
          priority: 'high'
        });
      }

      throw error;
    }
  }

  static async restoreUserData(userId, userData) {
    try {
      console.log(`[${new Date().toISOString()}] Restaurando dados do usuário ${userId}...`);

      // Iniciar transação
      db.exec('BEGIN TRANSACTION');

      try {
        // Limpar dados existentes do usuário
        const clearStmts = [
          'DELETE FROM movies WHERE user_id = ?',
          'DELETE FROM people WHERE user_id = ?',
          'DELETE FROM reminders WHERE user_id = ?',
          'DELETE FROM favorites WHERE user_id = ?',
          'DELETE FROM notifications WHERE user_id = ?'
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
              typeof movie.genres === 'string' ? movie.genres : JSON.stringify(movie.genres),
              typeof movie.countries === 'string' ? movie.countries : JSON.stringify(movie.countries),
              movie.studio,
              typeof movie.director === 'string' ? movie.director : JSON.stringify(movie.director),
              typeof movie.writers === 'string' ? movie.writers : JSON.stringify(movie.writers),
              typeof movie.composers === 'string' ? movie.composers : JSON.stringify(movie.composers),
              typeof movie.cast === 'string' ? movie.cast : JSON.stringify(movie.cast),
              movie.rating_imdb,
              movie.rating_rottentomatoes,
              movie.rating_letterboxd,
              movie.rating_filmaffinity,
              movie.personal_rating,
              movie.duration,
              movie.rating_age,
              movie.language,
              typeof movie.awards === 'string' ? movie.awards : JSON.stringify(movie.awards),
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
              typeof person.links === 'string' ? person.links : JSON.stringify(person.links),
              typeof person.movies === 'string' ? person.movies : JSON.stringify(person.movies),
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
        console.log(`[${new Date().toISOString()}] Dados restaurados com sucesso para usuário ${userId}`);

      } catch (error) {
        // Rollback em caso de erro
        db.exec('ROLLBACK');
        console.error(`[${new Date().toISOString()}] Erro ao restaurar dados:`, error);
        throw error;
      }

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro durante a restauração dos dados:`, error);
      throw error;
    }
  }

  static async downloadFromCloud(userId, backup) {
    try {
      console.log(`[${new Date().toISOString()}] Download do backup ${backup.filename} da nuvem...`);

      // Download da nuvem
      const fileContent = await CloudService.downloadFile(backup.filename);

      // Salvar localmente
      const localPath = path.join(backupConfig.local.directory, backup.filename);
      await fs.writeFile(localPath, fileContent);

      return localPath;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro no download da nuvem:`, error);
      throw error;
    }
  }

  static async getUserBackups(userId) {
    try {
      const backups = Backup.findByUserId(userId);
      
      // Adicionar informações extras
      const enhancedBackups = await Promise.all(backups.map(async (backup) => {
        const existsLocally = await BackupUtils.fileExists(backup.location);
        return {
          ...backup,
          exists_locally: existsLocally,
          size_formatted: BackupUtils.formatBytes(backup.size)
        };
      }));

      return enhancedBackups;

    } catch (error) {
      console.error('Erro ao obter backups do usuário:', error);
      throw error;
    }
  }

  static async deleteBackup(userId, backupId) {
    try {
      console.log(`[${new Date().toISOString()}] Excluindo backup ${backupId} do usuário ${userId}...`);

      // Obter backup
      const backup = Backup.findById(backupId);
      if (!backup) {
        throw new Error('Backup não encontrado');
      }

      if (backup.user_id !== userId) {
        throw new Error('Acesso negado ao backup');
      }

      // Excluir arquivo local se existir
      if (await BackupUtils.fileExists(backup.location)) {
        await fs.unlink(backup.location);
        
        // Excluir arquivos relacionados (IV, etc.)
        const relatedFiles = [
          backup.location + '.iv',
          backup.location.replace('.enc', ''),
          backup.location.replace('.gz', '')
        ];

        for (const relatedFile of relatedFiles) {
          if (await BackupUtils.fileExists(relatedFile)) {
            await fs.unlink(relatedFile);
          }
        }
      }

      // Excluir da nuvem se configurado
      if (backupConfig.cloud.enabled) {
        try {
          await CloudService.deleteFile(backup.filename);
        } catch (error) {
          console.warn('Aviso: Erro ao excluir backup da nuvem:', error.message);
        }
      }

      // Excluir do banco de dados
      Backup.delete(backupId);

      console.log(`[${new Date().toISOString()}] Backup ${backupId} excluído com sucesso`);
      return { success: true };

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao excluir backup ${backupId}:`, error);
      throw error;
    }
  }

  static async cleanupOldBackups(userId) {
    try {
      console.log(`[${new Date().toISOString()}] Limpando backups antigos do usuário ${userId}...`);

      // Excluir backups do banco de dados
      Backup.cleanupOldBackups(userId, backupConfig.general.retention);

      // Excluir arquivos físicos antigos
      const deletedFiles = await BackupUtils.deleteOldFiles(
        backupConfig.local.directory,
        backupConfig.general.retention
      );

      console.log(`[${new Date().toISOString()}] ${deletedFiles.length} arquivos antigos excluídos`);
      return { success: true, deleted_files: deletedFiles.length };

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na limpeza de backups antigos:`, error);
      throw error;
    }
  }

  static async getBackupStats(userId) {
    try {
      const totalBackups = Backup.getCountByUserId(userId);
      const totalSize = Backup.getTotalSizeByUserId(userId);
      const failedBackups = Backup.getFailedBackups(userId);

      return {
        total_backups: totalBackups,
        total_size: totalSize,
        total_size_formatted: BackupUtils.formatBytes(totalSize),
        failed_backups: failedBackups.length,
        last_backup: Backup.getRecentByUserId(userId, 1)[0] || null
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas de backup:', error);
      throw error;
    }
  }

  static calculateExpirationDate() {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + backupConfig.general.retention);
    return expirationDate.toISOString();
  }

  static async scheduleAutoBackup() {
    const cron = require('node-cron');
    
    if (!backupConfig.general.enabled) {
      console.log('Backups automáticos desativados');
      return;
    }

    const schedule = backupConfig.schedule[backupConfig.general.frequency];
    if (!schedule) {
      console.error('Agendamento inválido:', backupConfig.general.frequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando backup automático...`);
        
        // Aqui você pode obter todos os usuários ativos
        // Por enquanto, vamos usar um placeholder
        const userId = 1; // Este deve vir do contexto
        
        await this.createBackup(userId);
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro no backup automático:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Backups automáticos agendados para executar ${backupConfig.general.frequency}`);
  }
}

module.exports = BackupService;