// models/Backup.js

const db = require('../data/database/init');

class Backup {
  static create(backupData) {
    const stmt = db.prepare(`
      INSERT INTO backups (
        user_id, filename, size, type, status, 
        location, checksum, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      backupData.user_id,
      backupData.filename,
      backupData.size,
      backupData.type || 'local',
      backupData.status || 'completed',
      backupData.location || 'local',
      backupData.checksum || null,
      new Date().toISOString(),
      backupData.expires_at || null
    );

    return { id: result.lastInsertRowid, ...backupData };
  }

  static findByUserId(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM backups 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static findById(backupId) {
    const stmt = db.prepare('SELECT * FROM backups WHERE id = ?');
    return stmt.get(backupId);
  }

  static delete(backupId) {
    const stmt = db.prepare('DELETE FROM backups WHERE id = ?');
    stmt.run(backupId);
  }

  static updateStatus(backupId, status) {
    const stmt = db.prepare(`
      UPDATE backups SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(status, backupId);
  }

  static getRecentByUserId(userId, days = 7) {
    const stmt = db.prepare(`
      SELECT * FROM backups 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${days} days')
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static getFailedBackups(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM backups 
      WHERE user_id = ? AND status = 'failed'
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getTotalSizeByUserId(userId) {
    const stmt = db.prepare(`
      SELECT SUM(size) as total_size FROM backups WHERE user_id = ?
    `);
    const result = stmt.get(userId);
    return result.total_size || 0;
  }

  static getCountByUserId(userId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM backups WHERE user_id = ?
    `);
    const result = stmt.get(userId);
    return result.count || 0;
  }

  static deleteExpired() {
    const stmt = db.prepare(`
      DELETE FROM backups 
      WHERE expires_at IS NOT NULL 
      AND expires_at < datetime('now')
    `);
    stmt.run();
  }

  static cleanupOldBackups(userId, maxAgeDays = 30) {
    const stmt = db.prepare(`
      DELETE FROM backups 
      WHERE user_id = ? 
      AND created_at < datetime('now', '-${maxAgeDays} days')
    `);
    stmt.run(userId);
  }
}

module.exports = Backup;