// ================================================
// 🤖 Rota: Inteligência Artificial (IA)
// Integra o MovieNizer com o modelo Qwen + Cache
// Autor: Paulo Santos © 2025
// ================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiController = require('../ai/aiController');
const aiTextService = require('../ai/aiTextService');

// Middleware de autenticação
router.use(authenticate);

// ================================================
// 📊 [GET] /api/ai/analyze/:movieId?refresh=true
// Gera (ou regenera) descrição, análise e resumo via IA
// ================================================
router.get('/analyze/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { refresh } = req.query;

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, error: 'ID de filme inválido.' });
    }

    const forceRefresh =
      refresh === 'true' ||
      refresh === '1' ||
      refresh === 'yes' ||
      refresh === 'on';

    console.log(`🤖 [IA] Pedido recebido: filme ID ${movieId} (refresh=${forceRefresh})`);

    const result = await aiController.analyzeMovie(movieId, forceRefresh);

    res.json({
      success: true,
      message: forceRefresh
        ? `♻️ Nova análise gerada para o filme ${movieId}.`
        : `⚡ Análise obtida (cache=${result.cached}).`,
      data: result
    });

  } catch (err) {
    console.error('❌ [IA] Erro na análise:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================
// ✍️ [POST] /api/ai/custom
// Permite enviar um prompt personalizado ao Qwen
// ================================================
router.post('/custom', async (req, res) => {
  try {
    const { prompt, variables } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt em falta no corpo da requisição.'
      });
    }

    console.log('🤖 [IA] Execução de prompt personalizado...');
    const result = await aiTextService.generateText(prompt, variables || {});

    res.json({
      success: true,
      message: '✅ Resultado do prompt personalizado gerado com sucesso.',
      data: result
    });

  } catch (err) {
    console.error('❌ [IA] Erro ao processar prompt:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================
// 🧪 [GET] /api/ai/test
// Teste rápido da ligação com o motor Qwen
// ================================================
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 [IA] Teste rápido do módulo Qwen...');
    const example = await aiTextService.generateText(
      'Gera uma frase inspiradora sobre o poder do cinema e da imaginação.'
    );

    res.json({
      success: true,
      message: 'Teste do módulo IA executado com sucesso.',
      data: example
    });

  } catch (err) {
    console.error('❌ [IA] Erro no teste:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================
// 🗑️ [DELETE] /api/ai/cache/:movieId
// Permite limpar o cache de um filme específico
// ================================================
router.delete('/cache/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, error: 'ID inválido.' });
    }

    const Cache = require('../models/RecommendationCache');
    const cached = Cache.getCache(movieId);
    if (!cached) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum cache encontrado para este filme.'
      });
    }

    const db = require('better-sqlite3');
    const path = require('path');
    const dbPath = path.join(__dirname, '..', 'data', 'database', 'movienizer.db');
    const conn = new db(dbPath);
    conn.prepare('DELETE FROM recommendation_cache WHERE movie_id = ?').run(movieId);

    res.json({
      success: true,
      message: `🗑️ Cache de IA eliminado para o filme ID ${movieId}.`
    });

  } catch (err) {
    console.error('❌ [IA] Erro ao eliminar cache:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
