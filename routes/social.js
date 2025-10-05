// routes/social.js

const express = require('express');
const router = express.Router();
const SocialService = require('../services/socialService');
const { authenticate } = require('../middleware/auth');

// GET /api/social/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await SocialService.checkSocialAPIs();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/social/share
router.post('/share', authenticate, async (req, res) => {
  try {
    const { contentType, contentId, platform, options = {} } = req.body;
    const result = await SocialService.shareContent(contentType, contentId, platform, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/share/:contentType/:contentId
router.get('/share/:contentType/:contentId', authenticate, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const stats = await SocialService.getShareStats(contentType, contentId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/top-shared
router.get('/top-shared', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topContent = await SocialService.getTopSharedContent(parseInt(limit));
    res.json(topContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/platform/:platform
router.get('/platform/:platform', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    const { limit = 10 } = req.query;
    const platformStats = await SocialService.getPlatformShareStats(platform, parseInt(limit));
    res.json(platformStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/recent-shares
router.get('/recent-shares', authenticate, async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;
    const recentShares = await SocialService.getRecentShares(parseInt(days), parseInt(limit));
    res.json(recentShares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/engagement/:contentType/:contentId
router.get('/engagement/:contentType/:contentId', authenticate, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const stats = await SocialService.getEngagementStats(contentType, contentId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/social/engagement
router.post('/engagement', authenticate, async (req, res) => {
  try {
    const { contentType, contentId, engagementType, options = {} } = req.body;
    await SocialService.recordEngagement(contentType, contentId, engagementType, options);
    res.json({ success: true, message: 'Engajamento registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/top-engaged
router.get('/top-engaged', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topContent = await SocialService.getTopEngagedContent(parseInt(limit));
    res.json(topContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/engagement-type/:engagementType
router.get('/engagement-type/:engagementType', authenticate, async (req, res) => {
  try {
    const { engagementType } = req.params;
    const { limit = 10 } = req.query;
    const engagementStats = await SocialService.getEngagementByType(engagementType, parseInt(limit));
    res.json(engagementStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/recent-engagements
router.get('/recent-engagements', authenticate, async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;
    const recentEngagements = await SocialService.getRecentEngagements(parseInt(days), parseInt(limit));
    res.json(recentEngagements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/social/cleanup
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    await SocialService.cleanupOldData(parseInt(days));
    res.json({ success: true, message: `Dados anteriores a ${days} dias excluídos` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/api/:apiId/details
router.get('/api/:apiId/details', authenticate, async (req, res) => {
  try {
    const { apiId } = req.params;
    const details = await SocialService.getApiDetails(apiId);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/api/:apiId/search
router.get('/api/:apiId/search', authenticate, async (req, res) => {
  try {
    const { apiId } = req.params;
    const { query, limit = 20 } = req.query;
    const results = await SocialService.searchApiContent(apiId, query, parseInt(limit));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/new-ratings
router.get('/new-ratings', authenticate, async (req, res) => {
  try {
    const { apiId, days = 7 } = req.query;
    const ratings = await SocialService.getNewRatings(apiId, parseInt(days));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/popular-ratings
router.get('/popular-ratings', authenticate, async (req, res) => {
  try {
    const { apiId, limit = 50 } = req.query;
    const ratings = await SocialService.getPopularRatings(apiId, parseInt(limit));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/social/similar-ratings/:title/:year
router.get('/similar-ratings/:title/:year', authenticate, async (req, res) => {
  try {
    const { title, year } = req.params;
    const { limit = 10 } = req.query;
    const ratings = await SocialService.getSimilarRatings(title, parseInt(year), parseInt(limit));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;