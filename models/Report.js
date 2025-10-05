// models/Report.js

const db = require('../data/database/init');
const reportConfig = require('../config/reportConfig');

class Report {
  static create(reportData) {
    const stmt = db.prepare(`
      INSERT INTO reports (
        user_id, title, description, type, format, status,
        file_name, file_size, file_path, checksum,
        generated_at, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      reportData.user_id,
      reportData.title,
      reportData.description || '',
      reportData.type,
      reportData.format,
      reportData.status || 'pending',
      reportData.file_name || null,
      reportData.file_size || 0,
      reportData.file_path || null,
      reportData.checksum || null,
      reportData.generated_at || null,
      reportData.expires_at || null,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...reportData };
  }

  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static findById(reportId) {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    return stmt.get(reportId);
  }

  static update(reportId, reportData) {
    const stmt = db.prepare(`
      UPDATE reports SET
        title = ?,
        description = ?,
        type = ?,
        format = ?,
        status = ?,
        file_name = ?,
        file_size = ?,
        file_path = ?,
        checksum = ?,
        generated_at = ?,
        expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      reportData.title,
      reportData.description || '',
      reportData.type,
      reportData.format,
      reportData.status || 'pending',
      reportData.file_name || null,
      reportData.file_size || 0,
      reportData.file_path || null,
      reportData.checksum || null,
      reportData.generated_at || null,
      reportData.expires_at || null,
      reportId
    );
  }

  static delete(reportId) {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    stmt.run(reportId);
  }

