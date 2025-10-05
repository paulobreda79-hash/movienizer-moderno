// routes/theme.js

const express = require('express');
const router = express.Router();
const ThemeService = require('../services/themeService');
const { authenticate } = require('../middleware/auth');

// GET /api/theme/current
router.get('/current', authenticate, async (req, res) => {
  try {
    const theme = await ThemeService.getUserThemePreferences(req.user.userId);
    res.json({ theme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/theme/set
router.post('/set', authenticate, async (req, res) => {
  try {
    const { themeId } = req.body;
    await ThemeService.setUserThemePreferences(req.user.userId, themeId);
    res.json({ success: true, message: 'Tema atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/theme/list
router.get('/list', authenticate, async (req, res) => {
  try {
    const themes = await ThemeService.getAvailableThemes();
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/theme/create
router.post('/create', authenticate, async (req, res) => {
  try {
    const themeData = req.body;
    const newTheme = await ThemeService.createCustomTheme(themeData);
    res.status(201).json({ success: true, theme: newTheme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/theme/:themeId
router.delete('/:themeId', authenticate, async (req, res) => {
  try {
    const { themeId } = req.params;
    await ThemeService.removeCustomTheme(themeId, req.user.userId);
    res.json({ success: true, message: 'Tema removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/theme/export/:themeId
router.get('/export/:themeId', authenticate, async (req, res) => {
  try {
    const { themeId } = req.params;
    const themeData = await ThemeService.exportTheme(themeId);
    res.json(themeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/theme/import
router.post('/import', authenticate, async (req, res) => {
  try {
    const themeData = req.body;
    const importedTheme = await ThemeService.importTheme(themeData, req.user.userId);
    res.status(201).json({ success: true, theme: importedTheme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/theme/system
router.get('/system', authenticate, async (req, res) => {
  try {
    const systemTheme = await ThemeService.getSystemThemePreference();
    res.json({ theme: systemTheme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/theme/reset
router.post('/reset', authenticate, async (req, res) => {
  try {
    await ThemeService.resetUserTheme(req.user.userId);
    res.json({ success: true, message: 'Tema redefinido para padrão' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/theme/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await ThemeService.getThemeStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;