// routes/stats.js
const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// GET /api/stats/general
router.get('/general', (req, res) => {
    try {
        const stats = {
            total_movies: db.prepare('SELECT COUNT(*) AS count FROM media_items WHERE media_type = ?').get('movie').count,
            total_tv: db.prepare('SELECT COUNT(*) AS count FROM media_items WHERE media_type = ?').get('tv').count,
            total_episodes: db.prepare('SELECT COUNT(*) AS count FROM episodes').get().count,
            total_watched_movies: db.prepare('SELECT COUNT(*) AS count FROM collection_items WHERE watched_status = ? AND (SELECT media_type FROM media_items WHERE id = collection_items.media_item_id) = ?').get('completed', 'movie').count,
            total_watched_episodes: db.prepare('SELECT COUNT(*) AS count FROM episodes WHERE watched_status = ?').get('completed').count,
            total_tags: db.prepare('SELECT COUNT(*) AS count FROM tags').get().count,
            total_people: db.prepare('SELECT COUNT(*) AS count FROM people').get().count,
        };
        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas.' });
    }
});

// GET /api/stats/genres
router.get('/genres', (req, res) => {
    try {
        const genres = db.prepare(`
            SELECT json_each.value AS genre, COUNT(*) AS count
            FROM media_items, json_each(genres)
            GROUP BY json_each.value
            ORDER BY count DESC
        `).all();

        // ✅ Garantir que é sempre um array
        res.json(Array.isArray(genres) ? genres : []);
    } catch (error) {
        console.error('Erro ao obter estatísticas de géneros:', error);
        // ✅ Retornar array vazio em caso de erro
        res.status(500).json([]);
    }
});

// GET /api/stats/actors
router.get('/actors', (req, res) => {
    try {
        const actors = db.prepare(`
            SELECT p.name, COUNT(*) AS appearances
            FROM media_people mp
            JOIN people p ON mp.person_id = p.id
            WHERE mp.role = 'actor'
            GROUP BY p.name
            ORDER BY appearances DESC
            LIMIT 10
        `).all();

        // ✅ Garantir que é sempre um array
        res.json(Array.isArray(actors) ? actors : []);
    } catch (error) {
        console.error('Erro ao obter estatísticas de atores:', error);
        // ✅ Retornar array vazio em caso de erro
        res.status(500).json([]);
    }
});

module.exports = router;