// routes/streaming.js

const express = require('express');
const router = express.Router();
const StreamingService = require('../services/streamingService');
const { authenticate } = require('../middleware/auth');

// GET /api/streaming/movie/:movieId
router.get('/movie/:movieId', authenticate, async (req, res) => {
  try {
    const { movieId } = req.params;
    const availability = await StreamingService.checkMovieAvailability(movieId, req.user.userId);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/movie/:movieId/availability
router.get('/movie/:movieId/availability', authenticate, async (req, res) => {
  try {
    const { movieId } = req.params;
    const availability = await StreamingService.getMovieStreamingAvailability(movieId, req.user.userId);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/streaming/check-all
router.post('/check-all', authenticate, async (req, res) => {
  try {
    const results = await StreamingService.checkAllUserMovies(req.user.userId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/platform/:platformId/movies
router.get('/platform/:platformId/movies', authenticate, async (req, res) => {
  try {
    const { platformId } = req.params;
    const movies = await StreamingService.getAvailableMoviesByPlatform(req.user.userId, platformId);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/unavailable
router.get('/unavailable', authenticate, async (req, res) => {
  try {
    const movies = await StreamingService.getUnavailableMovies(req.user.userId);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const stats = await StreamingService.getPlatformStatistics(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const history = await StreamingService.getStreamingHistory(req.user.userId, parseInt(days));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/popular-platforms
router.get('/popular-platforms', authenticate, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const platforms = await StreamingService.getPopularPlatforms(req.user.userId, parseInt(limit));
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/platform/:platformId/details
router.get('/platform/:platformId/details', authenticate, async (req, res) => {
  try {
    const { platformId } = req.params;
    const details = await StreamingService.getPlatformDetails(platformId);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/platform/:platformId/search
router.get('/platform/:platformId/search', authenticate, async (req, res) => {
  try {
    const { platformId } = req.params;
    const { query, limit = 20 } = req.query;
    const results = await StreamingService.searchPlatformContent(platformId, query, parseInt(limit));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/new-releases
router.get('/new-releases', authenticate, async (req, res) => {
  try {
    const { platformId, days = 7 } = req.query;
    const releases = await StreamingService.getNewReleases(platformId, parseInt(days));
    res.json(releases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/popular
router.get('/popular', authenticate, async (req, res) => {
  try {
    const { platformId, limit = 50 } = req.query;
    const popular = await StreamingService.getPopularTitles(platformId, parseInt(limit));
    res.json(popular);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/streaming/similar/:titleId
router.get('/similar/:titleId', authenticate, async (req, res) => {
  try {
    const { titleId } = req.params;
    const { limit = 10 } = req.query;
    const similar = await StreamingService.getSimilarTitles(titleId, parseInt(limit));
    res.json(similar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/streaming/cleanup
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    await StreamingService.cleanupOldData(parseInt(days));
    res.json({ success: true, message: `Dados anteriores a ${days} dias excluídos` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;