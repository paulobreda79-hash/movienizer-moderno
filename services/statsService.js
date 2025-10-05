// services/statsService.js
const { db } = require('../database/init');

class StatsService {
    // Estatísticas gerais da coleção
    async getGeneralStats() {
        const stats = {
            total_movies: db.prepare('SELECT COUNT(*) AS count FROM media_items WHERE media_type = ?').get('movie').count,
            total_tv: db.prepare('SELECT COUNT(*) AS count FROM media_items WHERE media_type = ?').get('tv').count,
            total_episodes: db.prepare('SELECT COUNT(*) AS count FROM episodes').get().count,
            total_watched_movies: db.prepare('SELECT COUNT(*) AS count FROM collection_items WHERE watched_status = ? AND (SELECT media_type FROM media_items WHERE id = collection_items.media_item_id) = ?').get('completed', 'movie').count,
            total_watched_episodes: db.prepare('SELECT COUNT(*) AS count FROM episodes WHERE watched_status = ?').get('completed').count,
            total_tags: db.prepare('SELECT COUNT(*) AS count FROM tags').get().count,
            total_people: db.prepare('SELECT COUNT(*) AS count FROM people').get().count,
        };
        return stats;
    }

    // Estatísticas por status (visto, a ver, etc.)
    async getCollectionStatusStats() {
        const stats = db.prepare(`
            SELECT
                watched_status,
                COUNT(*) as count
            FROM collection_items
            GROUP BY watched_status
        `).all();

        const statsObj = stats.reduce((acc, row) => {
            acc[row.watched_status] = row.count;
            return acc;
        }, { completed: 0, watching: 0, pending: 0, dropped: 0 });

        return statsObj;
    }

    // Géneros mais vistos
    async getGenreStats() {
        // Contar filmes/séries vistos por género
        const genres = db.prepare(`
            SELECT json_each.value AS genre, COUNT(*) AS count
            FROM collection_items, json_each((SELECT genres FROM media_items WHERE id = collection_items.media_item_id))
            WHERE collection_items.watched_status = 'completed'
            GROUP BY json_each.value
            ORDER BY count DESC
        `).all();
        return genres;
    }

    // Atores mais vistos
    async getActorStats(limit = 10) {
        const actors = db.prepare(`
            SELECT p.name, COUNT(*) AS appearances
            FROM media_people mp
            JOIN people p ON mp.person_id = p.id
            JOIN collection_items ci ON mp.media_item_id = ci.media_item_id
            WHERE mp.role = 'actor' AND ci.watched_status = 'completed'
            GROUP BY p.name
            ORDER BY appearances DESC
            LIMIT ?
        `).all(limit);
        return actors;
    }

    // Diretores mais vistos
    async getDirectorStats(limit = 10) {
        const directors = db.prepare(`
            SELECT p.name, COUNT(*) AS appearances
            FROM media_people mp
            JOIN people p ON mp.person_id = p.id
            JOIN collection_items ci ON mp.media_item_id = ci.media_item_id
            WHERE mp.role = 'director' AND ci.watched_status = 'completed'
            GROUP BY p.name
            ORDER BY appearances DESC
            LIMIT ?
        `).all(limit);
        return directors;
    }

    // Avaliações médias por género
    async getRatingByGenre() {
        const ratings = db.prepare(`
            SELECT json_each.value AS genre, AVG(ci.user_rating) AS avg_rating
            FROM collection_items ci
            JOIN media_items mi ON ci.media_item_id = mi.id
            , json_each(mi.genres)
            WHERE ci.user_rating IS NOT NULL
            GROUP BY json_each.value
            ORDER BY avg_rating DESC
        `).all();
        return ratings;
    }

    // Tempo total assistido (em minutos)
    async getTotalWatchedTime() {
        const movieTime = db.prepare(`
            SELECT SUM(mi.runtime) AS total_minutes
            FROM collection_items ci
            JOIN media_items mi ON ci.media_item_id = mi.id
            WHERE ci.watched_status = 'completed' AND mi.media_type = 'movie'
        `).get().total_minutes || 0;

        const episodeTime = db.prepare(`
            SELECT SUM(e.runtime) AS total_minutes
            FROM episodes e
            WHERE e.watched_status = 'completed'
        `).get().total_minutes || 0;

        const totalMinutes = movieTime + episodeTime;
        return {
            total_minutes: totalMinutes,
            total_hours: Math.floor(totalMinutes / 60),
            total_days: Math.floor(totalMinutes / (60 * 24))
        };
    }

    // Estatísticas completas para a UI
    async getFullStats() {
        return {
            general: await this.getGeneralStats(),
            status: await this.getCollectionStatusStats(),
            genres: await this.getGenreStats(),
            actors: await this.getActorStats(10),
            directors: await this.getDirectorStats(10),
            ratings_by_genre: await this.getRatingByGenre(),
            total_time: await this.getTotalWatchedTime()
        };
    }
}

module.exports = StatsService;