// ================================================
// 🧠 AI Controller com cache e atualização forçada
// Autor: Paulo Santos © 2025
// ================================================

const aiTextService = require('./aiTextService');
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'database', 'movienizer.db');
const db = new Database(dbPath);

const Cache = require('../models/RecommendationCache');

/**
 * Obtém dados detalhados de um filme.
 */
async function getMovieData(movieId) {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movieId);
  if (!movie) throw new Error('Filme não encontrado.');

  try {
    movie.genres = JSON.parse(movie.genres || '[]');
    movie.director = JSON.parse(movie.director || '[]');
    movie.cast = JSON.parse(movie.cast || '[]');
    movie.reviews = JSON.parse(movie.reviews || '[]');
  } catch {
    /* ignora erros de parsing */
  }
  return movie;
}

/**
 * Analisa filme com IA, usando cache e flag de refresh.
 * @param {number} movieId
 * @param {boolean} forceRefresh
 */
async function analyzeMovie(movieId, forceRefresh = false) {
  if (!forceRefresh) {
    // 🔍 Verificar cache antes
    const cached = Cache.getCache(movieId);
    if (cached) {
      console.log(`⚡ [IA] Cache encontrado para o filme ID ${movieId}`);
      return {
        description: cached.description_ai,
        analysis: cached.analysis_ai,
        summary: cached.summary_ai,
        cached: true,
        refreshed: false
      };
    }
  } else {
    console.log(`♻️ [IA] Atualização forçada solicitada para o filme ID ${movieId}`);
  }

  // 🧠 Gerar via IA (não encontrado no cache ou refresh=true)
  console.log(`🤖 [IA] Gerando nova análise para o filme ID ${movieId}...`);
  const movie = await getMovieData(movieId);

  const [description, analysis, summary] = await Promise.all([
    aiTextService.generateDescription(movie),
    aiTextService.generateAnalysis(movie),
    aiTextService.generateSummary(movie)
  ]);

  // 💾 Guardar no cache
  Cache.saveCache(movieId, description, analysis, summary);

  return {
    description,
    analysis,
    summary,
    cached: false,
    refreshed: forceRefresh
  };
}

module.exports = { analyzeMovie };
