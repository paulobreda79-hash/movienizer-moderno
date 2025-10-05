const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class Encryption {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  static async verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  static encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decryptData(encryptedData, key) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = Encryption;