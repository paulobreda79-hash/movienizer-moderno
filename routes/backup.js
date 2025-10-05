// routes/backup.js

const express = require('express');
const router = express.Router();
const BackupService = require('../services/backupService');
const { authenticate } = require('../middleware/auth');

// GET /api/backup/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await BackupService.getBackupStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/backup/list
router.get('/list', authenticate, async (req, res) => {
  try {
    const backups = await BackupService.getUserBackups(req.user.userId);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/create
router.post('/create', authenticate, async (req, res) => {
  try {
    const options = req.body.options || {};
    const result = await BackupService.createBackup(req.user.userId, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/restore/:backupId
router.post('/restore/:backupId', authenticate, async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await BackupService.restoreBackup(req.user.userId, backupId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/backup/:backupId
router.delete('/:backupId', authenticate, async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await BackupService.deleteBackup(req.user.userId, backupId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/cleanup
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const result = await BackupService.cleanupOldBackups(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/backup/:backupId/download
router.get('/:backupId/download', authenticate, async (req, res) => {
  try {
    const { backupId } = req.params;
    const backup = await BackupService.getBackupById(backupId);
    
    if (!backup || backup.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    res.download(backup.location, backup.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;