// services/peopleService.js
const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config/config');

class PeopleService {
    constructor() {
        this.dbPath = path.join(__dirname, '..', config.database.filename);
    }

    getDB() {
        // Abrir uma nova conexão para cada operação para melhor concorrência
        const db = new Database(this.dbPath);
        // Ativar WAL para melhor concorrência
        db.pragma('journal_mode = WAL');
        return db;
    }

    // Criar ou atualizar uma pessoa na base de dados
    async upsertPerson(personData) {
        const db = this.getDB();
        const { tmdb_id, name, profile_path, biography, birth_date, death_date, place_of_birth, homepage } = personData;

        const upsertSQL = `
            INSERT INTO people (tmdb_id, name, profile_path, biography, birth_date, death_date, place_of_birth, homepage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tmdb_id) DO UPDATE SET
                name = excluded.name,
                profile_path = excluded.profile_path,
                biography = excluded.biography,
                birth_date = excluded.birth_date,
                death_date = excluded.death_date,
                place_of_birth = excluded.place_of_birth,
                homepage = excluded.homepage
        `;

        try {
            const stmt = db.prepare(upsertSQL);
            stmt.run(tmdb_id, name, profile_path, biography, birth_date, death_date, place_of_birth, homepage);
            return { success: true, message: 'Pessoa adicionada ou atualizada com sucesso.' };
        } catch (error) {
            console.error('Erro ao inserir/atualizar pessoa:', error);
            return { success: false, error: error.message };
        } finally {
            db.close();
        }
    }

    // Obter pessoa por TMDB ID
    async getPersonByTmdbId(tmdbId) {
        const db = this.getDB();
        const sql = `SELECT * FROM people WHERE tmdb_id = ?`;
        try {
            const row = db.prepare(sql).get(tmdbId);
            return row || null;
        } catch (error) {
            console.error('Erro ao obter pessoa por TMDB ID:', error);
            return null;
        } finally {
            db.close();
        }
    }

    // Obter pessoa por ID local
    async getPersonById(id) {
        const db = this.getDB();
        const sql = `SELECT * FROM people WHERE id = ?`;
        try {
            const row = db.prepare(sql).get(id);
            return row || null;
        } catch (error) {
            console.error('Erro ao obter pessoa por ID local:', error);
            return null;
        } finally {
            db.close();
        }
    }

    // Buscar pessoas por nome (LIKE)
    async searchPeopleByName(name) {
        const db = this.getDB();
        const sql = `SELECT id, tmdb_id, name, profile_path FROM people WHERE name LIKE ?`;
        try {
            const rows = db.prepare(sql).all(`%${name}%`);
            return rows;
        } catch (error) {
            console.error('Erro ao buscar pessoas por nome:', error);
            return [];
        } finally {
            db.close();
        }
    }

    // Obter todas as pessoas
    async getAllPeople(limit = 100, offset = 0) {
        const db = this.getDB();
        const sql = `SELECT id, tmdb_id, name, profile_path, birth_date, death_date FROM people ORDER BY name LIMIT ? OFFSET ?`;
        try {
            const rows = db.prepare(sql).all(limit, offset);
            return rows;
        } catch (error) {
            console.error('Erro ao obter todas as pessoas:', error);
            return [];
        } finally {
            db.close();
        }
    }

    // Obter estatísticas sobre as pessoas
    async getStats() {
        const db = this.getDB();
        try {
            const totalStmt = db.prepare(`SELECT COUNT(*) AS count FROM people`);
            const total = totalStmt.get().count;

            const byDepartmentStmt = db.prepare(`
                SELECT p.known_for_department, COUNT(*) as count
                FROM people p
                WHERE p.known_for_department IS NOT NULL
                GROUP BY p.known_for_department
                ORDER BY count DESC
            `);
            const byDepartment = byDepartmentStmt.all();

            return {
                total,
                by_department: byDepartment
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas de pessoas:', error);
            return { total: 0, by_department: [] };
        } finally {
            db.close();
        }
    }

    // Atualizar informações de uma pessoa existente
    async updatePerson(id, updateData) {
        const db = this.getDB();
        const allowedFields = ['name', 'profile_path', 'biography', 'birth_date', 'death_date', 'place_of_birth', 'homepage'];
        const fields = Object.keys(updateData).filter(key => allowedFields.includes(key));
        if (fields.length === 0) {
            return { success: false, error: 'Nenhum campo válido para atualizar.' };
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updateData[field]);
        values.push(id); // ID para WHERE

        const sql = `UPDATE people SET ${setClause} WHERE id = ?`;

        try {
            const stmt = db.prepare(sql);
            const info = stmt.run(...values);
            if (info.changes === 0) {
                return { success: false, error: 'Pessoa não encontrada.' };
            }
            return { success: true, message: 'Pessoa atualizada com sucesso.' };
        } catch (error) {
            console.error('Erro ao atualizar pessoa:', error);
            return { success: false, error: error.message };
        } finally {
            db.close();
        }
    }

    // Apagar pessoa por ID local
    async deletePerson(id) {
        const db = this.getDB();
        const sql = `DELETE FROM people WHERE id = ?`;
        try {
            const stmt = db.prepare(sql);
            const info = stmt.run(id);
            if (info.changes === 0) {
                return { success: false, error: 'Pessoa não encontrada.' };
            }
            return { success: true, message: 'Pessoa removida com sucesso.' };
        } catch (error) {
            console.error('Erro ao apagar pessoa:', error);
            return { success: false, error: error.message };
        } finally {
            db.close();
        }
    }
}

module.exports = PeopleService;