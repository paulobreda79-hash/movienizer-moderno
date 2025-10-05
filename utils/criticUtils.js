// criticUtils.js

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const criticConfig = require('../config/criticConfig');

class CriticUtils {
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

  static generateCacheKey(title, year, apis) {
    const key = `${title}_${year}_${apis.join('_')}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  static async getFromCache(cacheKey) {
    if (!criticConfig.cache.enabled) return null;

    try {
      const cacheDir = criticConfig.cache.directory;
      const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
      
      if (await this.fileExists(cacheFile)) {
        const cacheData = await this.readFile(cacheFile);
        
        // Verificar TTL
        const now = new Date().getTime();
        const cacheAge = now - new Date(cacheData.cached_at).getTime();
        const ttlMs = criticConfig.cache.ttl * 1000;
        
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
    if (!criticConfig.cache.enabled) return;

    try {
      const cacheDir = criticConfig.cache.directory;
      await this.createDirectory(cacheDir);
      
      const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
      const cacheData = {
        data: data,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (criticConfig.cache.ttl * 1000)).toISOString()
      };

      await this.writeFile(cacheFile, cacheData);
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  static async cleanCache() {
    if (!criticConfig.cache.enabled) return;

    try {
      const cacheDir = criticConfig.cache.directory;
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

  static formatApiName(apiId) {
    const api = criticConfig.apis[apiId];
    return api ? api.name : apiId;
  }

  static getApiIcon(apiId) {
    const api = criticConfig.apis[apiId];
    return api ? api.icon : '❓';
  }

  static getApiColor(apiId) {
    const api = criticConfig.apis[apiId];
    return api ? api.color : '#666666';
  }

  static getApiBaseUrl(apiId) {
    const api = criticConfig.apis[apiId];
    return api ? api.baseUrl : '#';
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

  static detectRatingChanges(oldRatings, newRatings) {
    const changes = {
      added: [],
      removed: [],
      improved: [],
      declined: [],
      unchanged: []
    };

    // Comparar ratings
    Object.entries(newRatings).forEach(([api, newRating]) => {
      const oldRating = oldRatings[api];
      
      if (!oldRating) {
        changes.added.push({ api, rating: newRating });
      } else if (newRating > oldRating) {
        changes.improved.push({ api, oldRating, newRating, difference: newRating - oldRating });
      } else if (newRating < oldRating) {
        changes.declined.push({ api, oldRating, newRating, difference: oldRating - newRating });
      } else {
        changes.unchanged.push({ api, rating: newRating });
      }
    });

    // Verificar ratings removidos
    Object.entries(oldRatings).forEach(([api, oldRating]) => {
      if (!newRatings[api]) {
        changes.removed.push({ api, rating: oldRating });
      }
    });

    return changes;
  }

  static calculateAverageRating(ratings) {
    const validRatings = Object.values(ratings).filter(r => r && r > 0);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
    return (sum / validRatings.length).toFixed(2);
  }

  static formatRating(rating, maxRating = 10) {
    if (!rating) return 'N/A';
    return `${rating.toFixed(1)}/${maxRating}`;
  }

  static getRatingColor(rating, maxRating = 10) {
    const percentage = (rating / maxRating) * 100;
    
    if (percentage >= 80) return '#2ecc71'; // Verde
    if (percentage >= 60) return '#f1c40f'; // Amarelo
    if (percentage >= 40) return '#e67e22'; // Laranja
    return '#e74c3c'; // Vermelho
  }

  static getRatingIcon(rating, maxRating = 10) {
    const percentage = (rating / maxRating) * 100;
    
    if (percentage >= 90) return '🏆'; // Troféu
    if (percentage >= 80) return '⭐'; // Estrela
    if (percentage >= 70) return '🔥'; // Fogo
    if (percentage >= 60) return '👍'; // Polegar para cima
    if (percentage >= 50) return '😐'; // Neutro
    return '👎'; // Polegar para baixo
  }

  static validateRating(rating, min = 0, max = 10) {
    if (typeof rating !== 'number' || isNaN(rating)) return false;
    return rating >= min && rating <= max;
  }

  static roundRating(rating, decimals = 2) {
    if (!rating) return 0;
    return Math.round(rating * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static getRatingScale(apiId) {
    const scales = {
      'imdb': 10,
      'rt': 100,
      'lbxd': 5,
      'fa': 10,
      'trakt': 10,
      'mc': 100,
      'tmdb': 10
    };
    return scales[apiId] || 10;
  }

  static normalizeRating(rating, fromScale, toScale = 10) {
    if (!rating || fromScale === toScale) return rating;
    return (rating / fromScale) * toScale;
  }

  static getRatingDescription(rating, maxRating = 10) {
    const percentage = (rating / maxRating) * 100;
    
    if (percentage >= 90) return 'Excelente';
    if (percentage >= 80) return 'Muito Bom';
    if (percentage >= 70) return 'Bom';
    if (percentage >= 60) return 'Regular';
    if (percentage >= 50) return 'Ruim';
    return 'Muito Ruim';
  }

  static getRatingEmoji(rating, maxRating = 10) {
    const percentage = (rating / maxRating) * 100;
    
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '⭐⭐⭐⭐⭐';
    if (percentage >= 70) return '⭐⭐⭐⭐';
    if (percentage >= 60) return '⭐⭐⭐';
    if (percentage >= 50) return '⭐⭐';
    return '⭐';
  }

  static compareRatings(rating1, rating2, tolerance = 0.1) {
    if (Math.abs(rating1 - rating2) <= tolerance) return 'equal';
    if (rating1 > rating2) return 'higher';
    return 'lower';
  }

  static getRatingTrend(oldRating, newRating, tolerance = 0.1) {
    const difference = newRating - oldRating;
    if (Math.abs(difference) <= tolerance) return 'stable';
    if (difference > 0) return 'improving';
    return 'declining';
  }

  static getRatingHistory(ratings, limit = 10) {
    return ratings
      .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))
      .slice(0, limit);
  }

  static getRatingStatistics(ratings) {
    const validRatings = ratings.filter(r => r.rating && r.rating > 0);
    
    if (validRatings.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0,
        stdDev: 0
      };
    }

    const values = validRatings.map(r => r.rating);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: validRatings.length,
      average: parseFloat(average.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2))
    };
  }

  static getRatingDistribution(ratings) {
    const distribution = {};
    
    ratings.forEach(rating => {
      const range = Math.floor(rating.rating);
      distribution[range] = (distribution[range] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([range, count]) => ({ range: parseInt(range), count }))
      .sort((a, b) => a.range - b.range);
  }

  static getRatingConsensus(ratings) {
    const validRatings = ratings.filter(r => r.rating && r.rating > 0);
    if (validRatings.length === 0) return null;

    const sum = validRatings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / validRatings.length;

    return {
      consensus: parseFloat(average.toFixed(2)),
      sources: validRatings.length,
      highest: Math.max(...validRatings.map(r => r.rating)),
      lowest: Math.min(...validRatings.map(r => r.rating)),
      confidence: validRatings.length >= 3 ? 'high' : 'low'
    };
  }

  static getRatingConfidence(ratings) {
    const validRatings = ratings.filter(r => r.rating && r.rating > 0);
    const count = validRatings.length;

    if (count >= 5) return 'very_high';
    if (count >= 3) return 'high';
    if (count >= 2) return 'medium';
    if (count >= 1) return 'low';
    return 'none';
  }

  static getRatingConfidenceLabel(confidence) {
    const labels = {
      'very_high': 'Muito Alta',
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa',
      'none': 'Nenhuma'
    };
    return labels[confidence] || 'Desconhecida';
  }

  static getRatingConfidenceColor(confidence) {
    const colors = {
      'very_high': '#2ecc71',
      'high': '#3498db',
      'medium': '#f1c40f',
      'low': '#e67e22',
      'none': '#e74c3c'
    };
    return colors[confidence] || '#666666';
  }

  static getRatingConfidenceIcon(confidence) {
    const icons = {
      'very_high': '✅',
      'high': '👍',
      'medium': '👌',
      'low': '⚠️',
      'none': '❌'
    };
    return icons[confidence] || '❓';
  }

  static getRatingSourceName(sourceId) {
    const sources = {
      'imdb': 'IMDb',
      'rt': 'Rotten Tomatoes',
      'lbxd': 'Letterboxd',
      'fa': 'FilmAffinity',
      'trakt': 'Trakt.tv',
      'mc': 'Metacritic',
      'tmdb': 'TMDb'
    };
    return sources[sourceId] || sourceId;
  }

  static getRatingSourceIcon(sourceId) {
    const icons = {
      'imdb': '🎬',
      'rt': '🍅',
      'lbxd': '🎥',
      'fa': '🌟',
      'trakt': '🔥',
      'mc': '💯',
      'tmdb': '📺'
    };
    return icons[sourceId] || '❓';
  }

  static getRatingSourceColor(sourceId) {
    const colors = {
      'imdb': '#f5c518',
      'rt': '#fa3200',
      'lbxd': '#2c3440',
      'fa': '#ff6b00',
      'trakt': '#ed1c24',
      'mc': '#000000',
      'tmdb': '#0d253f'
    };
    return colors[sourceId] || '#666666';
  }

  static getRatingSourceUrl(sourceId, movieId) {
    const urls = {
      'imdb': `https://www.imdb.com/title/${movieId}`,
      'rt': `https://www.rottentomatoes.com/m/${movieId}`,
      'lbxd': `https://letterboxd.com/film/${movieId}`,
      'fa': `https://www.filmaffinity.com/pt/film${movieId}.html`,
      'trakt': `https://trakt.tv/movies/${movieId}`,
      'mc': `https://www.metacritic.com/movie/${movieId}`,
      'tmdb': `https://www.themoviedb.org/movie/${movieId}`
    };
    return urls[sourceId] || '#';
  }

  static getRatingSourceMaxRating(sourceId) {
    const maxRatings = {
      'imdb': 10,
      'rt': 100,
      'lbxd': 5,
      'fa': 10,
      'trakt': 10,
      'mc': 100,
      'tmdb': 10
    };
    return maxRatings[sourceId] || 10;
  }

  static normalizeRatingToStandard(rating, sourceId) {
    const maxRating = this.getRatingSourceMaxRating(sourceId);
    return this.normalizeRating(rating, maxRating, 10);
  }

  static getRatingComparison(ratings) {
    const comparison = {};
    
    Object.entries(ratings).forEach(([source, rating]) => {
      comparison[source] = {
        rating: rating,
        normalized: this.normalizeRatingToStandard(rating, source),
        source: source,
        sourceName: this.getRatingSourceName(source),
        sourceIcon: this.getRatingSourceIcon(source),
        sourceColor: this.getRatingSourceColor(source),
        sourceUrl: this.getRatingSourceUrl(source, rating.movieId),
        maxRating: this.getRatingSourceMaxRating(source)
      };
    });

    return comparison;
  }

  static getBestRating(ratings) {
    const validRatings = Object.entries(ratings)
      .filter(([_, rating]) => rating && rating > 0)
      .map(([source, rating]) => ({
        source,
        rating: this.normalizeRatingToStandard(rating, source),
        originalRating: rating
      }));

    if (validRatings.length === 0) return null;

    return validRatings.reduce((best, current) => 
      current.rating > best.rating ? current : best
    );
  }

  static getWorstRating(ratings) {
    const validRatings = Object.entries(ratings)
      .filter(([_, rating]) => rating && rating > 0)
      .map(([source, rating]) => ({
        source,
        rating: this.normalizeRatingToStandard(rating, source),
        originalRating: rating
      }));

    if (validRatings.length === 0) return null;

    return validRatings.reduce((worst, current) => 
      current.rating < worst.rating ? current : worst
    );
  }

  static getRatingSpread(ratings) {
    const validRatings = Object.values(ratings).filter(r => r && r > 0);
    if (validRatings.length < 2) return 0;
    
    const max = Math.max(...validRatings);
    const min = Math.min(...validRatings);
    return max - min;
  }

  static getRatingConsistency(ratings) {
    const spread = this.getRatingSpread(ratings);
    if (spread === 0) return 'perfect';
    if (spread <= 1) return 'high';
    if (spread <= 2) return 'medium';
    if (spread <= 3) return 'low';
    return 'very_low';
  }

  static getRatingConsistencyLabel(consistency) {
    const labels = {
      'perfect': 'Perfeita',
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa',
      'very_low': 'Muito Baixa'
    };
    return labels[consistency] || 'Desconhecida';
  }

  static getRatingConsistencyColor(consistency) {
    const colors = {
      'perfect': '#2ecc71',
      'high': '#3498db',
      'medium': '#f1c40f',
      'low': '#e67e22',
      'very_low': '#e74c3c'
    };
    return colors[consistency] || '#666666';
  }

  static getRatingConsistencyIcon(consistency) {
    const icons = {
      'perfect': '✅',
      'high': '👍',
      'medium': '👌',
      'low': '⚠️',
      'very_low': '❌'
    };
    return icons[consistency] || '❓';
  }

  static getRatingTrendIcon(trend) {
    const icons = {
      'improving': '📈',
      'declining': '📉',
      'stable': '➡️'
    };
    return icons[trend] || '❓';
  }

  static getRatingTrendColor(trend) {
    const colors = {
      'improving': '#2ecc71',
      'declining': '#e74c3c',
      'stable': '#3498db'
    };
    return colors[trend] || '#666666';
  }

  static getRatingTrendLabel(trend) {
    const labels = {
      'improving': 'Melhorando',
      'declining': 'Diminuindo',
      'stable': 'Estável'
    };
    return labels[trend] || 'Desconhecido';
  }

  static getRatingHistoryChart(ratings) {
    const history = this.getRatingHistory(ratings, 20);
    
    return {
      labels: history.map(r => new Date(r.checked_at).toLocaleDateString()),
      datasets: [{
        label: 'Rating',
        data: history.map(r => r.rating),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        tension: 0.1
      }]
    };
  }

  static getRatingDistributionChart(ratings) {
    const distribution = this.getRatingDistribution(ratings);
    
    return {
      labels: distribution.map(d => `${d.range}-${d.range + 1}`),
      datasets: [{
        label: 'Distribuição de Ratings',
        data: distribution.map(d => d.count),
        backgroundColor: [
          '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
          '#1abc9c', '#34495e', '#e67e22', '#16a085', '#8e44ad'
        ]
      }]
    };
  }

  static getRatingSourcesChart(ratings) {
    const sources = Object.keys(ratings);
    
    return {
      labels: sources.map(s => this.getRatingSourceName(s)),
      datasets: [{
        label: 'Fontes de Rating',
        data: sources.map(s => 1),
        backgroundColor: sources.map(s => this.getRatingSourceColor(s))
      }]
    };
  }

  static getRatingComparisonChart(ratings) {
    const comparison = this.getRatingComparison(ratings);
    const sources = Object.keys(comparison);
    
    return {
      labels: sources.map(s => comparison[s].sourceName),
      datasets: [{
        label: 'Rating Normalizado',
        data: sources.map(s => comparison[s].normalized),
        backgroundColor: sources.map(s => comparison[s].sourceColor)
      }]
    };
  }

  static getRatingStatisticsChart(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      labels: ['Média', 'Mínimo', 'Máximo', 'Mediana', 'Desvio Padrão'],
      datasets: [{
        label: 'Estatísticas de Rating',
        data: [stats.average, stats.min, stats.max, stats.median, stats.stdDev],
        backgroundColor: '#3498db'
      }]
    };
  }

  static getRatingConfidenceChart(ratings) {
    const confidence = this.getRatingConfidence(ratings);
    
    return {
      labels: ['Confiança'],
      datasets: [{
        label: 'Nível de Confiança',
        data: [this.getRatingConfidenceValue(confidence)],
        backgroundColor: this.getRatingConfidenceColor(confidence)
      }]
    };
  }

  static getRatingConfidenceValue(confidence) {
    const values = {
      'very_high': 100,
      'high': 80,
      'medium': 60,
      'low': 40,
      'none': 0
    };
    return values[confidence] || 0;
  }

  static getRatingConsistencyChart(ratings) {
    const consistency = this.getRatingConsistency(ratings);
    
    return {
      labels: ['Consistência'],
      datasets: [{
        label: 'Nível de Consistência',
        data: [this.getRatingConsistencyValue(consistency)],
        backgroundColor: this.getRatingConsistencyColor(consistency)
      }]
    };
  }

  static getRatingConsistencyValue(consistency) {
    const values = {
      'perfect': 100,
      'high': 80,
      'medium': 60,
      'low': 40,
      'very_low': 20
    };
    return values[consistency] || 0;
  }

  static getRatingTrendChart(ratings) {
    const trend = this.getRatingTrend(
      ratings[ratings.length - 2]?.rating || 0,
      ratings[ratings.length - 1]?.rating || 0
    );
    
    return {
      labels: ['Tendência'],
      datasets: [{
        label: 'Tendência de Rating',
        data: [this.getRatingTrendValue(trend)],
        backgroundColor: this.getRatingTrendColor(trend)
      }]
    };
  }

  static getRatingTrendValue(trend) {
    const values = {
      'improving': 100,
      'declining': 0,
      'stable': 50
    };
    return values[trend] || 50;
  }

  static getRatingSpreadChart(ratings) {
    const spread = this.getRatingSpread(ratings);
    
    return {
      labels: ['Spread'],
      datasets: [{
        label: 'Diferença de Ratings',
        data: [spread],
        backgroundColor: spread <= 1 ? '#2ecc71' : spread <= 2 ? '#f1c40f' : '#e74c3c'
      }]
    };
  }

  static getRatingBestWorstChart(ratings) {
    const best = this.getBestRating(ratings);
    const worst = this.getWorstRating(ratings);
    
    return {
      labels: [best ? best.sourceName : 'N/A', worst ? worst.sourceName : 'N/A'],
      datasets: [{
        label: 'Melhor e Pior Ratings',
        data: [best ? best.normalized : 0, worst ? worst.normalized : 0],
        backgroundColor: ['#2ecc71', '#e74c3c']
      }]
    };
  }

  static getRatingAverageChart(ratings) {
    const average = this.calculateAverageRating(ratings);
    
    return {
      labels: ['Média'],
      datasets: [{
        label: 'Rating Médio',
        data: [average],
        backgroundColor: this.getRatingColor(average)
      }]
    };
  }

  static getRatingMedianChart(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      labels: ['Mediana'],
      datasets: [{
        label: 'Rating Mediano',
        data: [stats.median],
        backgroundColor: this.getRatingColor(stats.median)
      }]
    };
  }

  static getRatingStdDevChart(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      labels: ['Desvio Padrão'],
      datasets: [{
        label: 'Variabilidade dos Ratings',
        data: [stats.stdDev],
        backgroundColor: stats.stdDev <= 1 ? '#2ecc71' : stats.stdDev <= 2 ? '#f1c40f' : '#e74c3c'
      }]
    };
  }

  static getRatingMinMaxChart(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      labels: ['Mínimo', 'Máximo'],
      datasets: [{
        label: 'Ratings Extremos',
        data: [stats.min, stats.max],
        backgroundColor: ['#3498db', '#e74c3c']
      }]
    };
  }

  static getRatingCountChart(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      labels: ['Fontes'],
      datasets: [{
        label: 'Número de Fontes',
        data: [stats.count],
        backgroundColor: '#3498db'
      }]
    };
  }

  static getRatingOverallChart(ratings) {
    const average = this.calculateAverageRating(ratings);
    const stats = this.getRatingStatistics(ratings);
    const consistency = this.getRatingConsistency(ratings);
    const confidence = this.getRatingConfidence(ratings);
    
    return {
      labels: ['Média', 'Consistência', 'Confiança'],
      datasets: [{
        label: 'Visão Geral',
        data: [
          average,
          this.getRatingConsistencyValue(consistency),
          this.getRatingConfidenceValue(confidence)
        ],
        backgroundColor: [
          this.getRatingColor(average),
          this.getRatingConsistencyColor(consistency),
          this.getRatingConfidenceColor(confidence)
        ]
      }]
    };
  }

  static getRatingDetailedChart(ratings) {
    const detailed = {
      average: this.calculateAverageRating(ratings),
      stats: this.getRatingStatistics(ratings),
      consistency: this.getRatingConsistency(ratings),
      confidence: this.getRatingConfidence(ratings),
      best: this.getBestRating(ratings),
      worst: this.getWorstRating(ratings),
      spread: this.getRatingSpread(ratings),
      trend: this.getRatingTrend(
        ratings[ratings.length - 2]?.rating || 0,
        ratings[ratings.length - 1]?.rating || 0
      ),
      distribution: this.getRatingDistribution(ratings),
      history: this.getRatingHistory(ratings, 10)
    };

    return detailed;
  }

  static getRatingSummary(ratings) {
    const average = this.calculateAverageRating(ratings);
    const stats = this.getRatingStatistics(ratings);
    const consistency = this.getRatingConsistency(ratings);
    const confidence = this.getRatingConfidence(ratings);
    const best = this.getBestRating(ratings);
    const worst = this.getWorstRating(ratings);
    const spread = this.getRatingSpread(ratings);
    const trend = this.getRatingTrend(
      ratings[ratings.length - 2]?.rating || 0,
      ratings[ratings.length - 1]?.rating || 0
    );

    return {
      average: parseFloat(average),
      stats: stats,
      consistency: consistency,
      confidence: confidence,
      best: best,
      worst: worst,
      spread: spread,
      trend: trend,
      formattedAverage: this.formatRating(average),
      averageColor: this.getRatingColor(average),
      averageIcon: this.getRatingIcon(average),
      averageDescription: this.getRatingDescription(average),
      averageEmoji: this.getRatingEmoji(average),
      consistencyLabel: this.getRatingConsistencyLabel(consistency),
      consistencyColor: this.getRatingConsistencyColor(consistency),
      consistencyIcon: this.getRatingConsistencyIcon(consistency),
      confidenceLabel: this.getRatingConfidenceLabel(confidence),
      confidenceColor: this.getRatingConfidenceColor(confidence),
      confidenceIcon: this.getRatingConfidenceIcon(confidence),
      bestLabel: best ? `${best.sourceName}: ${this.formatRating(best.originalRating, this.getRatingSourceMaxRating(best.source))}` : 'N/A',
      worstLabel: worst ? `${worst.sourceName}: ${this.formatRating(worst.originalRating, this.getRatingSourceMaxRating(worst.source))}` : 'N/A',
      spreadLabel: `${spread.toFixed(2)}`,
      trendLabel: this.getRatingTrendLabel(trend),
      trendColor: this.getRatingTrendColor(trend),
      trendIcon: this.getRatingTrendIcon(trend)
    };
  }

  static getRatingRecommendation(ratings) {
    const summary = this.getRatingSummary(ratings);
    
    if (summary.average >= 8) {
      return {
        type: 'excellent',
        title: 'Filme Excelente!',
        message: 'Este filme tem uma avaliação muito alta. Vale a pena assistir!',
        action: 'watch_now',
        priority: 'high'
      };
    } else if (summary.average >= 7) {
      return {
        type: 'good',
        title: 'Filme Bom',
        message: 'Este filme tem uma avaliação boa. Recomendado para assistir.',
        action: 'add_to_watchlist',
        priority: 'medium'
      };
    } else if (summary.average >= 6) {
      return {
        type: 'average',
        title: 'Filme Médio',
        message: 'Este filme tem uma avaliação média. Pode ser interessante.',
        action: 'consider_watching',
        priority: 'low'
      };
    } else if (summary.average >= 5) {
      return {
        type: 'below_average',
        title: 'Abaixo da Média',
        message: 'Este filme tem uma avaliação abaixo da média. Talvez não valha a pena.',
        action: 'skip_or_borrow',
        priority: 'low'
      };
    } else {
      return {
        type: 'poor',
        title: 'Filme Ruim',
        message: 'Este filme tem uma avaliação ruim. Evite assistir.',
        action: 'avoid_watching',
        priority: 'medium'
      };
    }
  }

  static getRatingInsights(ratings) {
    const summary = this.getRatingSummary(ratings);
    const recommendation = this.getRatingRecommendation(ratings);
    
    return {
      summary: summary,
      recommendation: recommendation,
      insights: [
        {
          type: 'consistency',
          title: 'Consistência das Avaliações',
          message: `As avaliações são ${summary.consistencyLabel.toLowerCase()} entre as diferentes fontes.`,
          color: summary.consistencyColor,
          icon: summary.consistencyIcon
        },
        {
          type: 'confidence',
          title: 'Confiança nas Avaliações',
          message: `O nível de confiança nas avaliações é ${summary.confidenceLabel.toLowerCase()}.`,
          color: summary.confidenceColor,
          icon: summary.confidenceIcon
        },
        {
          type: 'spread',
          title: 'Variação de Avaliações',
          message: `Há uma variação de ${summary.spreadLabel} pontos entre as avaliações.`,
          color: summary.spread <= 1 ? '#2ecc71' : summary.spread <= 2 ? '#f1c40f' : '#e74c3c',
          icon: summary.spread <= 1 ? '✅' : summary.spread <= 2 ? '⚠️' : '❌'
        },
        {
          type: 'trend',
          title: 'Tendência de Avaliações',
          message: `As avaliações estão ${summary.trendLabel.toLowerCase()}.`,
          color: summary.trendColor,
          icon: summary.trendIcon
        }
      ]
    };
  }

  static async getRatingAlerts(ratings) {
    const alerts = [];
    const summary = this.getRatingSummary(ratings);
    
    // Alerta de alta avaliação
    if (summary.average >= 8) {
      alerts.push({
        type: 'high_rating',
        title: 'Avaliação Alta',
        message: `Este filme tem uma avaliação média de ${summary.formattedAverage}. Muito bem avaliado!`,
        priority: 'high',
        color: '#2ecc71',
        icon: '🏆'
      });
    }
    
    // Alerta de baixa consistência
    if (summary.consistency === 'low' || summary.consistency === 'very_low') {
      alerts.push({
        type: 'low_consistency',
        title: 'Baixa Consistência',
        message: 'As avaliações variam muito entre as diferentes fontes.',
        priority: 'medium',
        color: '#e67e22',
        icon: '⚠️'
      });
    }
    
    // Alerta de baixa confiança
    if (summary.confidence === 'low' || summary.confidence === 'none') {
      alerts.push({
        type: 'low_confidence',
        title: 'Baixa Confiança',
        message: 'Poucas fontes avaliaram este filme. A avaliação pode não ser confiável.',
        priority: 'medium',
        color: '#e74c3c',
        icon: '❌'
      });
    }
    
    // Alerta de grande variação
    if (summary.spread > 3) {
      alerts.push({
        type: 'high_spread',
        title: 'Grande Variação',
        message: 'Há uma grande diferença entre as avaliações. As opiniões divergem bastante.',
        priority: 'medium',
        color: '#e67e22',
        icon: '⚠️'
      });
    }
    
    // Alerta de tendência negativa
    if (summary.trend === 'declining') {
      alerts.push({
        type: 'declining_trend',
        title: 'Tendência Negativa',
        message: 'As avaliações estão diminuindo recentemente.',
        priority: 'low',
        color: '#e74c3c',
        icon: '📉'
      });
    }
    
    return alerts;
  }

  static async getRatingSuggestions(ratings) {
    const suggestions = [];
    const summary = this.getRatingSummary(ratings);
    
    // Sugestão baseada na média
    if (summary.average >= 8) {
      suggestions.push({
        type: 'watch_now',
        title: 'Assista Agora',
        message: 'Este filme é excelente. Adicione à sua lista de assistidos!',
        action: 'mark_as_watched',
        priority: 'high'
      });
    } else if (summary.average >= 7) {
      suggestions.push({
        type: 'add_to_watchlist',
        title: 'Adicionar à Watchlist',
        message: 'Este filme é bom. Adicione à sua watchlist para assistir depois.',
        action: 'add_to_watchlist',
        priority: 'medium'
      });
    } else if (summary.average >= 6) {
      suggestions.push({
        type: 'consider_watching',
        title: 'Considerar Assistir',
        message: 'Este filme é mediano. Pode ser interessante dependendo do seu gosto.',
        action: 'add_to_watchlist',
        priority: 'low'
      });
    } else {
      suggestions.push({
        type: 'avoid_watching',
        title: 'Evitar Assistir',
        message: 'Este filme tem avaliação baixa. Talvez seja melhor evitar.',
        action: 'remove_from_watchlist',
        priority: 'low'
      });
    }
    
    // Sugestão baseada na consistência
    if (summary.consistency === 'low' || summary.consistency === 'very_low') {
      suggestions.push({
        type: 'check_other_sources',
        title: 'Verificar Outras Fontes',
        message: 'As avaliações variam muito. Verifique outras fontes antes de decidir.',
        action: 'search_more_ratings',
        priority: 'medium'
      });
    }
    
    // Sugestão baseada na confiança
    if (summary.confidence === 'low' || summary.confidence === 'none') {
      suggestions.push({
        type: 'wait_for_more_ratings',
        title: 'Aguardar Mais Avaliações',
        message: 'Poucas fontes avaliaram este filme. Aguarde mais avaliações.',
        action: 'check_later',
        priority: 'medium'
      });
    }
    
    return suggestions;
  }

  static async getRatingComparisonReport(ratings) {
    const comparison = this.getRatingComparison(ratings);
    const summary = this.getRatingSummary(ratings);
    
    return {
      comparison: comparison,
      summary: summary,
      best: summary.best,
      worst: summary.worst,
      average: summary.average,
      formattedAverage: summary.formattedAverage,
      averageColor: summary.averageColor,
      averageIcon: summary.averageIcon,
      averageDescription: summary.averageDescription,
      averageEmoji: summary.averageEmoji,
      consistency: summary.consistency,
      consistencyLabel: summary.consistencyLabel,
      consistencyColor: summary.consistencyColor,
      consistencyIcon: summary.consistencyIcon,
      confidence: summary.confidence,
      confidenceLabel: summary.confidenceLabel,
      confidenceColor: summary.confidenceColor,
      confidenceIcon: summary.confidenceIcon,
      spread: summary.spread,
      spreadLabel: summary.spreadLabel,
      trend: summary.trend,
      trendLabel: summary.trendLabel,
      trendColor: summary.trendColor,
      trendIcon: summary.trendIcon,
      bestLabel: summary.bestLabel,
      worstLabel: summary.worstLabel
    };
  }

  static async getRatingDetailedReport(ratings) {
    const detailed = this.getRatingDetailedChart(ratings);
    const insights = this.getRatingInsights(ratings);
    const alerts = await this.getRatingAlerts(ratings);
    const suggestions = await this.getRatingSuggestions(ratings);
    const comparison = await this.getRatingComparisonReport(ratings);
    
    return {
      detailed: detailed,
      insights: insights,
      alerts: alerts,
      suggestions: suggestions,
      comparison: comparison,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingHistoryReport(ratings, days = 30) {
    const history = this.getRatingHistory(ratings, 100);
    const recentHistory = history.filter(r => {
      const ratingDate = new Date(r.checked_at);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return ratingDate >= cutoffDate;
    });
    
    const stats = this.getRatingStatistics(recentHistory);
    const distribution = this.getRatingDistribution(recentHistory);
    const trend = this.getRatingTrend(
      recentHistory[recentHistory.length - 2]?.rating || 0,
      recentHistory[recentHistory.length - 1]?.rating || 0
    );
    
    return {
      history: recentHistory,
      stats: stats,
      distribution: distribution,
      trend: trend,
      days: days,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingDistributionReport(ratings) {
    const distribution = this.getRatingDistribution(ratings);
    const stats = this.getRatingStatistics(ratings);
    
    return {
      distribution: distribution,
      stats: stats,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingConsensusReport(ratings) {
    const consensus = this.getRatingConsensus(ratings);
    const confidence = this.getRatingConfidence(ratings);
    const consistency = this.getRatingConsistency(ratings);
    
    return {
      consensus: consensus,
      confidence: confidence,
      consistency: consistency,
      confidenceLabel: this.getRatingConfidenceLabel(confidence),
      confidenceColor: this.getRatingConfidenceColor(confidence),
      confidenceIcon: this.getRatingConfidenceIcon(confidence),
      consistencyLabel: this.getRatingConsistencyLabel(consistency),
      consistencyColor: this.getRatingConsistencyColor(consistency),
      consistencyIcon: this.getRatingConsistencyIcon(consistency),
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingSourcesReport(ratings) {
    const sources = Object.keys(ratings);
    const sourceDetails = sources.map(source => ({
      id: source,
      name: this.getRatingSourceName(source),
      icon: this.getRatingSourceIcon(source),
      color: this.getRatingSourceColor(source),
      rating: ratings[source],
      normalizedRating: this.normalizeRatingToStandard(ratings[source], source),
      maxRating: this.getRatingSourceMaxRating(source),
      formattedRating: this.formatRating(ratings[source], this.getRatingSourceMaxRating(source)),
      url: this.getRatingSourceUrl(source, ratings.movieId)
    }));
    
    return {
      sources: sourceDetails,
      totalSources: sources.length,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingTrendReport(ratings) {
    const trend = this.getRatingTrend(
      ratings[ratings.length - 2]?.rating || 0,
      ratings[ratings.length - 1]?.rating || 0
    );
    
    return {
      trend: trend,
      trendLabel: this.getRatingTrendLabel(trend),
      trendColor: this.getRatingTrendColor(trend),
      trendIcon: this.getRatingTrendIcon(trend),
      currentRating: ratings[ratings.length - 1]?.rating || 0,
      previousRating: ratings[ratings.length - 2]?.rating || 0,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingSpreadReport(ratings) {
    const spread = this.getRatingSpread(ratings);
    
    return {
      spread: spread,
      spreadLabel: spread.toFixed(2),
      spreadColor: spread <= 1 ? '#2ecc71' : spread <= 2 ? '#f1c40f' : '#e74c3c',
      spreadIcon: spread <= 1 ? '✅' : spread <= 2 ? '⚠️' : '❌',
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingBestWorstReport(ratings) {
    const best = this.getBestRating(ratings);
    const worst = this.getWorstRating(ratings);
    
    return {
      best: best,
      worst: worst,
      bestLabel: best ? `${best.sourceName}: ${this.formatRating(best.originalRating, this.getRatingSourceMaxRating(best.source))}` : 'N/A',
      worstLabel: worst ? `${worst.sourceName}: ${this.formatRating(worst.originalRating, this.getRatingSourceMaxRating(worst.source))}` : 'N/A',
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingAverageReport(ratings) {
    const average = this.calculateAverageRating(ratings);
    const stats = this.getRatingStatistics(ratings);
    
    return {
      average: parseFloat(average),
      stats: stats,
      formattedAverage: this.formatRating(average),
      averageColor: this.getRatingColor(average),
      averageIcon: this.getRatingIcon(average),
      averageDescription: this.getRatingDescription(average),
      averageEmoji: this.getRatingEmoji(average),
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingMedianReport(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      median: stats.median,
      formattedMedian: this.formatRating(stats.median),
      medianColor: this.getRatingColor(stats.median),
      medianIcon: this.getRatingIcon(stats.median),
      medianDescription: this.getRatingDescription(stats.median),
      medianEmoji: this.getRatingEmoji(stats.median),
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingStdDevReport(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      stdDev: stats.stdDev,
      formattedStdDev: stats.stdDev.toFixed(2),
      stdDevColor: stats.stdDev <= 1 ? '#2ecc71' : stats.stdDev <= 2 ? '#f1c40f' : '#e74c3c',
      stdDevIcon: stats.stdDev <= 1 ? '✅' : stats.stdDev <= 2 ? '⚠️' : '❌',
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingMinMaxReport(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      min: stats.min,
      max: stats.max,
      formattedMin: this.formatRating(stats.min),
      formattedMax: this.formatRating(stats.max),
      minColor: this.getRatingColor(stats.min),
      maxColor: this.getRatingColor(stats.max),
      minIcon: this.getRatingIcon(stats.min),
      maxIcon: this.getRatingIcon(stats.max),
      minDescription: this.getRatingDescription(stats.min),
      maxDescription: this.getRatingDescription(stats.max),
      minEmoji: this.getRatingEmoji(stats.min),
      maxEmoji: this.getRatingEmoji(stats.max),
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingCountReport(ratings) {
    const stats = this.getRatingStatistics(ratings);
    
    return {
      count: stats.count,
      countLabel: `${stats.count} fontes`,
      countColor: stats.count >= 5 ? '#2ecc71' : stats.count >= 3 ? '#3498db' : stats.count >= 2 ? '#f1c40f' : '#e74c3c',
      countIcon: stats.count >= 5 ? '✅' : stats.count >= 3 ? '👍' : stats.count >= 2 ? '👌' : '⚠️',
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async getRatingOverallReport(ratings) {
    const summary = this.getRatingSummary(ratings);
    const insights = this.getRatingInsights(ratings);
    const alerts = await this.getRatingAlerts(ratings);
    const suggestions = await this.getRatingSuggestions(ratings);
    
    return {
      summary: summary,
      insights: insights,
      alerts: alerts,
      suggestions: suggestions,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  static async generateRatingReport(ratings, type = 'overall') {
    switch (type) {
      case 'detailed':
        return await this.getRatingDetailedReport(ratings);
      case 'history':
        return await this.getRatingHistoryReport(ratings);
      case 'distribution':
        return await this.getRatingDistributionReport(ratings);
      case 'consensus':
        return await this.getRatingConsensusReport(ratings);
      case 'sources':
        return await this.getRatingSourcesReport(ratings);
      case 'trend':
        return await this.getRatingTrendReport(ratings);
      case 'spread':
        return await this.getRatingSpreadReport(ratings);
      case 'best-worst':
        return await this.getRatingBestWorstReport(ratings);
      case 'average':
        return await this.getRatingAverageReport(ratings);
      case 'median':
        return await this.getRatingMedianReport(ratings);
      case 'std-dev':
        return await this.getRatingStdDevReport(ratings);
      case 'min-max':
        return await this.getRatingMinMaxReport(ratings);
      case 'count':
        return await this.getRatingCountReport(ratings);
      case 'overall':
      default:
        return await this.getRatingOverallReport(ratings);
    }
  }
}

module.exports = StreamingUtils;