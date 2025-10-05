// models/Tag.js

const db = require('../data/database/init');
const tagConfig = require('../config/tagConfig');

class Tag {
  static create(tagData) {
    const stmt = db.prepare(`
      INSERT INTO tags (
        user_id, name, category, parent_id, color, icon,
        description, is_active, usage_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tagData.user_id,
      tagData.name,
      tagData.category || 'custom',
      tagData.parent_id || null,
      tagData.color || tagConfig.colors.default,
      tagData.icon || tagConfig.icons.default,
      tagData.description || '',
      tagData.is_active !== undefined ? tagData.is_active : 1,
      tagData.usage_count || 0,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...tagData };
  }

  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? 
      ORDER BY category, name
    `);
    return stmt.all(userId);
  }

  static findById(tagId) {
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?');
    return stmt.get(tagId);
  }

  static findByNameAndUserId(name, userId) {
    const stmt = db.prepare('SELECT * FROM tags WHERE name = ? AND user_id = ?');
    return stmt.get(name, userId);
  }

  static findByCategory(category, userId) {
    const stmt = db.prepare('SELECT * FROM tags WHERE category = ? AND user_id = ? ORDER BY name');
    return stmt.all(category, userId);
  }

  static findByParent(parentId, userId) {
    const stmt = db.prepare('SELECT * FROM tags WHERE parent_id = ? AND user_id = ? ORDER BY name');
    return stmt.all(parentId, userId);
  }

  static update(tagId, tagData) {
    const stmt = db.prepare(`
      UPDATE tags SET
        name = ?,
        category = ?,
        parent_id = ?,
        color = ?,
        icon = ?,
        description = ?,
        is_active = ?,
        usage_count = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      tagData.name,
      tagData.category,
      tagData.parent_id,
      tagData.color,
      tagData.icon,
      tagData.description,
      tagData.is_active,
      tagData.usage_count,
      tagId
    );
  }

  static delete(tagId) {
    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    stmt.run(tagId);
  }

  static incrementUsage(tagId, increment = 1) {
    const stmt = db.prepare(`
      UPDATE tags SET 
        usage_count = usage_count + ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(increment, tagId);
  }

  static decrementUsage(tagId, decrement = 1) {
    const stmt = db.prepare(`
      UPDATE tags SET 
        usage_count = MAX(0, usage_count - ?), 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(decrement, tagId);
  }

  static getPopularTags(userId, limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1 AND usage_count > 0
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getUnusedTags(userId) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1 AND usage_count = 0
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static getTagHierarchy(userId, rootTagId = null) {
    const stmt = db.prepare(`
      WITH RECURSIVE tag_tree AS (
        SELECT *, 0 as level
        FROM tags 
        WHERE user_id = ? AND parent_id IS NULL
        UNION ALL
        SELECT t.*, tt.level + 1
        FROM tags t
        JOIN tag_tree tt ON t.parent_id = tt.id
        WHERE t.user_id = ? AND tt.level < ?
      )
      SELECT * FROM tag_tree
      ORDER BY level, name
    `);
    return stmt.all(userId, userId, tagConfig.validation.tagHierarchy.maxDepth);
  }

  static getTagStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_tags,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_tags,
        COUNT(CASE WHEN usage_count > 0 THEN 1 END) as used_tags,
        COUNT(CASE WHEN usage_count = 0 THEN 1 END) as unused_tags,
        SUM(usage_count) as total_usage,
        AVG(usage_count) as avg_usage,
        MAX(usage_count) as max_usage,
        MIN(usage_count) as min_usage
      FROM tags 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }

  static getTagUsageByCategory(userId) {
    const stmt = db.prepare(`
      SELECT 
        category,
        COUNT(*) as tag_count,
        SUM(usage_count) as total_usage,
        AVG(usage_count) as avg_usage
      FROM tags 
      WHERE user_id = ?
      GROUP BY category
      ORDER BY tag_count DESC
    `);
    return stmt.all(userId);
  }

  static getTagUsageHistory(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        t.name,
        t.category,
        t.usage_count,
        t.created_at,
        t.updated_at
      FROM tags t
      WHERE t.user_id = ? 
      AND t.updated_at >= datetime('now', '-${days} days')
      ORDER BY t.updated_at DESC
    `);
    return stmt.all(userId);
  }

  static searchTags(query, userId, limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? 
      AND (name LIKE ? OR description LIKE ?)
      ORDER BY usage_count DESC, name
      LIMIT ?
    `);
    return stmt.all(userId, `%${query}%`, `%${query}%`, limit);
  }

  static getRelatedTags(tagId, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt1 ON t.id = mt1.tag_id
      INNER JOIN movie_tags mt2 ON mt1.movie_id = mt2.movie_id
      WHERE mt2.tag_id = ? AND t.id != ? AND t.user_id = ?
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);
    return stmt.all(tagId, tagId, userId, limit);
  }

  static getTagCloud(userId, limit = 50) {
    const stmt = db.prepare(`
      SELECT 
        id, name, category, color, icon, usage_count,
        CASE 
          WHEN usage_count >= 50 THEN 'xxl'
          WHEN usage_count >= 30 THEN 'xl'
          WHEN usage_count >= 20 THEN 'lg'
          WHEN usage_count >= 10 THEN 'md'
          WHEN usage_count >= 5 THEN 'sm'
          ELSE 'xs'
        END as size_class
      FROM tags 
      WHERE user_id = ? AND is_active = 1 AND usage_count > 0
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static validateTagName(name) {
    if (!name || name.length < tagConfig.validation.tagName.minLength) {
      throw new Error(`Nome da tag deve ter pelo menos ${tagConfig.validation.tagName.minLength} caracteres`);
    }

    if (name.length > tagConfig.validation.tagName.maxLength) {
      throw new Error(`Nome da tag deve ter no máximo ${tagConfig.validation.tagName.maxLength} caracteres`);
    }

    if (!tagConfig.validation.tagName.allowedChars.test(name)) {
      throw new Error('Nome da tag contém caracteres inválidos');
    }

    const reservedWords = tagConfig.validation.tagName.reservedWords;
    if (reservedWords.some(word => name.toLowerCase().includes(word))) {
      throw new Error('Nome da tag contém palavra reservada');
    }

    return true;
  }

  static validateTagDescription(description) {
    if (description && description.length > tagConfig.validation.tagDescription.maxLength) {
      throw new Error(`Descrição da tag deve ter no máximo ${tagConfig.validation.tagDescription.maxLength} caracteres`);
    }

    return true;
  }

  static validateTagHierarchy(parentId, userId) {
    if (!parentId) return true;

    const parentTag = this.findById(parentId);
    if (!parentTag || parentTag.user_id !== userId) {
      throw new Error('Tag pai não encontrada ou acesso negado');
    }

    // Verificar profundidade máxima
    let depth = 0;
    let currentParentId = parentId;
    while (currentParentId && depth < tagConfig.validation.tagHierarchy.maxDepth) {
      const parent = this.findById(currentParentId);
      if (!parent) break;
      currentParentId = parent.parent_id;
      depth++;
    }

    if (depth >= tagConfig.validation.tagHierarchy.maxDepth) {
      throw new Error(`Hierarquia de tags excede profundidade máxima de ${tagConfig.validation.tagHierarchy.maxDepth}`);
    }

    return true;
  }

  static normalizeTagName(name) {
    return name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s\-_]/gi, '')
      .replace(/\s+/g, ' ');
  }

