// routes/watchlist.js - Versão ESM (ES Modules)

import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Corrigir __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho da base de dados
const config = {
    database: {
        filename: path.join(__dirname, '..', 'database', 'movienizer.db')
    }
};

const dbPath = config.database.filename;

function getDB() {
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    return db;
}

const router = Router();

// GET /api/watchlist - Obter toda a watchlist
router.get('/', (req, res) => {
    const db = getDB();
    try {
        const stmt = db.prepare(`
            SELECT w.*, mi.title, mi.poster_path, mi.release_date, mi.media_type, mi.vote_average
            FROM watchlist w
            LEFT JOIN media_items mi ON w.media_id = mi.id
            ORDER BY w.date_added DESC
        `);
        const rows = stmt.all();
        res.json({
            success: true,
            watchlist: rows,
            total: rows.length
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao obter watchlist:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// POST /api/watchlist - Adicionar item à watchlist
router.post('/', (req, res) => {
    const { media_id, priority, status, notes, planned_watch_date } = req.body;
    const db = getDB();
    try {
        const sql = `
            INSERT INTO watchlist (
                media_id, 
                priority, 
                status, 
                notes, 
                planned_watch_date
            ) VALUES (?, ?, ?, ?, ?)
        `;
        const result = db.prepare(sql).run(
            media_id, 
            priority, 
            status, 
            notes, 
            planned_watch_date
        );
        res.json({
            success: true,
            message: '✅ Item adicionado à watchlist!',
            id: result.lastInsertRowid
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao adicionar à watchlist:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// PUT /api/watchlist/:id - Atualizar item da watchlist
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { media_id, priority, status, notes, planned_watch_date } = req.body;
    const db = getDB();
    try {
        const updates = [];
        const params = [];

        if (media_id !== undefined) {
            updates.push('media_id = ?');
            params.push(media_id);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            params.push(priority);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        if (planned_watch_date !== undefined) {
            updates.push('planned_watch_date = ?');
            params.push(planned_watch_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        const sql = `UPDATE watchlist SET ${updates.join(', ')} WHERE id = ?`;
        params.push(id);

        const result = db.prepare(sql).run(...params);
        res.json({
            success: true,
            message: '✅ Item atualizado!',
            changes: result.changes
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao atualizar item da watchlist:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// DELETE /api/watchlist/:id - Remover item da watchlist
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB();
    try {
        const result = db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
        res.json({
            success: true,
            message: '✅ Item removido da watchlist!',
            changes: result.changes
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao remover item da watchlist:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// Exportar o router como default
export default router;