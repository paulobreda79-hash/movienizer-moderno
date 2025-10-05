// models/Person.js

const db = require('../data/database/init');

class Person {
  static findAll() {
    const stmt = db.prepare(`SELECT * FROM people ORDER BY created_at DESC`);
    return stmt.all().map(this.parseJSONFields);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM people WHERE id = ?');
    const person = stmt.get(id);
    return person ? this.parseJSONFields(person) : null;
  }

  static findByName(name) {
    const stmt = db.prepare('SELECT * FROM people WHERE name LIKE ?');
    return stmt.all(`%${name}%`).map(this.parseJSONFields);
  }

  static create(personData) {
    const stmt = db.prepare(`
      INSERT INTO people (
        name, full_name, birth_date, birth_place, role, height, nickname,
        biography, image, links, movies, watched, favorite, followed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      personData.name,
      personData.full_name,
      personData.birth_date,
      personData.birth_place,
      personData.role,
      personData.height,
      personData.nickname,
      personData.biography,
      personData.image,
      JSON.stringify(personData.links || []),
      JSON.stringify(personData.movies || []),
      personData.watched || 0,
      personData.favorite || 0,
      personData.followed || 0
    );

    return { id: result.lastInsertRowid, ...personData };
  }

  static update(id, personData) {
    const stmt = db.prepare(`
      UPDATE people SET
        name = ?, full_name = ?, birth_date = ?, birth_place = ?, role = ?, height = ?, nickname = ?,
        biography = ?, image = ?, links = ?, movies = ?, watched = ?, favorite = ?, followed = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      personData.name,
      personData.full_name,
      personData.birth_date,
      personData.birth_place,
      personData.role,
      personData.height,
      personData.nickname,
      personData.biography,
      personData.image,
      JSON.stringify(personData.links || []),
      JSON.stringify(personData.movies || []),
      personData.watched || 0,
      personData.favorite || 0,
      personData.followed || 0,
      id
    );
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM people WHERE id = ?');
    stmt.run(id);
  }

  static toggleField(id, field) {
    if (!['watched', 'favorite', 'followed'].includes(field)) return;
    const stmt = db.prepare(`
      UPDATE people SET ${field} = CASE WHEN ${field} = 0 THEN 1 ELSE 0 END WHERE id = ?
    `);
    stmt.run(id);
  }

  static toggleWatched(id) { return this.toggleField(id, 'watched'); }
  static toggleFavorite(id) { return this.toggleField(id, 'favorite'); }
  static toggleFollowed(id) { return this.toggleField(id, 'followed'); }

  static search(filters) {
    let query = 'SELECT * FROM people WHERE 1=1';
    const params = [];

    if (filters.name) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.birthYear) {
      query += ' AND birth_date LIKE ?';
      params.push(`%${filters.birthYear}%`);
    }

    if (filters.movieTitle) {
      query += ' AND movies LIKE ?';
      params.push(`%${filters.movieTitle}%`);
    }

    ['watched','favorite','followed'].forEach(f => {
      if (filters[f] !== undefined) {
        query += ` AND ${f} = ?`;
        params.push(filters[f] ? 1 : 0);
      }
    });

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params).map(this.parseJSONFields);
  }

  // Converte campos JSON de volta para objetos/arrays
  static parseJSONFields(person) {
    return {
      ...person,
      links: person.links ? JSON.parse(person.links) : [],
      movies: person.movies ? JSON.parse(person.movies) : []
    };
  }
}

module.exports = Person;
