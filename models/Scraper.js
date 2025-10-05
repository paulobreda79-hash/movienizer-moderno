// models/Scraper.js
const db = require('../data/database/init');

class Scraper {
  static create(scraperData) {
    try {
      const stmt = db.prepare(`
        INSERT INTO scrapers (source, last_run, status, last_update)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        scraperData.source,
        scraperData.last_run,
        scraperData.status
      );

      return { id: result.lastInsertRowid, ...scraperData };
    } catch (error) {
      console.error('Erro ao criar scraper:', error);
      throw error;
    }
  }

  static updateStatus(source, status) {
    try {
      const stmt = db.prepare(`
        UPDATE scrapers
        SET status = ?, last_update = CURRENT_TIMESTAMP
        WHERE source = ?
      `);
      stmt.run(status, source);
    } catch (error) {
      console.error('Erro ao atualizar status do scraper:', error);
      throw error;
    }
  }

  static getLatestRun(source) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM scrapers
        WHERE source = ?
        ORDER BY last_run DESC
        LIMIT 1
      `);
      return stmt.get(source);
    } catch (error) {
      console.error('Erro ao obter último run do scraper:', error);
      throw error;
    }
  }

  static getAll() {
    try {
      const stmt = db.prepare('SELECT * FROM scrapers ORDER BY last_run DESC');
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter todos os scrapers:', error);
      throw error;
    }
  }

  static deleteBySource(source) {
    try {
      const stmt = db.prepare('DELETE FROM scrapers WHERE source = ?');
      return stmt.run(source);
    } catch (error) {
      console.error('Erro ao apagar scraper:', error);
      throw error;
    }
  }
}

module.exports = Scraper;
