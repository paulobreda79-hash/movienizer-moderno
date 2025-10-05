// services/collectionService.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');
const dbPath = path.join(__dirname, '..', config.database.filename);

class CollectionService {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    // Obter todos os itens da coleção
    getAll() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    uc.*, 
                    mi.title, 
                    mi.poster_path, 
                    mi.release_date, 
                    mi.media_type,
                    mi.vote_average
                FROM user_collections uc
                LEFT JOIN media_items mi ON uc.media_id = mi.id
                ORDER BY uc.date_added DESC
            `;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    // Adicionar item à coleção
    add(item) {
        return new Promise((resolve, reject) => {
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
            this.db.run(sql, [
                item.media_id,
                item.physical_format,
                item.storage_location,
                item.personal_rating,
                item.notes,
                item.file_path
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: this.lastID, ...item });
            });
        });
    }

    // Atualizar item da coleção
    update(id, updates) {
        return new Promise((resolve, reject) => {
            const setClauses = [];
            const params = [];

            if (updates.media_id !== undefined) {
                setClauses.push('media_id = ?');
                params.push(updates.media_id);
            }
            if (updates.physical_format !== undefined) {
                setClauses.push('physical_format = ?');
                params.push(updates.physical_format);
            }
            if (updates.storage_location !== undefined) {
                setClauses.push('storage_location = ?');
                params.push(updates.storage_location);
            }
            if (updates.personal_rating !== undefined) {
                setClauses.push('personal_rating = ?');
                params.push(updates.personal_rating);
            }
            if (updates.notes !== undefined) {
                setClauses.push('notes = ?');
                params.push(updates.notes);
            }
            if (updates.file_path !== undefined) {
                setClauses.push('file_path = ?');
                params.push(updates.file_path);
            }

            if (setClauses.length === 0) {
                reject(new Error('Nenhum campo para atualizar'));
                return;
            }

            const sql = `UPDATE user_collections SET ${setClauses.join(', ')} WHERE id = ?`;
            params.push(id);

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id, changes: this.changes, ...updates });
            });
        });
    }

    // Remover item da coleção
    remove(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM user_collections WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }
}

module.exports = new CollectionService();