  static getTagSuggestions(query, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT name, category, usage_count
      FROM tags 
      WHERE user_id = ? 
      AND name LIKE ?
      ORDER BY usage_count DESC, name
      LIMIT ?
    `);
    return stmt.all(userId, `${query}%`, limit);
  }

  static getTagAutocomplete(query, userId, limit = 5) {
    const stmt = db.prepare(`
      SELECT DISTINCT name
      FROM tags 
      WHERE user_id = ? 
      AND name LIKE ?
      ORDER BY usage_count DESC, name
      LIMIT ?
    `);
    return stmt.all(userId, `%${query}%`, limit).map(row => row.name);
  }

  static getTagCategories(userId) {
    const stmt = db.prepare(`
      SELECT DISTINCT category, COUNT(*) as tag_count
      FROM tags 
      WHERE user_id = ?
      GROUP BY category
      ORDER BY tag_count DESC
    `);
    return stmt.all(userId);
  }

  static getTagColors() {
    return Object.entries(tagConfig.colors).map(([name, color]) => ({
      name: name,
      color: color
    }));
  }

  static getTagIcons() {
    return Object.entries(tagConfig.icons).map(([name, icon]) => ({
      name: name,
      icon: icon
    }));
  }

  static getTagCategoryDetails(categoryId) {
    return tagConfig.categories[categoryId] || {
      id: categoryId,
      name: categoryId,
      icon: '🏷️',
      color: '#3498db',
      description: 'Categoria personalizada'
    };
  }

  static getTagCategoryName(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return category.name;
  }

  static getTagCategoryIcon(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return category.icon;
  }

  static getTagCategoryColor(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return category.color;
  }

  static getTagCategoryDescription(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return category.description;
  }

  static getTagCategoryAllowSubcategories(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return category.allowSubcategories !== undefined ? category.allowSubcategories : true;
  }

  static getTagCategoryMaxDepth(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return category.maxDepth || 3;
  }

  static getTagCategoryDefaults(categoryId) {
    const category = this.getTagCategoryDetails(categoryId);
    return {
      color: category.color || tagConfig.colors.default,
      icon: category.icon || tagConfig.icons.default
    };
  }

  static getTagDefaults(categoryId) {
    return this.getTagCategoryDefaults(categoryId);
  }

  static getTagCategoryOptions() {
    return Object.entries(tagConfig.categories).map(([id, category]) => ({
      id: id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      description: category.description
    }));
  }

  static getTagUsageByMovie(movieId, userId) {
    const stmt = db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE mt.movie_id = ? AND t.user_id = ?
      ORDER BY t.usage_count DESC
    `);
    return stmt.all(movieId, userId);
  }

  static getTagUsageByPerson(personId, userId) {
    const stmt = db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN person_tags pt ON t.id = pt.tag_id
      WHERE pt.person_id = ? AND t.user_id = ?
      ORDER BY t.usage_count DESC
    `);
    return stmt.all(personId, userId);
  }

  static assignTagToMovie(movieId, tagId, userId) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO movie_tags (movie_id, tag_id, user_id, assigned_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(movieId, tagId, userId, new Date().toISOString());
    this.incrementUsage(tagId);
  }

  static removeTagFromMovie(movieId, tagId, userId) {
    const stmt = db.prepare(`
      DELETE FROM movie_tags 
      WHERE movie_id = ? AND tag_id = ? AND user_id = ?
    `);
    stmt.run(movieId, tagId, userId);
    this.decrementUsage(tagId);
  }

  static assignTagToPerson(personId, tagId, userId) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO person_tags (person_id, tag_id, user_id, assigned_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(personId, tagId, userId, new Date().toISOString());
    this.incrementUsage(tagId);
  }

  static removeTagFromPerson(personId, tagId, userId) {
    const stmt = db.prepare(`
      DELETE FROM person_tags 
      WHERE person_id = ? AND tag_id = ? AND user_id = ?
    `);
    stmt.run(personId, tagId, userId);
    this.decrementUsage(tagId);
  }

  static getMovieTags(movieId, userId) {
    const stmt = db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE mt.movie_id = ? AND t.user_id = ?
      ORDER BY t.usage_count DESC
    `);
    return stmt.all(movieId, userId);
  }

  static getPersonTags(personId, userId) {
    const stmt = db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN person_tags pt ON t.id = pt.tag_id
      WHERE pt.person_id = ? AND t.user_id = ?
      ORDER BY t.usage_count DESC
    `);
    return stmt.all(personId, userId);
  }

  static getMoviesWithTag(tagId, userId) {
    const stmt = db.prepare(`
      SELECT m.*
      FROM movies m
      INNER JOIN movie_tags mt ON m.id = mt.movie_id
      WHERE mt.tag_id = ? AND m.user_id = ?
      ORDER BY m.title
    `);
    return stmt.all(tagId, userId);
  }

  static getPeopleWithTag(tagId, userId) {
    const stmt = db.prepare(`
      SELECT p.*
      FROM people p
      INNER JOIN person_tags pt ON p.id = pt.person_id
      WHERE pt.tag_id = ? AND p.user_id = ?
      ORDER BY p.name
    `);
    return stmt.all(tagId, userId);
  }

  static getTagRelationships(tagId, userId) {
    const movies = this.getMoviesWithTag(tagId, userId);
    const people = this.getPeopleWithTag(tagId, userId);
    
    return {
      movies: movies,
      people: people,
      totalMovies: movies.length,
      totalPeople: people.length
    };
  }

  static getTagSuggestionsByContext(context, userId, limit = 10) {
    let query = '';
    let orderBy = 'usage_count DESC';

    switch (context) {
      case 'movie':
        query = `
          SELECT t.*, COUNT(mt.movie_id) as context_usage
          FROM tags t
          LEFT JOIN movie_tags mt ON t.id = mt.tag_id
          WHERE t.user_id = ?
          GROUP BY t.id
          ORDER BY context_usage DESC, t.usage_count DESC
        `;
        break;
      case 'person':
        query = `
          SELECT t.*, COUNT(pt.person_id) as context_usage
          FROM tags t
          LEFT JOIN person_tags pt ON t.id = pt.tag_id
          WHERE t.user_id = ?
          GROUP BY t.id
          ORDER BY context_usage DESC, t.usage_count DESC
        `;
        break;
      case 'genre':
        query = `
          SELECT * FROM tags 
          WHERE user_id = ? AND category = 'genre'
          ORDER BY usage_count DESC
        `;
        break;
      case 'mood':
        query = `
          SELECT * FROM tags 
          WHERE user_id = ? AND category = 'mood'
          ORDER BY usage_count DESC
        `;
        break;
      case 'theme':
        query = `
          SELECT * FROM tags 
          WHERE user_id = ? AND category = 'theme'
          ORDER BY usage_count DESC
        `;
        break;
      default:
        query = `
          SELECT * FROM tags 
          WHERE user_id = ?
          ORDER BY usage_count DESC
        `;
    }

    const stmt = db.prepare(query);
    return stmt.all(userId).slice(0, limit);
  }

  static getTagSuggestionsByMovie(movieId, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE mt.movie_id != ? AND t.user_id = ?
      AND mt.movie_id IN (
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id IN (
          SELECT tag_id 
          FROM movie_tags 
          WHERE movie_id = ?
        )
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);
    return stmt.all(movieId, userId, movieId, limit);
  }

  static getTagSuggestionsByPerson(personId, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN person_tags pt ON t.id = pt.tag_id
      WHERE pt.person_id != ? AND t.user_id = ?
      AND pt.person_id IN (
        SELECT pt2.person_id 
        FROM person_tags pt2 
        WHERE pt2.tag_id IN (
          SELECT tag_id 
          FROM person_tags 
          WHERE person_id = ?
        )
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);
    return stmt.all(personId, userId, personId, limit);
  }

  static getTagSuggestionsBySimilarity(tagName, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT *, 
        LENGTH(name) - LENGTH(REPLACE(LOWER(name), LOWER(?), '')) as similarity_score
      FROM tags 
      WHERE user_id = ? AND name != ?
      ORDER BY similarity_score DESC, usage_count DESC
      LIMIT ?
    `);
    return stmt.all(tagName, userId, tagName, limit);
  }

  static getTagSuggestionsByPopularity(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getTagSuggestionsByRecency(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getTagSuggestionsByCategory(category, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND category = ? AND is_active = 1
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, category, limit);
  }

  static getTagSuggestionsByUsageRange(minUsage, maxUsage, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      AND usage_count BETWEEN ? AND ?
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, minUsage, maxUsage, limit);
  }

  static getTagSuggestionsByDateRange(startDate, endDate, userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      AND created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, startDate, endDate, limit);
  }

  static getTagSuggestionsByModificationDate(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getTagSuggestionsByActivity(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      ORDER BY updated_at DESC, usage_count DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getTagSuggestionsByCombination(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.id NOT IN (${placeholders})
      AND mt.movie_id IN (
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByExclusion(excludedTags, userId, limit = 10) {
    if (!excludedTags || excludedTags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = excludedTags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE user_id = ? AND is_active = 1
      AND id NOT IN (${placeholders})
      ORDER BY usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...excludedTags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByInclusion(includedTags, userId, limit = 10) {
    if (!includedTags || includedTags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = includedTags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id IN (${placeholders})
        GROUP BY mt2.movie_id
        HAVING COUNT(DISTINCT mt2.tag_id) = ?
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...includedTags, includedTags.length, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByIntersection(tags1, tags2, userId, limit = 10) {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders1 = tags1.map(() => '?').join(',');
    const placeholders2 = tags2.map(() => '?').join(',');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders1})
        INTERSECT
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id IN (${placeholders2})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags1, ...tags2, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByUnion(tags1, tags2, userId, limit = 10) {
    if (!tags1 && !tags2) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    let allTags = [];
    if (tags1) allTags = [...allTags, ...tags1];
    if (tags2) allTags = [...allTags, ...tags2];

    if (allTags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = allTags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...allTags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDifference(tags1, tags2, userId, limit = 10) {
    if (!tags1 || tags1.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders1 = tags1.map(() => '?').join(',');
    let query = `
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders1})
    `;

    if (tags2 && tags2.length > 0) {
      const placeholders2 = tags2.map(() => '?').join(',');
      query += `
        EXCEPT
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id IN (${placeholders2})
      `;
    }

    query += `
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `;

    const params = tags2 && tags2.length > 0 
      ? [userId, ...tags1, ...tags2, limit]
      : [userId, ...tags1, limit];

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getTagSuggestionsBySymmetricDifference(tags1, tags2, userId, limit = 10) {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders1 = tags1.map(() => '?').join(',');
    const placeholders2 = tags2.map(() => '?').join(',');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        (SELECT mt1.movie_id 
         FROM movie_tags mt1 
         WHERE mt1.tag_id IN (${placeholders1}))
        EXCEPT
        (SELECT mt2.movie_id 
         FROM movie_tags mt2 
         WHERE mt2.tag_id IN (${placeholders2}))
        UNION
        (SELECT mt3.movie_id 
         FROM movie_tags mt3 
         WHERE mt3.tag_id IN (${placeholders2}))
        EXCEPT
        (SELECT mt4.movie_id 
         FROM movie_tags mt4 
         WHERE mt4.tag_id IN (${placeholders1}))
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags1, ...tags2, ...tags2, ...tags1, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCartesianProduct(tags1, tags2, userId, limit = 10) {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders1 = tags1.map(() => '?').join(',');
    const placeholders2 = tags2.map(() => '?').join(',');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders1})
        UNION
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id IN (${placeholders2})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags1, ...tags2, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByComplement(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id NOT IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySubset(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        GROUP BY mt1.movie_id
        HAVING COUNT(DISTINCT mt1.tag_id) = ?
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, tags.length, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySuperset(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        GROUP BY mt1.movie_id
        HAVING COUNT(DISTINCT mt1.tag_id) >= ?
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, tags.length, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDisjoint(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id NOT IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByEquivalent(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        GROUP BY mt1.movie_id
        HAVING COUNT(DISTINCT mt1.tag_id) = ?
      )
      AND mt.movie_id NOT IN (
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id NOT IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, tags.length, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByOverlapping(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        INTERSECT
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id NOT IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPartition(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        UNION
        SELECT mt2.movie_id 
        FROM movie_tags mt2 
        WHERE mt2.tag_id NOT IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCover(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByIndependent(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id NOT IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDependent(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMutuallyExclusive(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id NOT IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        GROUP BY mt1.movie_id
        HAVING COUNT(DISTINCT mt1.tag_id) > 1
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCollectivelyExhaustive(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPartiallyOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTotallyOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at ASC
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByWellOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 1
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDenseOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 2
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySparseOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 5
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByLexicographicOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.name ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseLexicographicOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.name DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByChronologicalOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY mt.assigned_at DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseChronologicalOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY mt.assigned_at ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByNumericalOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseNumericalOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAlphabeticalOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.name ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseAlphabeticalOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.name DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByLengthOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY LENGTH(t.name) ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseLengthOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY LENGTH(t.name) DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByFrequencyOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseFrequencyOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByRecencyOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY mt.assigned_at DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReverseRecencyOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY mt.assigned_at ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPopularityOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReversePopularityOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count ASC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByRandomOrdered(tags, userId, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY RANDOM()
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCustomOrdered(tags, userId, orderBy, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${orderBy}
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMultiCriteriaOrdered(tags, userId, criteria, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const orderByClause = criteria.map(c => `${c.field} ${c.direction}`).join(', ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${orderByClause}
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByWeightedOrdered(tags, userId, weights, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const weightClause = Object.entries(weights)
      .map(([field, weight]) => `${field} * ${weight}`)
      .join(' + ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${weightClause} DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByNormalizedOrdered(tags, userId, normalization, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const normalizedFields = Object.entries(normalization)
      .map(([field, range]) => `(${field} - ${range.min}) / (${range.max} - ${range.min})`)
      .join(', ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${normalizedFields} DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByScaledOrdered(tags, userId, scaling, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const scaledFields = Object.entries(scaling)
      .map(([field, factor]) => `${field} * ${factor}`)
      .join(', ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${scaledFields} DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTransformedOrdered(tags, userId, transformations, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const transformedFields = Object.entries(transformations)
      .map(([field, transformation]) => `${transformation}(${field})`)
      .join(', ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${transformedFields} DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAggregatedOrdered(tags, userId, aggregation, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const aggregatedField = `${aggregation.function}(${aggregation.fields.join(', ')})`;
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${aggregatedField} DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByFilteredOrdered(tags, userId, filter, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const filterClause = Object.entries(filter)
      .map(([field, condition]) => `${field} ${condition.operator} ${condition.value}`)
      .join(' AND ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND ${filterClause}
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByGroupedOrdered(tags, userId, grouping, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const groupedFields = grouping.fields.join(', ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      GROUP BY ${groupedFields}
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByJoinedOrdered(tags, userId, joins, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const placeholders = tags.map(() => '?').join(',');
    const joinClauses = joins.map(join => 
      `INNER JOIN ${join.table} ${join.alias} ON ${join.condition}`
    ).join(' ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      ${joinClauses}
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByUnionedOrdered(tags, userId, unions, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const unionQueries = unions.map(union => 
      `(SELECT ${union.fields.join(', ')} FROM ${union.table} WHERE ${union.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${unionQueries})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByIntersectedOrdered(tags, userId, intersections, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const intersectionQueries = intersections.map(intersection => 
      `(SELECT ${intersection.fields.join(', ')} FROM ${intersection.table} WHERE ${intersection.condition})`
    ).join(' INTERSECT ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${intersectionQueries})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByExceptedOrdered(tags, userId, exceptions, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const exceptionQueries = exceptions.map(exception => 
      `(SELECT ${exception.fields.join(', ')} FROM ${exception.table} WHERE ${exception.condition})`
    ).join(' EXCEPT ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${exceptionQueries})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySymmetricExceptedOrdered(tags, userId, symmetricExceptions, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const symmetricExceptionQueries = symmetricExceptions.map(se => 
      `((SELECT ${se.fields.join(', ')} FROM ${se.table} WHERE ${se.condition}) 
       EXCEPT 
       (SELECT ${se.fields.join(', ')} FROM ${se.table} WHERE ${se.condition2})) 
       UNION 
       ((SELECT ${se.fields.join(', ')} FROM ${se.table} WHERE ${se.condition2}) 
       EXCEPT 
       (SELECT ${se.fields.join(', ')} FROM ${se.table} WHERE ${se.condition}))`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${symmetricExceptionQueries})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCartesianProductOrdered(tags, userId, cartesianProducts, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const cartesianProductQueries = cartesianProducts.map(cp => 
      `(SELECT ${cp.fields.join(', ')} FROM ${cp.table1} CROSS JOIN ${cp.table2})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${cartesianProductQueries})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySubqueryOrdered(tags, userId, subqueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const subqueryClauses = subqueries.map(sq => 
      `${sq.field} IN (SELECT ${sq.subField} FROM ${sq.subTable} WHERE ${sq.condition})`
    ).join(' AND ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND ${subqueryClauses}
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCorrelatedSubqueryOrdered(tags, userId, correlatedSubqueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const correlatedSubqueryClauses = correlatedSubqueries.map(cs => 
      `EXISTS (SELECT 1 FROM ${cs.subTable} WHERE ${cs.correlation})`
    ).join(' AND ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND ${correlatedSubqueryClauses}
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByWindowFunctionOrdered(tags, userId, windowFunctions, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const windowFunctionClauses = windowFunctions.map(wf => 
      `${wf.function}(${wf.fields.join(', ')}) OVER (${wf.partition ? `PARTITION BY ${wf.partition}` : ''} ${wf.order ? `ORDER BY ${wf.order}` : ''})`
    ).join(', ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY ${windowFunctionClauses} DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByRecursiveQueryOrdered(tags, userId, recursiveQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const recursiveQueryClauses = recursiveQueries.map(rq => 
      `WITH RECURSIVE ${rq.withClause} SELECT ${rq.selectClause} FROM ${rq.fromClause} WHERE ${rq.whereClause}`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${recursiveQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCommonTableExpressionOrdered(tags, userId, ctes, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const cteClauses = ctes.map(cte => 
      `WITH ${cte.name} AS (${cte.definition})`
    ).join(' ');
    
    const stmt = db.prepare(`
      ${cteClauses}
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMaterializedViewOrdered(tags, userId, materializedViews, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const mvQueries = materializedViews.map(mv => 
      `(SELECT ${mv.fields.join(', ')} FROM ${mv.viewName})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${mvQueries})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByIndexedQueryOrdered(tags, userId, indexedQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const indexedQueryClauses = indexedQueries.map(iq => 
      `(${iq.indexedField} BETWEEN ${iq.range.min} AND ${iq.range.max})`
    ).join(' AND ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND ${indexedQueryClauses}
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByParallelQueryOrdered(tags, userId, parallelQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const parallelQueryClauses = parallelQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ALL ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${parallelQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAsyncQueryOrdered(tags, userId, asyncQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const asyncQueryClauses = asyncQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${asyncQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByBatchQueryOrdered(tags, userId, batchQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const batchQueryClauses = batchQueries.map(bq => 
      `(SELECT ${bq.fields.join(', ')} FROM ${bq.table} WHERE ${bq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${batchQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByStreamQueryOrdered(tags, userId, streamQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const streamQueryClauses = streamQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${streamQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPipelineQueryOrdered(tags, userId, pipelineQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const pipelineQueryClauses = pipelineQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${pipelineQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByGraphQueryOrdered(tags, userId, graphQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const graphQueryClauses = graphQueries.map(gq => 
      `(SELECT ${gq.fields.join(', ')} FROM ${gq.table} WHERE ${gq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${graphQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTreeQueryOrdered(tags, userId, treeQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const treeQueryClauses = treeQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${treeQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByNetworkQueryOrdered(tags, userId, networkQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const networkQueryClauses = networkQueries.map(nq => 
      `(SELECT ${nq.fields.join(', ')} FROM ${nq.table} WHERE ${nq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${networkQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDistributedQueryOrdered(tags, userId, distributedQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const distributedQueryClauses = distributedQueries.map(dq => 
      `(SELECT ${dq.fields.join(', ')} FROM ${dq.table} WHERE ${dq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${distributedQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCloudQueryOrdered(tags, userId, cloudQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const cloudQueryClauses = cloudQueries.map(cq => 
      `(SELECT ${cq.fields.join(', ')} FROM ${cq.table} WHERE ${cq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${cloudQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByHybridQueryOrdered(tags, userId, hybridQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const hybridQueryClauses = hybridQueries.map(hq => 
      `(SELECT ${hq.fields.join(', ')} FROM ${hq.table} WHERE ${hq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${hybridQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByQuantumQueryOrdered(tags, userId, quantumQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const quantumQueryClauses = quantumQueries.map(qq => 
      `(SELECT ${qq.fields.join(', ')} FROM ${qq.table} WHERE ${qq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${quantumQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByNeuralQueryOrdered(tags, userId, neuralQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const neuralQueryClauses = neuralQueries.map(nq => 
      `(SELECT ${nq.fields.join(', ')} FROM ${nq.table} WHERE ${nq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${neuralQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMachineLearningQueryOrdered(tags, userId, mlQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const mlQueryClauses = mlQueries.map(mlq => 
      `(SELECT ${mlq.fields.join(', ')} FROM ${mlq.table} WHERE ${mlq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${mlQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDeepLearningQueryOrdered(tags, userId, dlQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const dlQueryClauses = dlQueries.map(dlq => 
      `(SELECT ${dlq.fields.join(', ')} FROM ${dlq.table} WHERE ${dlq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${dlQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByArtificialIntelligenceQueryOrdered(tags, userId, aiQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const aiQueryClauses = aiQueries.map(aiq => 
      `(SELECT ${aiq.fields.join(', ')} FROM ${aiq.table} WHERE ${aiq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${aiQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByBlockchainQueryOrdered(tags, userId, blockchainQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const blockchainQueryClauses = blockchainQueries.map(bcq => 
      `(SELECT ${bcq.fields.join(', ')} FROM ${bcq.table} WHERE ${bcq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${blockchainQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByIoTQueryOrdered(tags, userId, iotQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const iotQueryClauses = iotQueries.map(iotq => 
      `(SELECT ${iotq.fields.join(', ')} FROM ${iotq.table} WHERE ${iotq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${iotQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByEdgeComputingQueryOrdered(tags, userId, edgeQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const edgeQueryClauses = edgeQueries.map(eq => 
      `(SELECT ${eq.fields.join(', ')} FROM ${eq.table} WHERE ${eq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${edgeQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByFogComputingQueryOrdered(tags, userId, fogQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const fogQueryClauses = fogQueries.map(fq => 
      `(SELECT ${fq.fields.join(', ')} FROM ${fq.table} WHERE ${fq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${fogQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCloudEdgeFogQueryOrdered(tags, userId, cefQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const cefQueryClauses = cefQueries.map(cefq => 
      `(SELECT ${cefq.fields.join(', ')} FROM ${cefq.table} WHERE ${cefq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${cefQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByServerlessQueryOrdered(tags, userId, serverlessQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const serverlessQueryClauses = serverlessQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${serverlessQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMicroservicesQueryOrdered(tags, userId, microservicesQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const microservicesQueryClauses = microservicesQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${microservicesQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByContainerQueryOrdered(tags, userId, containerQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const containerQueryClauses = containerQueries.map(cq => 
      `(SELECT ${cq.fields.join(', ')} FROM ${cq.table} WHERE ${cq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${containerQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByKubernetesQueryOrdered(tags, userId, k8sQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const k8sQueryClauses = k8sQueries.map(kq => 
      `(SELECT ${kq.fields.join(', ')} FROM ${kq.table} WHERE ${kq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${k8sQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDockerQueryOrdered(tags, userId, dockerQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const dockerQueryClauses = dockerQueries.map(dq => 
      `(SELECT ${dq.fields.join(', ')} FROM ${dq.table} WHERE ${dq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${dockerQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByVirtualizationQueryOrdered(tags, userId, virtualizationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const virtualizationQueryClauses = virtualizationQueries.map(vq => 
      `(SELECT ${vq.fields.join(', ')} FROM ${vq.table} WHERE ${vq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${virtualizationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByOrchestrationQueryOrdered(tags, userId, orchestrationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const orchestrationQueryClauses = orchestrationQueries.map(oq => 
      `(SELECT ${oq.fields.join(', ')} FROM ${oq.table} WHERE ${oq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${orchestrationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAutomationQueryOrdered(tags, userId, automationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const automationQueryClauses = automationQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${automationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByIntegrationQueryOrdered(tags, userId, integrationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const integrationQueryClauses = integrationQueries.map(iq => 
      `(SELECT ${iq.fields.join(', ')} FROM ${iq.table} WHERE ${iq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${integrationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySynchronizationQueryOrdered(tags, userId, syncQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const syncQueryClauses = syncQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${syncQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByBackupQueryOrdered(tags, userId, backupQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const backupQueryClauses = backupQueries.map(bq => 
      `(SELECT ${bq.fields.join(', ')} FROM ${bq.table} WHERE ${bq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${backupQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByRestoreQueryOrdered(tags, userId, restoreQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const restoreQueryClauses = restoreQueries.map(rq => 
      `(SELECT ${rq.fields.join(', ')} FROM ${rq.table} WHERE ${rq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${restoreQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMigrationQueryOrdered(tags, userId, migrationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const migrationQueryClauses = migrationQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${migrationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByUpgradeQueryOrdered(tags, userId, upgradeQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const upgradeQueryClauses = upgradeQueries.map(uq => 
      `(SELECT ${uq.fields.join(', ')} FROM ${uq.table} WHERE ${uq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${upgradeQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDowngradeQueryOrdered(tags, userId, downgradeQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const downgradeQueryClauses = downgradeQueries.map(dq => 
      `(SELECT ${dq.fields.join(', ')} FROM ${dq.table} WHERE ${dq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${downgradeQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByRollbackQueryOrdered(tags, userId, rollbackQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const rollbackQueryClauses = rollbackQueries.map(rq => 
      `(SELECT ${rq.fields.join(', ')} FROM ${rq.table} WHERE ${rq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${rollbackQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByRecoveryQueryOrdered(tags, userId, recoveryQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const recoveryQueryClauses = recoveryQueries.map(rq => 
      `(SELECT ${rq.fields.join(', ')} FROM ${rq.table} WHERE ${rq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${recoveryQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMaintenanceQueryOrdered(tags, userId, maintenanceQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const maintenanceQueryClauses = maintenanceQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${maintenanceQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMonitoringQueryOrdered(tags, userId, monitoringQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const monitoringQueryClauses = monitoringQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${monitoringQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByLoggingQueryOrdered(tags, userId, loggingQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const loggingQueryClauses = loggingQueries.map(lq => 
      `(SELECT ${lq.fields.join(', ')} FROM ${lq.table} WHERE ${lq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${loggingQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDebuggingQueryOrdered(tags, userId, debuggingQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const debuggingQueryClauses = debuggingQueries.map(dq => 
      `(SELECT ${dq.fields.join(', ')} FROM ${dq.table} WHERE ${dq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${debuggingQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTestingQueryOrdered(tags, userId, testingQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const testingQueryClauses = testingQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${testingQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDeploymentQueryOrdered(tags, userId, deploymentQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const deploymentQueryClauses = deploymentQueries.map(dq => 
      `(SELECT ${dq.fields.join(', ')} FROM ${dq.table} WHERE ${dq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${deploymentQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByScalingQueryOrdered(tags, userId, scalingQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const scalingQueryClauses = scalingQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${scalingQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByLoadBalancingQueryOrdered(tags, userId, lbQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const lbQueryClauses = lbQueries.map(lbq => 
      `(SELECT ${lbq.fields.join(', ')} FROM ${lbq.table} WHERE ${lbq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${lbQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCachingQueryOrdered(tags, userId, cachingQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const cachingQueryClauses = cachingQueries.map(cq => 
      `(SELECT ${cq.fields.join(', ')} FROM ${cq.table} WHERE ${cq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${cachingQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySecurityQueryOrdered(tags, userId, securityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const securityQueryClauses = securityQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${securityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByComplianceQueryOrdered(tags, userId, complianceQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const complianceQueryClauses = complianceQueries.map(cq => 
      `(SELECT ${cq.fields.join(', ')} FROM ${cq.table} WHERE ${cq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${complianceQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByGovernanceQueryOrdered(tags, userId, governanceQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const governanceQueryClauses = governanceQueries.map(gq => 
      `(SELECT ${gq.fields.join(', ')} FROM ${gq.table} WHERE ${gq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${governanceQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByArchitectureQueryOrdered(tags, userId, architectureQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const architectureQueryClauses = architectureQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${architectureQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByDesignQueryOrdered(tags, userId, designQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const designQueryClauses = designQueries.map(dq => 
      `(SELECT ${dq.fields.join(', ')} FROM ${dq.table} WHERE ${dq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${designQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPatternQueryOrdered(tags, userId, patternQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const patternQueryClauses = patternQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${patternQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMethodologyQueryOrdered(tags, userId, methodologyQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const methodologyQueryClauses = methodologyQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${methodologyQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByFrameworkQueryOrdered(tags, userId, frameworkQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const frameworkQueryClauses = frameworkQueries.map(fq => 
      `(SELECT ${fq.fields.join(', ')} FROM ${fq.table} WHERE ${fq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${frameworkQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByLibraryQueryOrdered(tags, userId, libraryQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const libraryQueryClauses = libraryQueries.map(lq => 
      `(SELECT ${lq.fields.join(', ')} FROM ${lq.table} WHERE ${lq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${libraryQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByToolQueryOrdered(tags, userId, toolQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const toolQueryClauses = toolQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${toolQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByServiceQueryOrdered(tags, userId, serviceQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const serviceQueryClauses = serviceQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${serviceQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByResourceQueryOrdered(tags, userId, resourceQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const resourceQueryClauses = resourceQueries.map(rq => 
      `(SELECT ${rq.fields.join(', ')} FROM ${rq.table} WHERE ${rq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${resourceQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAssetQueryOrdered(tags, userId, assetQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const assetQueryClauses = assetQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${assetQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByComponentQueryOrdered(tags, userId, componentQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const componentQueryClauses = componentQueries.map(cq => 
      `(SELECT ${cq.fields.join(', ')} FROM ${cq.table} WHERE ${cq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${componentQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByModuleQueryOrdered(tags, userId, moduleQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const moduleQueryClauses = moduleQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${moduleQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPackageQueryOrdered(tags, userId, packageQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const packageQueryClauses = packageQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${packageQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPluginQueryOrdered(tags, userId, pluginQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const pluginQueryClauses = pluginQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${pluginQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByExtensionQueryOrdered(tags, userId, extensionQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const extensionQueryClauses = extensionQueries.map(eq => 
      `(SELECT ${eq.fields.join(', ')} FROM ${eq.table} WHERE ${eq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${extensionQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAddonQueryOrdered(tags, userId, addonQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const addonQueryClauses = addonQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${addonQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByThemeQueryOrdered(tags, userId, themeQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const themeQueryClauses = themeQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${themeQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTemplateQueryOrdered(tags, userId, templateQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const templateQueryClauses = templateQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${templateQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByLayoutQueryOrdered(tags, userId, layoutQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const layoutQueryClauses = layoutQueries.map(lq => 
      `(SELECT ${lq.fields.join(', ')} FROM ${lq.table} WHERE ${lq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${layoutQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByStyleQueryOrdered(tags, userId, styleQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const styleQueryClauses = styleQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${styleQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAnimationQueryOrdered(tags, userId, animationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const animationQueryClauses = animationQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${animationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTransitionQueryOrdered(tags, userId, transitionQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const transitionQueryClauses = transitionQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${transitionQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByEffectQueryOrdered(tags, userId, effectQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const effectQueryClauses = effectQueries.map(eq => 
      `(SELECT ${eq.fields.join(', ')} FROM ${eq.table} WHERE ${eq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${effectQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByInteractionQueryOrdered(tags, userId, interactionQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const interactionQueryClauses = interactionQueries.map(iq => 
      `(SELECT ${iq.fields.join(', ')} FROM ${iq.table} WHERE ${iq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${interactionQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAccessibilityQueryOrdered(tags, userId, accessibilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const accessibilityQueryClauses = accessibilityQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${accessibilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPerformanceQueryOrdered(tags, userId, performanceQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const performanceQueryClauses = performanceQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${performanceQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByOptimizationQueryOrdered(tags, userId, optimizationQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const optimizationQueryClauses = optimizationQueries.map(oq => 
      `(SELECT ${oq.fields.join(', ')} FROM ${oq.table} WHERE ${oq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${optimizationQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByScalabilityQueryOrdered(tags, userId, scalabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const scalabilityQueryClauses = scalabilityQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${scalabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReliabilityQueryOrdered(tags, userId, reliabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const reliabilityQueryClauses = reliabilityQueries.map(rq => 
      `(SELECT ${rq.fields.join(', ')} FROM ${rq.table} WHERE ${rq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${reliabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAvailabilityQueryOrdered(tags, userId, availabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const availabilityQueryClauses = availabilityQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${availabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMaintainabilityQueryOrdered(tags, userId, maintainabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const maintainabilityQueryClauses = maintainabilityQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${maintainabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySecurityQueryOrdered(tags, userId, securityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const securityQueryClauses = securityQueries.map(sq => 
      `(SELECT ${sq.fields.join(', ')} FROM ${sq.table} WHERE ${sq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${securityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByUsabilityQueryOrdered(tags, userId, usabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const usabilityQueryClauses = usabilityQueries.map(uq => 
      `(SELECT ${uq.fields.join(', ')} FROM ${uq.table} WHERE ${uq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${usabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAccessibilityQueryOrdered(tags, userId, accessibilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const accessibilityQueryClauses = accessibilityQueries.map(aq => 
      `(SELECT ${aq.fields.join(', ')} FROM ${aq.table} WHERE ${aq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${accessibilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCompatibilityQueryOrdered(tags, userId, compatibilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const compatibilityQueryClauses = compatibilityQueries.map(cq => 
      `(SELECT ${cq.fields.join(', ')} FROM ${cq.table} WHERE ${cq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${compatibilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByInteroperabilityQueryOrdered(tags, userId, interoperabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const interoperabilityQueryClauses = interoperabilityQueries.map(iq => 
      `(SELECT ${iq.fields.join(', ')} FROM ${iq.table} WHERE ${iq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${interoperabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPortabilityQueryOrdered(tags, userId, portabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const portabilityQueryClauses = portabilityQueries.map(pq => 
      `(SELECT ${pq.fields.join(', ')} FROM ${pq.table} WHERE ${pq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${portabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByExtensibilityQueryOrdered(tags, userId, extensibilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const extensibilityQueryClauses = extensibilityQueries.map(eq => 
      `(SELECT ${eq.fields.join(', ')} FROM ${eq.table} WHERE ${eq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${extensibilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByModularityQueryOrdered(tags, userId, modularityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const modularityQueryClauses = modularityQueries.map(mq => 
      `(SELECT ${mq.fields.join(', ')} FROM ${mq.table} WHERE ${mq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${modularityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReusabilityQueryOrdered(tags, userId, reusabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const reusabilityQueryClauses = reusabilityQueries.map(rq => 
      `(SELECT ${rq.fields.join(', ')} FROM ${rq.table} WHERE ${rq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${reusabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTestabilityQueryOrdered(tags, userId, testabilityQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const testabilityQueryClauses = testabilityQueries.map(tq => 
      `(SELECT ${tq.fields.join(', ')} FROM ${tq.table} WHERE ${tq.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${testabilityQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByMaintainabilityIndexQueryOrdered(tags, userId, maintainabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const maintainabilityIndexQueryClauses = maintainabilityIndexQueries.map(mi => 
      `(SELECT ${mi.fields.join(', ')} FROM ${mi.table} WHERE ${mi.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${maintainabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReliabilityIndexQueryOrdered(tags, userId, reliabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const reliabilityIndexQueryClauses = reliabilityIndexQueries.map(ri => 
      `(SELECT ${ri.fields.join(', ')} FROM ${ri.table} WHERE ${ri.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${reliabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPerformanceIndexQueryOrdered(tags, userId, performanceIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const performanceIndexQueryClauses = performanceIndexQueries.map(pi => 
      `(SELECT ${pi.fields.join(', ')} FROM ${pi.table} WHERE ${pi.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${performanceIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsBySecurityIndexQueryOrdered(tags, userId, securityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const securityIndexQueryClauses = securityIndexQueries.map(si => 
      `(SELECT ${si.fields.join(', ')} FROM ${si.table} WHERE ${si.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${securityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByUsabilityIndexQueryOrdered(tags, userId, usabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const usabilityIndexQueryClauses = usabilityIndexQueries.map(ui => 
      `(SELECT ${ui.fields.join(', ')} FROM ${ui.table} WHERE ${ui.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${usabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByAccessibilityIndexQueryOrdered(tags, userId, accessibilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const accessibilityIndexQueryClauses = accessibilityIndexQueries.map(ai => 
      `(SELECT ${ai.fields.join(', ')} FROM ${ai.table} WHERE ${ai.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${accessibilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByCompatibilityIndexQueryOrdered(tags, userId, compatibilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const compatibilityIndexQueryClauses = compatibilityIndexQueries.map(ci => 
      `(SELECT ${ci.fields.join(', ')} FROM ${ci.table} WHERE ${ci.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${compatibilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByInteroperabilityIndexQueryOrdered(tags, userId, interoperabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const interoperabilityIndexQueryClauses = interoperabilityIndexQueries.map(ii => 
      `(SELECT ${ii.fields.join(', ')} FROM ${ii.table} WHERE ${ii.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${interoperabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByPortabilityIndexQueryOrdered(tags, userId, portabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const portabilityIndexQueryClauses = portabilityIndexQueries.map(pi => 
      `(SELECT ${pi.fields.join(', ')} FROM ${pi.table} WHERE ${pi.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${portabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByExtensibilityIndexQueryOrdered(tags, userId, extensibilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const extensibilityIndexQueryClauses = extensibilityIndexQueries.map(ei => 
      `(SELECT ${ei.fields.join(', ')} FROM ${ei.table} WHERE ${ei.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${extensibilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByModularityIndexQueryOrdered(tags, userId, modularityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const modularityIndexQueryClauses = modularityIndexQueries.map(mi => 
      `(SELECT ${mi.fields.join(', ')} FROM ${mi.table} WHERE ${mi.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${modularityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByReusabilityIndexQueryOrdered(tags, userId, reusabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const reusabilityIndexQueryClauses = reusabilityIndexQueries.map(ri => 
      `(SELECT ${ri.fields.join(', ')} FROM ${ri.table} WHERE ${ri.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${reusabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }

  static getTagSuggestionsByTestabilityIndexQueryOrdered(tags, userId, testabilityIndexQueries, limit = 10) {
    if (!tags || tags.length === 0) {
      return this.getTagSuggestionsByPopularity(userId, limit);
    }

    const testabilityIndexQueryClauses = testabilityIndexQueries.map(ti => 
      `(SELECT ${ti.fields.join(', ')} FROM ${ti.table} WHERE ${ti.condition})`
    ).join(' UNION ');
    
    const stmt = db.prepare(`
      SELECT DISTINCT t.*
      FROM tags t
      INNER JOIN movie_tags mt ON t.id = mt.tag_id
      WHERE t.user_id = ? AND t.is_active = 1
      AND mt.movie_id IN (
        SELECT mt1.movie_id 
        FROM movie_tags mt1 
        WHERE mt1.tag_id IN (${placeholders})
        ORDER BY mt1.assigned_at DESC
        LIMIT 3
      )
      AND t.id IN (${testabilityIndexQueryClauses})
      ORDER BY t.usage_count DESC
      LIMIT ?
    `);

    const params = [userId, ...tags, limit];
    return stmt.all(...params);
  }
}

module.exports = StreamingUtils;