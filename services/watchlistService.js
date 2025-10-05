// services/watchlistService.js
const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config/config');
const dbPath = path.join(__dirname, '..', config.database.filename);

class WatchlistService {
    constructor() {
        this.dbPath = dbPath;
    }

    getDB() {
        return new Database(this.dbPath);
    }

    async getWatchlist(filters = {}) {
        const db = this.getDB();
        try {
            let sql = 'SELECT * FROM watchlist';
            const params = [];
            const conditions = [];

            if (filters.status) {
                conditions.push('status = ?');
                params.push(filters.status);
            }
            if (filters.priority) {
                conditions.push('priority = ?');
                params.push(filters.priority);
            }
            if (filters.media_type) {
                conditions.push('media_type = ?');
                params.push(filters.media_type);
            }

            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }

            sql += ' ORDER BY priority DESC, planned_watch_date ASC, added_at DESC';
            const rows = db.prepare(sql).all(...params);
            return rows.map(row => ({
                ...row,
                streaming_services: JSON.parse(row.streaming_services || '[]'),
                genres: JSON.parse(row.genres || '[]')
            }));
        } catch (error) {
            console.error('❌ Erro ao obter watchlist:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async addToWatchlist(item) {
        const db = this.getDB();
        try {
            const sql = `
                INSERT INTO watchlist (tmdb_id, media_type, title, poster_path, release_date, priority, notes, planned_watch_date, streaming_services, genres)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = db.prepare(sql).run(
                item.tmdb_id,
                item.media_type,
                item.title,
                item.poster_path,
                item.release_date,
                item.priority,
                item.notes,
                item.planned_watch_date,
                JSON.stringify(item.streaming_services),
                JSON.stringify(item.genres)
            );
            return { id: result.lastInsertRowid, ...item };
        } catch (error) {
            console.error('❌ Erro ao adicionar à watchlist:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async updateWatchlistItem(id, updates) {
        const db = this.getDB();
        try {
            const allowedFields = ['priority', 'status', 'notes', 'planned_watch_date'];
            const setClauses = [];
            const params = [];

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    setClauses.push(`${field} = ?`);
                    params.push(updates[field]);
                }
            });

            if (setClauses.length === 0) {
                return { id, ...updates };
            }

            const sql = `UPDATE watchlist SET ${setClauses.join(', ')} WHERE id = ?`;
            const result = db.prepare(sql).run(...params, id);
            return { id, ...updates };
        } catch (error) {
            console.error('❌ Erro ao atualizar watchlist:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async removeFromWatchlist(id) {
        const db = this.getDB();
        try {
            const sql = 'DELETE FROM watchlist WHERE id = ?';
            const result = db.prepare(sql).run(id);
            return { id, deleted: result.changes };
        } catch (error) {
            console.error('❌ Erro ao remover da watchlist:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async getWatchlistStats() {
        const db = this.getDB();
        try {
            const sql = `
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                FROM watchlist
            `;
            const result = db.prepare(sql).get();
            return result;
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            throw error;
        } finally {
            db.close();
        }
    }
}

module.exports = WatchlistService;