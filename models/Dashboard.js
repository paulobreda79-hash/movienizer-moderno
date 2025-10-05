// models/Dashboard.js

const db = require('../data/database/init');

class Dashboard {
  static create(dashboardData) {
    const stmt = db.prepare(`
      INSERT INTO dashboards (
        user_id, name, description, layout, is_public,
        allow_sharing, sharing_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dashboardData.user_id,
      dashboardData.name,
      dashboardData.description || '',
      dashboardData.layout || 'grid',
      dashboardData.is_public || 0,
      dashboardData.allow_sharing || 0,
      dashboardData.sharing_token || null,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...dashboardData };
  }

  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM dashboards 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static findById(dashboardId) {
    const stmt = db.prepare('SELECT * FROM dashboards WHERE id = ?');
    return stmt.get(dashboardId);
  }

  static update(dashboardId, dashboardData) {
    const stmt = db.prepare(`
      UPDATE dashboards SET
        name = ?,
        description = ?,
        layout = ?,
        is_public = ?,
        allow_sharing = ?,
        sharing_token = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      dashboardData.name,
      dashboardData.description,
      dashboardData.layout,
      dashboardData.is_public,
      dashboardData.allow_sharing,
      dashboardData.sharing_token,
      dashboardId
    );
  }

  static delete(dashboardId) {
    const stmt = db.prepare('DELETE FROM dashboards WHERE id = ?');
    stmt.run(dashboardId);
  }

  static createWidget(widgetData) {
    const stmt = db.prepare(`
      INSERT INTO dashboard_widgets (
        dashboard_id, widget_type, title, position_x, position_y,
        width, height, config, is_visible, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      widgetData.dashboard_id,
      widgetData.widget_type,
      widgetData.title,
      widgetData.position_x,
      widgetData.position_y,
      widgetData.width,
      widgetData.height,
      JSON.stringify(widgetData.config || {}),
      widgetData.is_visible || 1,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...widgetData };
  }

  static getWidgets(dashboardId) {
    const stmt = db.prepare(`
      SELECT * FROM dashboard_widgets 
      WHERE dashboard_id = ? 
      ORDER BY position_y, position_x
    `);
    return stmt.all(dashboardId);
  }

  static updateWidget(widgetId, widgetData) {
    const stmt = db.prepare(`
      UPDATE dashboard_widgets SET
        title = ?,
        position_x = ?,
        position_y = ?,
        width = ?,
        height = ?,
        config = ?,
        is_visible = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      widgetData.title,
      widgetData.position_x,
      widgetData.position_y,
      widgetData.width,
      widgetData.height,
      JSON.stringify(widgetData.config || {}),
      widgetData.is_visible,
      widgetId
    );
  }

  static deleteWidget(widgetId) {
    const stmt = db.prepare('DELETE FROM dashboard_widgets WHERE id = ?');
    stmt.run(widgetId);
  }

  static getSharedDashboard(token) {
    const stmt = db.prepare(`
      SELECT d.*, u.username as owner_name
      FROM dashboards d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.sharing_token = ? AND d.is_public = 1 AND d.allow_sharing = 1
    `);
    return stmt.get(token);
  }

  static generateSharingToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  static getDashboardWithData(dashboardId) {
    const dashboard = this.findById(dashboardId);
    if (!dashboard) return null;

    const widgets = this.getWidgets(dashboardId);
    return { ...dashboard, widgets };
  }

  static duplicate(dashboardId, newUserId, newName) {
    const original = this.getDashboardWithData(dashboardId);
    if (!original) return null;

    // Criar novo dashboard
    const newDashboard = this.create({
      user_id: newUserId,
      name: newName || `${original.name} (Cópia)`,
      description: original.description,
      layout: original.layout,
      is_public: 0,
      allow_sharing: 0
    });

    // Copiar widgets
    original.widgets.forEach(widget => {
      this.createWidget({
        dashboard_id: newDashboard.id,
        widget_type: widget.widget_type,
        title: widget.title,
        position_x: widget.position_x,
        position_y: widget.position_y,
        width: widget.width,
        height: widget.height,
        config: JSON.parse(widget.config || '{}'),
        is_visible: widget.is_visible
      });
    });

    return newDashboard;
  }

  static getDashboardStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_dashboards,
        COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_dashboards,
        COUNT(CASE WHEN allow_sharing = 1 THEN 1 END) as shared_dashboards,
        MAX(created_at) as last_created
      FROM dashboards 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }
}

// Criar tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS dashboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    layout TEXT DEFAULT 'grid',
    is_public BOOLEAN DEFAULT 0,
    allow_sharing BOOLEAN DEFAULT 0,
    sharing_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dashboard_id INTEGER,
    widget_type TEXT NOT NULL,
    title TEXT,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 4,
    height INTEGER DEFAULT 4,
    config TEXT DEFAULT '{}',
    is_visible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards (id)
  )
`);

module.exports = Dashboard;