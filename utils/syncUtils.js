// utils/syncUtils.js

const crypto = require('crypto');

class SyncUtils {
  static generateChecksum(data) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof data === 'string' ? data : JSON.stringify(data));
    return hash.digest('hex');
  }

  static compareChecksums(checksum1, checksum2) {
    return checksum1 === checksum2;
  }

  static detectConflicts(localData, remoteData) {
    const conflicts = [];

    // Comparar timestamps de modificação
    if (localData.updated_at && remoteData.updated_at) {
      const localTime = new Date(localData.updated_at);
      const remoteTime = new Date(remoteData.updated_at);

      if (localTime > remoteTime) {
        conflicts.push({
          type: 'newer_local',
          local: localData,
          remote: remoteData
        });
      } else if (remoteTime > localTime) {
        conflicts.push({
          type: 'newer_remote',
          local: localData,
          remote: remoteData
        });
      }
    }

    return conflicts;
  }

  static resolveConflict(conflict, strategy = 'newer') {
    switch (strategy) {
      case 'newer':
        if (conflict.local.updated_at > conflict.remote.updated_at) {
          return conflict.local;
        } else {
          return conflict.remote;
        }
      case 'local':
        return conflict.local;
      case 'remote':
        return conflict.remote;
      case 'merge':
        // Implementar merge inteligente
        return this.mergeData(conflict.local, conflict.remote);
      default:
        return conflict.local;
    }
  }

  static mergeData(localData, remoteData) {
    // Implementar merge de campos específicos
    const merged = { ...remoteData, ...localData };
    
    // Preservar campos importantes do local
    if (localData.favorite !== undefined) {
      merged.favorite = localData.favorite;
    }
    if (localData.watched !== undefined) {
      merged.watched = localData.watched;
    }
    if (localData.personal_rating !== undefined) {
      merged.personal_rating = localData.personal_rating;
    }

    return merged;
  }

  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

module.exports = SyncUtils;