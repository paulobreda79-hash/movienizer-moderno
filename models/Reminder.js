const db = require('../data/database/init');

class Reminder {
  static create(reminderData) {
    const stmt = db.prepare(`
      INSERT INTO reminders (
        user_id, title, description, reminder_date, 
        is_recurring, recurrence_pattern, is_completed,
        related_movie_id, related_person_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      reminderData.user_id,
      reminderData.title,
      reminderData.description || '',
      reminderData.reminder_date,
      reminderData.is_recurring || 0,
      reminderData.recurrence_pattern || null,
      reminderData.is_completed || 0,
      reminderData.related_movie_id || null,
      reminderData.related_person_id || null,
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...reminderData };
  }

  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM reminders 
      WHERE user_id = ? 
      ORDER BY reminder_date ASC
    `);
    return stmt.all(userId);
  }

  static findUpcoming(userId, days = 7) {
    const stmt = db.prepare(`
      SELECT * FROM reminders 
      WHERE user_id = ? 
      AND is_completed = 0
      AND reminder_date <= datetime('now', '+${days} days')
      AND reminder_date >= datetime('now')
      ORDER BY reminder_date ASC
    `);
    return stmt.all(userId);
  }

  static findOverdue(userId) {
    const stmt = db.prepare(`
      SELECT * FROM reminders 
      WHERE user_id = ? 
      AND is_completed = 0
      AND reminder_date < datetime('now')
      ORDER BY reminder_date ASC
    `);
    return stmt.all(userId);
  }

  static complete(reminderId) {
    const stmt = db.prepare(`
      UPDATE reminders 
      SET is_completed = 1, completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(reminderId);
  }

  static update(reminderId, reminderData) {
    const stmt = db.prepare(`
      UPDATE reminders SET
        title = ?,
        description = ?,
        reminder_date = ?,
        is_recurring = ?,
        recurrence_pattern = ?,
        is_completed = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      reminderData.title,
      reminderData.description,
      reminderData.reminder_date,
      reminderData.is_recurring,
      reminderData.recurrence_pattern,
      reminderData.is_completed,
      reminderId
    );
  }

  static delete(reminderId) {
    const stmt = db.prepare('DELETE FROM reminders WHERE id = ?');
    stmt.run(reminderId);
  }

  static getById(reminderId) {
    const stmt = db.prepare('SELECT * FROM reminders WHERE id = ?');
    return stmt.get(reminderId);
  }
}

module.exports = Reminder;