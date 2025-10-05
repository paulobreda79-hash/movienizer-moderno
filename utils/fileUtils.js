// utils/fileUtils.js

const fs = require('fs').promises;
const path = require('path');

class FileUtils {
  static async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      console.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, data, 'utf8');
      return true;
    } catch (error) {
      console.error(`Erro ao escrever arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Erro ao criar diretório ${dirPath}:`, error);
      throw error;
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir arquivo ${filePath}:`, error);
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

  static async getFilesInDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files;
    } catch (error) {
      console.error(`Erro ao listar arquivos em ${dirPath}:`, error);
      return [];
    }
  }

  static async moveFile(sourcePath, destinationPath) {
    try {
      await fs.rename(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error(`Erro ao mover arquivo de ${sourcePath} para ${destinationPath}:`, error);
      throw error;
    }
  }

  static async copyFile(sourcePath, destinationPath) {
    try {
      await fs.copyFile(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error(`Erro ao copiar arquivo de ${sourcePath} para ${destinationPath}:`, error);
      throw error;
    }
  }

  static async compressFile(filePath) {
    try {
      const zlib = require('zlib');
      const gzip = zlib.createGzip();
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(filePath + '.gz');

      await new Promise((resolve, reject) => {
        source.pipe(gzip).pipe(destination);
        destination.on('finish', resolve);
        destination.on('error', reject);
      });

      return filePath + '.gz';
    } catch (error) {
      console.error(`Erro ao comprimir arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async decompressFile(filePath) {
    try {
      const zlib = require('zlib');
      const gunzip = zlib.createGunzip();
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(filePath.replace('.gz', ''));

      await new Promise((resolve, reject) => {
        source.pipe(gunzip).pipe(destination);
        destination.on('finish', resolve);
        destination.on('error', reject);
      });

      return filePath.replace('.gz', '');
    } catch (error) {
      console.error(`Erro ao descomprimir arquivo ${filePath}:`, error);
      throw error;
    }
  }
}

module.exports = FileUtils;