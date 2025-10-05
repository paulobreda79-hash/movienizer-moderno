// routes/collection.js - Versão ESM com better-sqlite3

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

// GET /api/collection - Obter toda a coleção
router.get('/', (req, res) => {
    const db = getDB();
    try {
        const stmt = db.prepare(`
            SELECT uc.*, mi.title, mi.poster_path, mi.release_date, mi.media_type, mi.vote_average
            FROM user_collections uc
            LEFT JOIN media_items mi ON uc.media_id = mi.id
            ORDER BY uc.date_added DESC
        `);
        const rows = stmt.all();
        res.json({
            success: true,
            collection: rows,
            total: rows.length
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao obter coleção:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// POST /api/collection - Adicionar item à coleção
router.post('/', (req, res) => {
    const { media_id, physical_format, storage_location, personal_rating, notes, file_path } = req.body;
    const db = getDB();
    try {
        const sql = `
            INSERT INTO user_collections (
                media_id, 
                physical_format, 
                storage_location, 
                personal_rating, 
                notes, 
                file_path
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = db.prepare(sql).run(
            media_id, 
            physical_format, 
            storage_location, 
            personal_rating, 
            notes, 
            file_path
        );
        res.json({
            success: true,
            message: '✅ Item adicionado à coleção!',
            id: result.lastInsertRowid
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao adicionar à coleção:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// PUT /api/collection/:id - Atualizar item da coleção
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { media_id, physical_format, storage_location, personal_rating, notes, file_path } = req.body;
    const db = getDB();
    try {
        const updates = [];
        const params = [];

        if (media_id !== undefined) {
            updates.push('media_id = ?');
            params.push(media_id);
        }
        if (physical_format !== undefined) {
            updates.push('physical_format = ?');
            params.push(physical_format);
        }
        if (storage_location !== undefined) {
            updates.push('storage_location = ?');
            params.push(storage_location);
        }
        if (personal_rating !== undefined) {
            updates.push('personal_rating = ?');
            params.push(personal_rating);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        if (file_path !== undefined) {
            updates.push('file_path = ?');
            params.push(file_path);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        const sql = `UPDATE user_collections SET ${updates.join(', ')} WHERE id = ?`;
        params.push(id);

        const result = db.prepare(sql).run(...params);
        res.json({
            success: true,
            message: '✅ Item atualizado!',
            changes: result.changes
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao atualizar item da coleção:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

// DELETE /api/collection/:id - Remover item da coleção
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB();
    try {
        const result = db.prepare('DELETE FROM user_collections WHERE id = ?').run(id);
        res.json({
            success: true,
            message: '✅ Item removido da coleção!',
            changes: result.changes
        });
        db.close();
    } catch (error) {
        console.error('❌ Erro ao remover item da coleção:', error);
        res.status(500).json({ error: error.message });
        db.close();
    }
});

export default router;