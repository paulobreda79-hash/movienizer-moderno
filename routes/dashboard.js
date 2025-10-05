// routes/dashboard.js

const express = require('express');
const router = express.Router();
const DashboardService = require('../services/dashboardService');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const dashboards = await DashboardService.getUserDashboards(req.user.userId);
    res.json(dashboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dashboard
router.post('/', authenticate, async (req, res) => {
  try {
    const dashboard = await DashboardService.createDashboard(req.user.userId, req.body);
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/:dashboardId
router.get('/:dashboardId', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.getDashboard(dashboardId);
    
    if (dashboard.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/dashboard/:dashboardId
router.put('/:dashboardId', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.getDashboard(dashboardId);
    
    if (dashboard.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await DashboardService.updateDashboard(dashboardId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/dashboard/:dashboardId
router.delete('/:dashboardId', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.getDashboard(dashboardId);
    
    if (dashboard.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await DashboardService.deleteDashboard(dashboardId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/:dashboardId/widgets
router.get('/:dashboardId/widgets', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.getDashboard(dashboardId);
    
    if (dashboard.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const widgets = await DashboardService.getDashboardWidgets(dashboardId);
    res.json(widgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dashboard/:dashboardId/widgets
router.post('/:dashboardId/widgets', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await DashboardService.getDashboard(dashboardId);
    
    if (dashboard.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const widget = await DashboardService.createWidget(dashboardId, req.body);
    res.status(201).json(widget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/dashboard/widget/:widgetId
router.put('/widget/:widgetId', authenticate, async (req, res) => {
  try {
    const { widgetId } = req.params;
    await DashboardService.updateWidget(widgetId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/dashboard/widget/:widgetId
router.delete('/widget/:widgetId', authenticate, async (req, res) => {
  try {
    const { widgetId } = req.params;
    await DashboardService.deleteWidget(widgetId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/widget/:widgetType/data
router.get('/widget/:widgetType/data', authenticate, async (req, res) => {
  try {
    const { widgetType } = req.params;
    const { config = '{}' } = req.query;
    const parsedConfig = JSON.parse(config);
    
    const data = await DashboardService.getWidgetData(req.user.userId, widgetType, parsedConfig);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dashboard/:dashboardId/share
router.post('/:dashboardId/share', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const result = await DashboardService.shareDashboard(dashboardId, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/shared/:token
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const dashboard = await DashboardService.getSharedDashboard(token);
    res.json(dashboard);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// POST /api/dashboard/:dashboardId/duplicate
router.post('/:dashboardId/duplicate', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { newName } = req.body;
    const newDashboard = await DashboardService.duplicateDashboard(dashboardId, req.user.userId, newName);
    res.status(201).json(newDashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await DashboardService.getDashboardStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/:dashboardId/export
router.get('/:dashboardId/export', authenticate, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { format = 'json' } = req.query;
    
    const dashboard = await DashboardService.getDashboard(dashboardId);
    if (dashboard.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const exportedData = await DashboardService.exportDashboard(dashboardId, format);
    
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-${dashboardId}.${format}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;