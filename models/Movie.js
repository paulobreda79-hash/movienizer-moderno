// models/Movie.js

const db = require('../data/database/init');

class Movie {
  static findAll() {
    const stmt = db.prepare(`
      SELECT * FROM movies
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM movies WHERE id = ?');
    return stmt.get(id);
  }

  static findByTitle(title) {
    const stmt = db.prepare('SELECT * FROM movies WHERE title LIKE ?');
    return stmt.all(`%${title}%`);
  }

  static create(movieData) {
    const stmt = db.prepare(`
      INSERT INTO movies (
        title, year, genres, countries, studio, director, writers, composers,
        cast, rating_imdb, rating_rottentomatoes, rating_letterboxd,
        personal_rating, duration, rating_age, language, awards, plot,
        poster, trailer_url, watched, favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      movieData.title,
      movieData.year,
      JSON.stringify(movieData.genres),
      JSON.stringify(movieData.countries),
      movieData.studio,
      JSON.stringify(movieData.director),
      JSON.stringify(movieData.writers),
      JSON.stringify(movieData.composers),
      JSON.stringify(movieData.cast),
      movieData.rating_imdb,
      movieData.rating_rottentomatoes,
      movieData.rating_letterboxd,
      movieData.personal_rating,
      movieData.duration,
      movieData.rating_age,
      movieData.language,
      JSON.stringify(movieData.awards),
      movieData.plot,
      movieData.poster,
      movieData.trailer_url,
      movieData.watched || 0,
      movieData.favorite || 0
    );

    return { id: result.lastInsertRowid, ...movieData };
  }

  static update(id, movieData) {
    const stmt = db.prepare(`
      UPDATE movies SET
        title = ?,
        year = ?,
        genres = ?,
        countries = ?,
        studio = ?,
        director = ?,
        writers = ?,
        composers = ?,
        cast = ?,
        rating_imdb = ?,
        rating_rottentomatoes = ?,
        rating_letterboxd = ?,
        personal_rating = ?,
        duration = ?,
        rating_age = ?,
        language = ?,
        awards = ?,
        plot = ?,
        poster = ?,
        trailer_url = ?,
        watched = ?,
        favorite = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      movieData.title,
      movieData.year,
      JSON.stringify(movieData.genres),
      JSON.stringify(movieData.countries),
      movieData.studio,
      JSON.stringify(movieData.director),
      JSON.stringify(movieData.writers),
      JSON.stringify(movieData.composers),
      JSON.stringify(movieData.cast),
      movieData.rating_imdb,
      movieData.rating_rottentomatoes,
      movieData.rating_letterboxd,
      movieData.personal_rating,
      movieData.duration,
      movieData.rating_age,
      movieData.language,
      JSON.stringify(movieData.awards),
      movieData.plot,
      movieData.poster,
      movieData.trailer_url,
      movieData.watched || 0,
      movieData.favorite || 0,
      id
    );
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM movies WHERE id = ?');
    stmt.run(id);
  }

  static toggleWatched(id) {
    const stmt = db.prepare('UPDATE movies SET watched = NOT watched WHERE id = ?');
    stmt.run(id);
  }

  static toggleFavorite(id) {
    const stmt = db.prepare('UPDATE movies SET favorite = NOT favorite WHERE id = ?');
    stmt.run(id);
  }

  static search(filters) {
    let query = 'SELECT * FROM movies WHERE 1=1';
    const params = [];

    if (filters.title) {
      query += ' AND title LIKE ?';
      params.push(`%${filters.title}%`);
    }

    if (filters.year) {
      query += ' AND year = ?';
      params.push(filters.year);
    }

    if (filters.genre) {
      query += ' AND genres LIKE ?';
      params.push(`%${filters.genre}%`);
    }

    if (filters.director) {
      query += ' AND director LIKE ?';
      params.push(`%${filters.director}%`);
    }

    if (filters.actor) {
      query += ' AND cast LIKE ?';
      params.push(`%${filters.actor}%`);
    }

    if (filters.ratingMin) {
      query += ' AND rating_imdb >= ?';
      params.push(filters.ratingMin);
    }

    if (filters.ratingMax) {
      query += ' AND rating_imdb <= ?';
      params.push(filters.ratingMax);
    }

    if (filters.watched !== undefined) {
      query += ' AND watched = ?';
      params.push(filters.watched ? 1 : 0);
    }

    if (filters.favorite !== undefined) {
      query += ' AND favorite = ?';
      params.push(filters.favorite ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }
}

module.exports = Movie;