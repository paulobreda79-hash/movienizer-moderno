// encryptionService.js

const crypto = require('crypto');
const cloudConfig = require('../config/cloudConfig');

class EncryptionService {
  static encryptData(data) {
    if (!cloudConfig.sync.encryption) {
      return data;
    }

    try {
      const key = crypto.scryptSync(cloudConfig.security.encryptionKey, cloudConfig.security.salt, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(cloudConfig.security.algorithm, key);
      
      let encrypted = cipher.update(typeof data === 'string' ? data : JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      throw new Error('Falha na criptografia dos dados');
    }
  }

  static decryptData(encryptedData) {
    if (!cloudConfig.sync.encryption) {
      return encryptedData;
    }

    try {
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = crypto.scryptSync(cloudConfig.security.encryptionKey, cloudConfig.security.salt, 32);
      const decipher = crypto.createDecipher(cloudConfig.security.algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      throw new Error('Falha na descriptografia dos dados');
    }
  }

  static generateHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof data === 'string' ? data : JSON.stringify(data));
    return hash.digest('hex');
  }

  static compressData(data) {
    if (!cloudConfig.sync.compression) {
      return data;
    }

    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(typeof data === 'string' ? data : JSON.stringify(data));
      return compressed.toString('base64');
    } catch (error) {
      console.error('Erro ao comprimir dados:', error);
      return data;
    }
  }

  static decompressData(compressedData) {
    if (!cloudConfig.sync.compression) {
      return compressedData;
    }

    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return decompressed.toString('utf8');
    } catch (error) {
      console.error('Erro ao descomprimir dados:', error);
      return compressedData;
    }
  }
}

module.exports = EncryptionService;