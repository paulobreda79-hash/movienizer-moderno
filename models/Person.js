// models/Person.js

const db = require('../data/database/init');

class Person {
  static findAll() {
    const stmt = db.prepare(`SELECT * FROM people ORDER BY added_date DESC`);
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
    // Match actual database schema: id, tmdb_id, name, profile_path, biography, birth_date, death_date, place_of_birth, homepage, added_date, awards
    const stmt = db.prepare(`
      INSERT INTO people (
        name, biography, birth_date, death_date, place_of_birth, profile_path, homepage, awards
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      personData.name,
      personData.biography || null,
      personData.birth_date || null,
      personData.death_date || null,
      personData.place_of_birth || personData.birth_place || null,
      personData.profile_path || personData.image || null,
      personData.homepage || null,
      JSON.stringify(personData.awards || [])
    );

    return { id: result.lastInsertRowid, ...personData };
  }

  static update(id, personData) {
    // Build dynamic update query based on what fields are provided
    const fields = [];
    const values = [];
    
    if (personData.name !== undefined) { fields.push('name = ?'); values.push(personData.name); }
    if (personData.biography !== undefined) { fields.push('biography = ?'); values.push(personData.biography); }
    if (personData.birth_date !== undefined) { fields.push('birth_date = ?'); values.push(personData.birth_date); }
    if (personData.death_date !== undefined) { fields.push('death_date = ?'); values.push(personData.death_date); }
    if (personData.place_of_birth !== undefined) { fields.push('place_of_birth = ?'); values.push(personData.place_of_birth); }
    if (personData.birth_place !== undefined) { fields.push('place_of_birth = ?'); values.push(personData.birth_place); }
    if (personData.profile_path !== undefined) { fields.push('profile_path = ?'); values.push(personData.profile_path); }
    if (personData.image !== undefined) { fields.push('profile_path = ?'); values.push(personData.image); }
    if (personData.homepage !== undefined) { fields.push('homepage = ?'); values.push(personData.homepage); }
    if (personData.awards !== undefined) { 
      fields.push('awards = ?'); 
      values.push(JSON.stringify(personData.awards)); 
    }
    
    if (fields.length === 0) return; // Nothing to update
    
    values.push(id); // Add id for WHERE clause
    
    const stmt = db.prepare(`
      UPDATE people SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM people WHERE id = ?');
    stmt.run(id);
  }

  // These methods are kept for compatibility but won't work with current schema
  static toggleField(id, field) {
    // Note: actual schema doesn't have watched, favorite, followed fields
    console.warn(`toggleField called but field ${field} doesn't exist in schema`);
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

    if (filters.birthYear) {
      query += ' AND birth_date LIKE ?';
      params.push(`%${filters.birthYear}%`);
    }

    query += ' ORDER BY added_date DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params).map(this.parseJSONFields);
  }

  // Converte campos JSON de volta para objetos/arrays
  static parseJSONFields(person) {
    return {
      ...person,
      awards: person.awards ? JSON.parse(person.awards) : { awards: [], summary: { won: 0, nominated: 0 } },
      // Map actual schema fields to expected frontend fields
      full_name: person.name,
      birth_place: person.place_of_birth,
      image: person.profile_path,
      links: person.homepage ? { homepage: person.homepage } : {},
      movies: [],
      role: ['Actor'] // Default role
    };
  }
}

module.exports = Person;
