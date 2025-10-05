const path = require('path');
const fs = require('fs');

const CACHE_DIR = path.join(__dirname, '../cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

class CacheService {
  static async get(key) {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Verificar expiração
      if (data.expiresAt && Date.now() > data.expiresAt) {
        fs.unlinkSync(filePath);
        return null;
      }
      
      return data.value;
    }
    
    return null;
  }

  static async set(key, value, ttlSeconds = 3600) { // 1 hora padrão
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const data = {
      value: value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  static async clear() {
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      fs.unlinkSync(filePath);
    });
  }
}

module.exports = CacheService;