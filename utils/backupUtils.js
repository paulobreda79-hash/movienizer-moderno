// backupUtils.js

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

class BackupUtils {
  static async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Erro ao criar diretório ${dirPath}:`, error);
      throw error;
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      console.error(`Erro ao obter tamanho do arquivo ${filePath}:`, error);
      return 0;
    }
  }

  static async getDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error(`Erro ao calcular tamanho do diretório ${dirPath}:`, error);
      return 0;
    }
  }

  static async compressFile(inputPath, outputPath) {
    try {
      const gzip = zlib.createGzip();
      const source = fs.createReadStream(inputPath);
      const destination = fs.createWriteStream(outputPath);

      await new Promise((resolve, reject) => {
        source.pipe(gzip).pipe(destination);
        destination.on('finish', resolve);
        destination.on('error', reject);
      });

      return outputPath;
    } catch (error) {
      console.error(`Erro ao comprimir arquivo ${inputPath}:`, error);
      throw error;
    }
  }

  static async decompressFile(inputPath, outputPath) {
    try {
      const gunzip = zlib.createGunzip();
      const source = fs.createReadStream(inputPath);
      const destination = fs.createWriteStream(outputPath);

      await new Promise((resolve, reject) => {
        source.pipe(gunzip).pipe(destination);
        destination.on('finish', resolve);
        destination.on('error', reject);
      });

      return outputPath;
    } catch (error) {
      console.error(`Erro ao descomprimir arquivo ${inputPath}:`, error);
      throw error;
    }
  }

  static async encryptFile(inputPath, outputPath, key, salt, algorithm = 'aes-256-cbc') {
    try {
      const derivedKey = crypto.scryptSync(key, salt, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, derivedKey);
      
      const source = fs.createReadStream(inputPath);
      const destination = fs.createWriteStream(outputPath);

      await new Promise((resolve, reject) => {
        source.pipe(cipher).pipe(destination);
        destination.on('finish', resolve);
        destination.on('error', reject);
      });

      // Salvar IV separadamente
      const ivPath = outputPath + '.iv';
      await fs.writeFile(ivPath, iv);

      return outputPath;
    } catch (error) {
      console.error(`Erro ao criptografar arquivo ${inputPath}:`, error);
      throw error;
    }
  }

  static async decryptFile(inputPath, outputPath, key, salt, algorithm = 'aes-256-cbc') {
    try {
      const derivedKey = crypto.scryptSync(key, salt, 32);
      
      // Ler IV
      const ivPath = inputPath + '.iv';
      const iv = await fs.readFile(ivPath);
      
      const decipher = crypto.createDecipher(algorithm, derivedKey);
      const source = fs.createReadStream(inputPath);
      const destination = fs.createWriteStream(outputPath);

      await new Promise((resolve, reject) => {
        source.pipe(decipher).pipe(destination);
        destination.on('finish', resolve);
        destination.on('error', reject);
      });

      return outputPath;
    } catch (error) {
      console.error(`Erro ao descriptografar arquivo ${inputPath}:`, error);
      throw error;
    }
  }

  static generateFileName(baseName, extension = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${baseName}_${timestamp}.${extension}`;
  }

  static async getFilesInDirectory(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      
      if (extension) {
        return files.filter(file => path.extname(file) === `.${extension}`);
      }
      
      return files;
    } catch (error) {
      console.error(`Erro ao listar arquivos em ${dirPath}:`, error);
      return [];
    }
  }

  static async deleteOldFiles(dirPath, maxAgeDays = 30, extension = null) {
    try {
      const files = await this.getFilesInDirectory(dirPath, extension);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const deletedFiles = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedFiles.push(file);
          
          // Excluir também arquivo IV se existir
          const ivPath = filePath + '.iv';
          if (await this.fileExists(ivPath)) {
            await fs.unlink(ivPath);
          }
        }
      }

      return deletedFiles;
    } catch (error) {
      console.error('Erro ao excluir arquivos antigos:', error);
      throw error;
    }
  }

  static async getFreeSpace(path) {
    try {
      const os = require('os');
      const diskInfo = os.freemem();
      return diskInfo;
    } catch (error) {
      console.error('Erro ao obter espaço livre:', error);
      return 0;
    }
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async calculateChecksum(filePath) {
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      return new Promise((resolve, reject) => {
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error(`Erro ao calcular checksum do arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async verifyChecksum(filePath, expectedChecksum) {
    try {
      const calculatedChecksum = await this.calculateChecksum(filePath);
      return calculatedChecksum === expectedChecksum;
    } catch (error) {
      console.error('Erro ao verificar checksum:', error);
      return false;
    }
  }
}

module.exports = BackupUtils;