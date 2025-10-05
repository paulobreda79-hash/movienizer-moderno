const db = require('../data/database/init');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (
        username, email, password, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userData.username,
      userData.email,
      hashedPassword,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, username: userData.username, email: userData.email };
  }

  static async findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static async findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static async findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static async updateLastLogin(id) {
    const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), id);
  }

  static async verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    stmt.run(hashedPassword, userId);
  }

  static async updateProfile(userId, profileData) {
    const stmt = db.prepare(`
      UPDATE users SET 
        username = ?, 
        email = ?, 
        updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      profileData.username,
      profileData.email,
      new Date().toISOString(),
      userId
    );
  }
}

module.exports = User;