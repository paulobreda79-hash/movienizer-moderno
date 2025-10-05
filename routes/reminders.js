const express = require('express');
const router = express.Router();
const ReminderService = require('../services/reminderService');
const { authenticate } = require('../middleware/auth');

// GET /api/reminders
router.get('/', authenticate, async (req, res) => {
  try {
    const reminders = await ReminderService.getUserReminders(req.user.userId);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reminders/upcoming
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const reminders = await ReminderService.getUpcomingReminders(
      req.user.userId,
      parseInt(days)
    );
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reminders/overdue
router.get('/overdue', authenticate, async (req, res) => {
  try {
    const reminders = await ReminderService.getOverdueReminders(req.user.userId);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reminders
router.post('/', authenticate, async (req, res) => {
  try {
    const reminder = await ReminderService.createReminder(req.user.userId, req.body);
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reminders/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    await ReminderService.updateReminder(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reminders/:id/complete
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    await ReminderService.completeReminder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await ReminderService.deleteReminder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;