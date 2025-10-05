const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    const notifications = await NotificationService.getUserNotifications(
      req.user.userId,
      { limit: parseInt(limit), unreadOnly: unreadOnly === 'true' }
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await NotificationService.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/upcoming
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const notifications = await NotificationService.getRecentByUserId(
      req.user.userId,
      parseInt(days)
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;