// routes/offline.js

const express = require('express');
const router = express.Router();
const OfflineService = require('../services/offlineService');
const { authenticate } = require('../middleware/auth');

// GET /api/offline/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const isOffline = await OfflineService.isOfflineMode();
    const stats = await OfflineService.getLocalDataStats();
    
    res.json({
      is_offline: isOffline,
      stats: stats,
      last_sync: await OfflineService.getFromLocalStorage('lastSync') || 'Nunca'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/enable
router.post('/enable', authenticate, async (req, res) => {
  try {
    const result = await OfflineService.enableOfflineMode();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/disable
router.post('/disable', authenticate, async (req, res) => {
  try {
    const result = await OfflineService.disableOfflineMode();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync
router.post('/sync', authenticate, async (req, res) => {
  try {
    const result = await OfflineService.syncDataWithServer();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/movies
router.post('/sync/movies', authenticate, async (req, res) => {
  try {
    const { movies } = req.body;
    const result = await OfflineService.syncMoviesWithServer(movies);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/people
router.post('/sync/people', authenticate, async (req, res) => {
  try {
    const { people } = req.body;
    const result = await OfflineService.syncPeopleWithServer(people);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/ratings
router.post('/sync/ratings', authenticate, async (req, res) => {
  try {
    const { ratings } = req.body;
    const result = await OfflineService.syncRatingsWithServer(ratings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/watchlist
router.post('/sync/watchlist', authenticate, async (req, res) => {
  try {
    const { watchlist } = req.body;
    const result = await OfflineService.syncWatchlistWithServer(watchlist);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/favorites
router.post('/sync/favorites', authenticate, async (req, res) => {
  try {
    const { favorites } = req.body;
    const result = await OfflineService.syncFavoritesWithServer(favorites);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/reminders
router.post('/sync/reminders', authenticate, async (req, res) => {
  try {
    const { reminders } = req.body;
    const result = await OfflineService.syncRemindersWithServer(reminders);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/notifications
router.post('/sync/notifications', authenticate, async (req, res) => {
  try {
    const { notifications } = req.body;
    const result = await OfflineService.syncNotificationsWithServer(notifications);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/settings
router.post('/sync/settings', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;
    const result = await OfflineService.syncSettingsWithServer(settings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/activity-logs
router.post('/sync/activity-logs', authenticate, async (req, res) => {
  try {
    const { activityLogs } = req.body;
    const result = await OfflineService.syncActivityLogsWithServer(activityLogs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/backups
router.post('/sync/backups', authenticate, async (req, res) => {
  try {
    const { backups } = req.body;
    const result = await OfflineService.syncBackupsWithServer(backups);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/streaming
router.post('/sync/streaming', authenticate, async (req, res) => {
  try {
    const { streaming } = req.body;
    const result = await OfflineService.syncStreamingWithServer(streaming);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/sync/recommendations
router.post('/sync/recommendations', authenticate, async (req, res) => {
  try {
    const { recommendations } = req.body;
    const result = await OfflineService.syncRecommendationsWithServer(recommendations);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/data/:dataType
router.get('/data/:dataType', authenticate, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { key = null } = req.query;
    
    const data = await OfflineService.loadDataLocally(dataType, key);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/data/:dataType
router.post('/data/:dataType', authenticate, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { data } = req.body;
    
    const result = await OfflineService.saveDataLocally(dataType, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/offline/data/:dataType/:key
router.put('/data/:dataType/:key', authenticate, async (req, res) => {
  try {
    const { dataType, key } = req.params;
    const { data } = req.body;
    
    const result = await OfflineService.updateDataLocally(dataType, key, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/offline/data/:dataType/:key
router.delete('/data/:dataType/:key', authenticate, async (req, res) => {
  try {
    const { dataType, key } = req.params;
    
    const result = await OfflineService.deleteDataLocally(dataType, key);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/clear
router.post('/clear', authenticate, async (req, res) => {
  try {
    const { dataType = null } = req.body;
    
    const result = await OfflineService.clearLocalData(dataType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await OfflineService.getLocalDataStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/backup/create
router.post('/backup/create', authenticate, async (req, res) => {
  try {
    const result = await OfflineService.createLocalBackup(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/backup/restore
router.post('/backup/restore', authenticate, async (req, res) => {
  try {
    const { fileInput } = req.body;
    const result = await OfflineService.restoreLocalBackup(req.user.userId, fileInput);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offline/cleanup
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    await OfflineService.cleanupOldData(parseInt(days));
    res.json({ success: true, message: `Dados anteriores a ${days} dias excluídos` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/api/:apiId/details
router.get('/api/:apiId/details', authenticate, async (req, res) => {
  try {
    const { apiId } = req.params;
    const details = await OfflineService.getApiDetails(apiId);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/api/:apiId/search
router.get('/api/:apiId/search', authenticate, async (req, res) => {
  try {
    const { apiId } = req.params;
    const { query, limit = 20 } = req.query;
    const results = await OfflineService.searchApiContent(apiId, query, parseInt(limit));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/new-ratings
router.get('/new-ratings', authenticate, async (req, res) => {
  try {
    const { apiId, days = 7 } = req.query;
    const ratings = await OfflineService.getNewRatings(apiId, parseInt(days));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/popular-ratings
router.get('/popular-ratings', authenticate, async (req, res) => {
  try {
    const { apiId, limit = 50 } = req.query;
    const ratings = await OfflineService.getPopularRatings(apiId, parseInt(limit));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offline/similar-ratings/:title/:year
router.get('/similar-ratings/:title/:year', authenticate, async (req, res) => {
  try {
    const { title, year } = req.params;
    const { limit = 10 } = req.query;
    const ratings = await OfflineService.getSimilarRatings(title, parseInt(year), parseInt(limit));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;