  static getPendingReports() {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE status = 'pending' 
      ORDER BY created_at ASC
    `);
    return stmt.all();
  }

  static getCompletedReports(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? AND status = 'completed'
      ORDER BY generated_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getFailedReports(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? AND status = 'failed'
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getReportStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        MAX(created_at) as last_report
      FROM reports 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }

  static cleanupOldReports(days = 90) {
    const stmt = db.prepare(`
      DELETE FROM reports 
      WHERE created_at < datetime('now', '-${days} days')
    `);
    stmt.run();
  }

  static getReportsByType(userId, type) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? AND type = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, type);
  }

  static getReportsByFormat(userId, format) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? AND format = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, format);
  }

  static getReportsByDateRange(userId, startDate, endDate) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? 
      AND created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, startDate, endDate);
  }

  static getReportTypes(userId) {
    const stmt = db.prepare(`
      SELECT DISTINCT type, COUNT(*) as count
      FROM reports 
      WHERE user_id = ?
      GROUP BY type
      ORDER BY count DESC
    `);
    return stmt.all(userId);
  }

  static getReportFormats(userId) {
    const stmt = db.prepare(`
      SELECT DISTINCT format, COUNT(*) as count
      FROM reports 
      WHERE user_id = ?
      GROUP BY format
      ORDER BY count DESC
    `);
    return stmt.all(userId);
  }

  static getReportHistory(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${days} days')
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static getPopularReports(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT *, COUNT(*) as usage_count
      FROM reports 
      WHERE user_id = ?
      GROUP BY type, format
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getRecentReports(userId, limit = 5) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getReportDownloads(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? AND status = 'completed'
      ORDER BY file_size DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getReportGenerationTimes(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT *, 
        (julianday(generated_at) - julianday(created_at)) * 24 * 60 * 60 as generation_time_seconds
      FROM reports 
      WHERE user_id = ? AND status = 'completed' AND generated_at IS NOT NULL
      ORDER BY generation_time_seconds DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getReportErrors(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE user_id = ? AND status = 'failed'
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getReportSuccessRate(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM reports 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }

  static getReportSizeStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_reports,
        SUM(file_size) as total_size,
        AVG(file_size) as average_size,
        MAX(file_size) as largest_report,
        MIN(file_size) as smallest_report
      FROM reports 
      WHERE user_id = ? AND status = 'completed' AND file_size > 0
    `);
    return stmt.get(userId);
  }

  static getReportFormatDistribution(userId) {
    const stmt = db.prepare(`
      SELECT format, COUNT(*) as count
      FROM reports 
      WHERE user_id = ?
      GROUP BY format
      ORDER BY count DESC
    `);
    return stmt.all(userId);
  }

  static getReportTypeDistribution(userId) {
    const stmt = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM reports 
      WHERE user_id = ?
      GROUP BY type
      ORDER BY count DESC
    `);
    return stmt.all(userId);
  }

  static getReportMonthlyStats(userId, months = 12) {
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${months} months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `);
    return stmt.all(userId);
  }

  static getReportWeeklyStats(userId, weeks = 4) {
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y-%W', created_at) as week,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${weeks * 7} days')
      GROUP BY strftime('%Y-%W', created_at)
      ORDER BY week DESC
    `);
    return stmt.all(userId);
  }

  static getReportDailyStats(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportHourlyStats(userId, hours = 24) {
    const stmt = db.prepare(`
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${hours} hours')
      GROUP BY strftime('%H', created_at)
      ORDER BY hour ASC
    `);
    return stmt.all(userId);
  }

  static getReportQuarterlyStats(userId, quarters = 4) {
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y', created_at) || '-Q' || ((strftime('%m', created_at) - 1) / 3 + 1) as quarter,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${quarters * 3} months')
      GROUP BY strftime('%Y', created_at) || '-Q' || ((strftime('%m', created_at) - 1) / 3 + 1)
      ORDER BY quarter DESC
    `);
    return stmt.all(userId);
  }

  static getReportYearlyStats(userId, years = 5) {
    const stmt = db.prepare(`
      SELECT 
        strftime('%Y', created_at) as year,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= datetime('now', '-${years} years')
      GROUP BY strftime('%Y', created_at)
      ORDER BY year DESC
    `);
    return stmt.all(userId);
  }

  static getReportCategoryDistribution(userId) {
    const stmt = db.prepare(`
      SELECT 
        CASE 
          WHEN type LIKE '%movie%' THEN 'movies'
          WHEN type LIKE '%person%' THEN 'people'
          WHEN type LIKE '%streaming%' THEN 'streaming'
          WHEN type LIKE '%recommend%' THEN 'recommendations'
          WHEN type LIKE '%activity%' THEN 'activity'
          WHEN type LIKE '%analytic%' THEN 'analytics'
          ELSE 'other'
        END as category,
        COUNT(*) as count
      FROM reports 
      WHERE user_id = ?
      GROUP BY category
      ORDER BY count DESC
    `);
    return stmt.all(userId);
  }

  static getReportSuccessTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportFailureTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        ROUND(COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*), 2) as failure_rate
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportGenerationTimeTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        AVG((julianday(generated_at) - julianday(created_at)) * 24 * 60 * 60) as average_generation_time_seconds
      FROM reports 
      WHERE user_id = ? 
      AND status = 'completed' 
      AND generated_at IS NOT NULL
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportSizeTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        AVG(file_size) as average_file_size
      FROM reports 
      WHERE user_id = ? 
      AND status = 'completed' 
      AND file_size > 0
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportFrequencyTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as report_count
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportPopularityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        type,
        COUNT(*) as usage_count,
        MAX(created_at) as last_used
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY type
      ORDER BY usage_count DESC
      LIMIT 10
    `);
    return stmt.all(userId);
  }

  static getReportEfficiencyTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        ROUND(AVG((julianday(generated_at) - julianday(created_at)) * 24 * 60 * 60), 2) as average_generation_time_seconds,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate,
        AVG(file_size) as average_file_size
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportQualityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        ROUND(AVG(file_size), 2) as average_file_size,
        ROUND(MAX(file_size), 2) as max_file_size,
        ROUND(MIN(file_size), 2) as min_file_size
      FROM reports 
      WHERE user_id = ? 
      AND status = 'completed' 
      AND file_size > 0
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportConsistencyTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportPerformanceTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        ROUND(AVG((julianday(generated_at) - julianday(created_at)) * 24 * 60 * 60), 2) as average_generation_time_seconds,
        ROUND(AVG(file_size), 2) as average_file_size,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportReliabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as reliability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportAvailabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as available_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unavailable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as availability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportStabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as stable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unstable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as stability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportScalabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        SUM(file_size) as total_data_processed,
        AVG(file_size) as average_data_per_report,
        ROUND(SUM(file_size) * 100.0 / (SELECT SUM(file_size) FROM reports WHERE user_id = ?), 2) as scalability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId, userId);
  }

  static getReportMaintainabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as maintainable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unmaintainable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as maintainability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportSecurityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as secure_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as insecure_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as security_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportUsabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as usable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unusable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as usability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportAccessibilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as accessible_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as inaccessible_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as accessibility_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportCompatibilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as compatible_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as incompatible_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as compatibility_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportInteroperabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as interoperable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_interoperable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as interoperability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportPortabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as portable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_portable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as portability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportExtensibilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as extensible_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_extensible_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as extensibility_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportModularityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as modular_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_modular_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as modularity_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportReusabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as reusable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_reusable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as reusability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportTestabilityTrend(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as testable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_testable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as testability_percentage
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportMaintainabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as maintainable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unmaintainable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as maintainability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportReliabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as reliable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unreliable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as reliability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportPerformanceIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        ROUND(AVG((julianday(generated_at) - julianday(created_at)) * 24 * 60 * 60), 2) as average_generation_time_seconds,
        ROUND(AVG(file_size), 2) as average_file_size,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as performance_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportSecurityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as secure_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as insecure_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as security_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportUsabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as usable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as unusable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as usability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportAccessibilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as accessible_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as inaccessible_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as accessibility_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportCompatibilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as compatible_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as incompatible_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as compatibility_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportInteroperabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as interoperable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_interoperable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as interoperability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportPortabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as portable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_portable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as portability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportExtensibilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as extensible_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_extensible_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as extensibility_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportModularityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as modular_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_modular_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as modularity_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportReusabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as reusable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_reusable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as reusability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }

  static getReportTestabilityIndex(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as day,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as testable_reports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as non_testable_reports,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as testability_index
      FROM reports 
      WHERE user_id = ? 
      AND created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `);
    return stmt.all(userId);
  }
}

module.exports = StreamingUtils;