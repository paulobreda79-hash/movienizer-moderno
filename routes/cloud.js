// routes/cloud.js

const express = require('express');
const router = express.Router();
const SyncService = require('../services/syncService');
const { authenticate } = require('../middleware/auth');

// GET /api/cloud/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = SyncService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cloud/sync
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { type = 'full', changes = [] } = req.body;
    
    let result;
    if (type === 'full') {
      result = await SyncService.syncAllData(req.user.userId);
    } else if (type === 'changes') {
      result = await SyncService.syncChanges(req.user.userId, changes);
    } else {
      return res.status(400).json({ error: 'Tipo de sincronização inválido' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cloud/backups
router.get('/backups', authenticate, async (req, res) => {
  try {
    const backups = await SyncService.getAvailableBackups(req.user.userId);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cloud/restore/:fileName
router.post('/restore/:fileName', authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    const result = await SyncService.restoreFromCloud(req.user.userId, fileName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cloud/backup/:fileName
router.delete('/backup/:fileName', authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    const result = await SyncService.deleteBackup(fileName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cloud/pause
router.post('/pause', authenticate, async (req, res) => {
  try {
    SyncService.pauseSync();
    res.json({ success: true, message: 'Sincronização pausada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cloud/resume
router.post('/resume', authenticate, async (req, res) => {
  try {
    SyncService.resumeSync();
    res.json({ success: true, message: 'Sincronização retomada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cloud/clear-conflicts
router.post('/clear-conflicts', authenticate, async (req, res) => {
  try {
    SyncService.clearConflicts();
    res.json({ success: true, message: 'Conflitos limpos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;