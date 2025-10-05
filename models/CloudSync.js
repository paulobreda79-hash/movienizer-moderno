// models/CloudSync.js

const db = require('../data/database/init');

class CloudSync {
  static async createSyncRecord(syncData) {
    const stmt = db.prepare(`
      INSERT INTO cloud_sync (
        user_id, sync_type, status, file_name, file_size,
        started_at, completed_at, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      syncData.user_id,
      syncData.sync_type,
      syncData.status,
      syncData.file_name,
      syncData.file_size,
      syncData.started_at,
      syncData.completed_at,
      syncData.error_message
    );

    return { id: result.lastInsertRowid, ...syncData };
  }

  static async getSyncHistory(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM cloud_sync 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static async updateSyncStatus(syncId, status, completedAt = null, errorMessage = null) {
    const stmt = db.prepare(`
      UPDATE cloud_sync SET
        status = ?,
        completed_at = ?,
        error_message = ?
      WHERE id = ?
    `);

    stmt.run(status, completedAt, errorMessage, syncId);
  }

  static async getActiveSyncs(userId) {
    const stmt = db.prepare(`
      SELECT * FROM cloud_sync 
      WHERE user_id = ? AND status = 'in_progress'
    `);
    return stmt.all(userId);
  }

  static async cleanupOldRecords(userId, days = 30) {
    const stmt = db.prepare(`
      DELETE FROM cloud_sync 
      WHERE user_id = ? AND started_at < datetime('now', '-${days} days')
    `);
    stmt.run(userId);
  }
}

module.exports = CloudSync;