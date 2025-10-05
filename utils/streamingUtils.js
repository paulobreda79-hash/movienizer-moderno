// streamingUtils.js

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const streamingConfig = require('../config/streamingConfig');

class StreamingUtils {
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

  static async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Erro ao escrever arquivo ${filePath}:`, error);
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

  static generateCacheKey(title, year, platforms) {
    const key = `${title}_${year}_${platforms.join('_')}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  static async getFromCache(cacheKey) {
    if (!streamingConfig.cache.enabled) return null;

    try {
      const cacheDir = streamingConfig.cache.directory;
      const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
      
      if (await this.fileExists(cacheFile)) {
        const cacheData = await this.readFile(cacheFile);
        
        // Verificar TTL
        const now = new Date().getTime();
        const cacheAge = now - new Date(cacheData.cached_at).getTime();
        const ttlMs = streamingConfig.general.cacheTTL * 60 * 60 * 1000;
        
        if (cacheAge < ttlMs) {
          return cacheData.data;
        } else {
          // Excluir cache expirado
          await this.deleteFile(cacheFile);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar do cache:', error);
    }

    return null;
  }

  static async saveToCache(cacheKey, data) {
    if (!streamingConfig.cache.enabled) return;

    try {
      const cacheDir = streamingConfig.cache.directory;
      await this.createDirectory(cacheDir);
      
      const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
      const cacheData = {
        data: data,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (streamingConfig.general.cacheTTL * 60 * 60 * 1000)).toISOString()
      };

      await this.writeFile(cacheFile, cacheData);
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  static async cleanCache() {
    if (!streamingConfig.cache.enabled) return;

    try {
      const cacheDir = streamingConfig.cache.directory;
      if (!(await this.fileExists(cacheDir))) return;

      const files = await fs.readdir(cacheDir);
      const now = new Date().getTime();

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(cacheDir, file);
          const cacheData = await this.readFile(filePath);
          
          const expiresAt = new Date(cacheData.expires_at).getTime();
          if (now > expiresAt) {
            await this.deleteFile(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  static formatPlatformName(platformId) {
    const platform = streamingConfig.platforms[platformId];
    return platform ? platform.name : platformId;
  }

  static getPlatformIcon(platformId) {
    const platform = streamingConfig.platforms[platformId];
    return platform ? platform.icon : 'unknown';
  }

  static getPlatformColor(platformId) {
    const platform = streamingConfig.platforms[platformId];
    return platform ? platform.color : '#666666';
  }

  static getPlatformBaseUrl(platformId) {
    const platform = streamingConfig.platforms[platformId];
    return platform ? platform.baseUrl : '#';
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

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Tentativa ${attempt} falhou. Tentando novamente em ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  static normalizeTitle(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .trim();
  }

  static async checkInternetConnection() {
    try {
      const https = require('https');
      return new Promise((resolve, reject) => {
        const req = https.get('https://www.google.com', (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  static detectChanges(oldData, newData) {
    const changes = {
      added: [],
      removed: [],
      changed: []
    };

    // Detectar adições
    newData.forEach(newItem => {
      const exists = oldData.some(oldItem => 
        oldItem.platform_id === newItem.platform_id && 
        oldItem.offer_id === newItem.offer_id
      );
      
      if (!exists) {
        changes.added.push(newItem);
      }
    });

    // Detectar remoções
    oldData.forEach(oldItem => {
      const exists = newData.some(newItem => 
        newItem.platform_id === oldItem.platform_id && 
        newItem.offer_id === oldItem.offer_id
      );
      
      if (!exists) {
        changes.removed.push(oldItem);
      }
    });

    return changes;
  }
}

module.exports = StreamingUtils;