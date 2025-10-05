// ================================================
// 🧠 Modelo: RecommendationCache
// Guarda respostas de IA para evitar repetições
// Autor: Paulo Santos © 2025
// ================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'movienizer.db');
const db = new Database(dbPath);

// Criação da tabela se não existir
db.prepare(`
  CREATE TABLE IF NOT EXISTS recommendation_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER UNIQUE,
    description_ai TEXT,
    analysis_ai TEXT,
    summary_ai TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/**
 * Obtém cache de IA de um filme.
 * @param {number} movieId
 * @returns {object|null}
 */
function getCache(movieId) {
  return db.prepare(`SELECT * FROM recommendation_cache WHERE movie_id = ?`).get(movieId);
}

/**
 * Guarda (ou atualiza) o cache de IA de um filme.
 * @param {number} movieId
 * @param {string} description
 * @param {string} analysis
 * @param {string} summary
 */
function saveCache(movieId, description, analysis, summary) {
  const existing = getCache(movieId);
  if (existing) {
    db.prepare(`
      UPDATE recommendation_cache
      SET description_ai = ?, analysis_ai = ?, summary_ai = ?, created_at = CURRENT_TIMESTAMP
      WHERE movie_id = ?
    `).run(description, analysis, summary, movieId);
  } else {
    db.prepare(`
      INSERT INTO recommendation_cache (movie_id, description_ai, analysis_ai, summary_ai)
      VALUES (?, ?, ?, ?)
    `).run(movieId, description, analysis, summary);
  }
}

/**
 * Apaga registos antigos (por exemplo, com mais de 30 dias).
 */
function cleanupOldCache() {
  db.prepare(`
    DELETE FROM recommendation_cache
    WHERE created_at < datetime('now', '-30 days')
  `).run();
}

module.exports = {
  getCache,
  saveCache,
  cleanupOldCache
};
