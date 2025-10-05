const db = require('../data/database/init');

class Notification {
  static create(notificationData) {
    const stmt = db.prepare(`
      INSERT INTO notifications (
        user_id, title, message, type, priority, is_read, 
        related_movie_id, related_person_id, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      notificationData.user_id,
      notificationData.title,
      notificationData.message,
      notificationData.type || 'info',
      notificationData.priority || 'medium',
      notificationData.is_read || 0,
      notificationData.related_movie_id || null,
      notificationData.related_person_id || null,
      new Date().toISOString(),
      notificationData.expires_at || null
    );

    return { id: result.lastInsertRowid, ...notificationData };
  }

  static findByUserId(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static markAsRead(notificationId) {
    const stmt = db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(notificationId);
  }

  static markAllAsRead(userId) {
    const stmt = db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND is_read = 0
    `);
    stmt.run(userId);
  }

  static delete(notificationId) {
    const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    stmt.run(notificationId);
  }

  static getUnreadCount(userId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `);
    return stmt.get(userId);
  }

  static getRecentByUserId(userId, days = 7) {
    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${days} days')
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static deleteExpired() {
    const stmt = db.prepare(`
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL 
      AND expires_at < datetime('now')
    `);
    stmt.run();
  }
}

module.exports = Notification;