// models/Critic.js

const db = require('../data/database/init');

class Critic {
  static create(ratingData) {
    const stmt = db.prepare(`
      INSERT INTO critic_ratings (
        title, year, api_source, rating_value, rating_votes,
        rating_url, last_updated, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      ratingData.title,
      ratingData.year,
      ratingData.api_source,
      ratingData.rating_value,
      ratingData.rating_votes || 0,
      ratingData.rating_url || null,
      ratingData.last_updated || new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...ratingData };
  }

  static findByTitleAndYear(title, year) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings 
      WHERE title = ? AND year = ?
      ORDER BY last_updated DESC
    `);
    return stmt.all(title, year);
  }

  static findByApiSource(apiSource) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings 
      WHERE api_source = ?
      ORDER BY last_updated DESC
    `);
    return stmt.all(apiSource);
  }

  static findById(ratingId) {
    const stmt = db.prepare('SELECT * FROM critic_ratings WHERE id = ?');
    return stmt.get(ratingId);
  }

  static update(ratingId, ratingData) {
    const stmt = db.prepare(`
      UPDATE critic_ratings SET
        title = ?,
        year = ?,
        api_source = ?,
        rating_value = ?,
        rating_votes = ?,
        rating_url = ?,
        last_updated = ?
      WHERE id = ?
    `);

    stmt.run(
      ratingData.title,
      ratingData.year,
      ratingData.api_source,
      ratingData.rating_value,
      ratingData.rating_votes || 0,
      ratingData.rating_url || null,
      ratingData.last_updated || new Date().toISOString(),
      ratingId
    );
  }

  static delete(ratingId) {
    const stmt = db.prepare('DELETE FROM critic_ratings WHERE id = ?');
    stmt.run(ratingId);
  }

  static getStatistics() {
    const stmt = db.prepare(`
      SELECT 
        api_source,
        COUNT(*) as total_ratings,
        AVG(rating_value) as average_rating,
        MAX(rating_value) as max_rating,
        MIN(rating_value) as min_rating,
        MAX(last_updated) as last_update
      FROM critic_ratings
      GROUP BY api_source
      ORDER BY total_ratings DESC
    `);
    return stmt.all();
  }

  static getHistory(days = 30) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings
      WHERE last_updated >= datetime('now', '-${days} days')
      ORDER BY last_updated DESC
    `);
    return stmt.all();
  }

  static getChanges(days = 7) {
    const stmt = db.prepare(`
      SELECT 
        title, year, api_source,
        rating_value as current_rating,
        LAG(rating_value) OVER (PARTITION BY title, year, api_source ORDER BY last_updated) as previous_rating,
        last_updated
      FROM critic_ratings
      WHERE last_updated >= datetime('now', '-${days} days')
      ORDER BY last_updated DESC
    `);
    const rows = stmt.all();

    // Filtrar apenas mudanças significativas
    const changes = rows.filter(row => 
      row.previous_rating && 
      Math.abs(row.current_rating - row.previous_rating) > 0.1
    );

    return changes;
  }

  static getTopRated(limit = 10) {
    const stmt = db.prepare(`
      SELECT 
        title, year, api_source, rating_value,
        COUNT(*) OVER (PARTITION BY title, year) as source_count
      FROM critic_ratings
      WHERE rating_value > 0
      ORDER BY rating_value DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static getWorstRated(limit = 10) {
    const stmt = db.prepare(`
      SELECT 
        title, year, api_source, rating_value,
        COUNT(*) OVER (PARTITION BY title, year) as source_count
      FROM critic_ratings
      WHERE rating_value > 0
      ORDER BY rating_value ASC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  static getDistribution() {
    const stmt = db.prepare(`
      SELECT 
        api_source,
        CAST(FLOOR(rating_value) AS INTEGER) as rating_range,
        COUNT(*) as count
      FROM critic_ratings
      WHERE rating_value > 0
      GROUP BY api_source, rating_range
      ORDER BY api_source, rating_range
    `);
    return stmt.all();
  }

  static getConsensus(title, year) {
    const stmt = db.prepare(`
      SELECT 
        title, year, api_source, rating_value,
        COUNT(*) OVER (PARTITION BY title, year) as source_count
      FROM critic_ratings
      WHERE title = ? AND year = ? AND rating_value > 0
      ORDER BY rating_value DESC
    `);
    const ratings = stmt.all(title, year);

    if (ratings.length === 0) {
      return null;
    }

    const validRatings = ratings.filter(r => r.rating_value > 0);
    if (validRatings.length === 0) {
      return null;
    }

    const sum = validRatings.reduce((acc, r) => acc + r.rating_value, 0);
    const average = sum / validRatings.length;

    return {
      title: title,
      year: year,
      consensus_rating: parseFloat(average.toFixed(2)),
      sources_count: validRatings.length,
      highest_rating: Math.max(...validRatings.map(r => r.rating_value)),
      lowest_rating: Math.min(...validRatings.map(r => r.rating_value)),
      confidence: validRatings.length >= 3 ? 'high' : 'low'
    };
  }

  static getRecommendations(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT 
        cr.title, cr.year, cr.api_source, cr.rating_value,
        COUNT(*) OVER (PARTITION BY cr.title, cr.year) as source_count,
        AVG(cr.rating_value) OVER (PARTITION BY cr.title, cr.year) as average_rating
      FROM critic_ratings cr
      INNER JOIN movies m ON cr.title = m.title AND cr.year = m.year
      WHERE m.user_id = ? AND cr.rating_value > 0
      ORDER BY cr.rating_value DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getAlerts(userId, threshold = 8.0) {
    const stmt = db.prepare(`
      SELECT 
        cr.title, cr.year, cr.api_source, cr.rating_value,
        COUNT(*) OVER (PARTITION BY cr.title, cr.year) as source_count,
        AVG(cr.rating_value) OVER (PARTITION BY cr.title, cr.year) as average_rating
      FROM critic_ratings cr
      INNER JOIN movies m ON cr.title = m.title AND cr.year = m.year
      WHERE m.user_id = ? AND cr.rating_value >= ?
      ORDER BY cr.rating_value DESC
    `);
    return stmt.all(userId, threshold);
  }

  static getInsights(userId) {
    const stmt = db.prepare(`
      SELECT cr.* 
      FROM critic_ratings cr
      INNER JOIN movies m ON cr.title = m.title AND cr.year = m.year
      WHERE m.user_id = ?
    `);
    return stmt.all(userId);
  }

  static cleanupOldData(days = 90) {
    const stmt = db.prepare(`
      DELETE FROM critic_ratings 
      WHERE last_updated < datetime('now', '-${days} days')
    `);
    stmt.run();
  }

  static getApiDetails(apiId) {
    const stmt = db.prepare('SELECT * FROM critic_ratings WHERE api_source = ?');
    return stmt.all(apiId);
  }

  static searchApiContent(apiId, query, limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings 
      WHERE api_source = ? AND title LIKE ?
      ORDER BY rating_value DESC
      LIMIT ?
    `);
    return stmt.all(apiId, `%${query}%`, limit);
  }

  static getNewRatings(apiId = null, days = 7) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings
      WHERE last_updated >= datetime('now', '-${days} days')
      ${apiId ? 'AND api_source = ?' : ''}
      ORDER BY last_updated DESC
    `);
    
    return apiId ? stmt.all(apiId) : stmt.all();
  }

  static getPopularRatings(apiId = null, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings
      WHERE rating_value > 0
      ${apiId ? 'AND api_source = ?' : ''}
      ORDER BY rating_value DESC
      LIMIT ?
    `);
    
    return apiId ? stmt.all(apiId, limit) : stmt.all(limit);
  }

  static getSimilarRatings(title, year, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM critic_ratings
      WHERE title != ? AND year = ?
      ORDER BY ABS(rating_value - (
        SELECT AVG(rating_value) 
        FROM critic_ratings 
        WHERE title = ? AND year = ?
      )) ASC
      LIMIT ?
    `);
    
    return stmt.all(title, year, title, year, limit);
  }
}

module.exports = Critic;