// routes/critic.js

const express = require('express');
const router = express.Router();
const CriticService = require('../services/criticService');
const { authenticate } = require('../middleware/auth');

// GET /api/critic/movie/:title/:year
router.get('/movie/:title/:year', authenticate, async (req, res) => {
  try {
    const { title, year } = req.params;
    const { apis = null } = req.query;
    
    const selectedApis = apis ? apis.split(',') : null;
    const ratings = await CriticService.checkMovieRatings(title, parseInt(year), selectedApis);
    
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/movie/:title/:year/ratings
router.get('/movie/:title/:year/ratings', authenticate, async (req, res) => {
  try {
    const { title, year } = req.params;
    const ratings = await CriticService.getMovieRatings(title, parseInt(year));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/critic/update-all
router.post('/update-all', authenticate, async (req, res) => {
  try {
    const results = await CriticService.updateAllMovieRatings();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const stats = await CriticService.getRatingStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const history = await CriticService.getRatingHistory(parseInt(days));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/changes
router.get('/changes', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const changes = await CriticService.getRatingChanges(parseInt(days));
    res.json(changes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/top-rated
router.get('/top-rated', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topRated = await CriticService.getTopRatedMovies(parseInt(limit));
    res.json(topRated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/worst-rated
router.get('/worst-rated', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const worstRated = await CriticService.getWorstRatedMovies(parseInt(limit));
    res.json(worstRated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/distribution
router.get('/distribution', authenticate, async (req, res) => {
  try {
    const distribution = await CriticService.getRatingDistribution();
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/consensus/:title/:year
router.get('/consensus/:title/:year', authenticate, async (req, res) => {
  try {
    const { title, year } = req.params;
    const consensus = await CriticService.getRatingConsensus(title, parseInt(year));
    res.json(consensus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await CriticService.getRatingRecommendations(req.user.userId, parseInt(limit));
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { threshold = 8.0 } = req.query;
    const alerts = await CriticService.getRatingAlerts(req.user.userId, parseFloat(threshold));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/insights
router.get('/insights', authenticate, async (req, res) => {
  try {
    const insights = await CriticService.getRatingInsights(req.user.userId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/critic/cleanup
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const { days = 90 } = req.body;
    await CriticService.cleanupOldData(parseInt(days));
    res.json({ success: true, message: `Dados anteriores a ${days} dias excluídos` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/api/:apiId/details
router.get('/api/:apiId/details', authenticate, async (req, res) => {
  try {
    const { apiId } = req.params;
    const details = await CriticService.getApiDetails(apiId);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/api/:apiId/search
router.get('/api/:apiId/search', authenticate, async (req, res) => {
  try {
    const { apiId } = req.params;
    const { query, limit = 20 } = req.query;
    const results = await CriticService.searchApiContent(apiId, query, parseInt(limit));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/new-ratings
router.get('/new-ratings', authenticate, async (req, res) => {
  try {
    const { apiId, days = 7 } = req.query;
    const ratings = await CriticService.getNewRatings(apiId, parseInt(days));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/popular-ratings
router.get('/popular-ratings', authenticate, async (req, res) => {
  try {
    const { apiId, limit = 50 } = req.query;
    const ratings = await CriticService.getPopularRatings(apiId, parseInt(limit));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/critic/similar-ratings/:title/:year
router.get('/similar-ratings/:title/:year', authenticate, async (req, res) => {
  try {
    const { title, year } = req.params;
    const { limit = 10 } = req.query;
    const ratings = await CriticService.getSimilarRatings(title, parseInt(year), parseInt(limit));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;