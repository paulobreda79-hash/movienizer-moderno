const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'movienizer.db');
const db = new Database(dbPath);

function createTables() {
  // Tabela de Usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      bio TEXT,
      birth_date TEXT,
      preferences TEXT DEFAULT '{}'
    )
  `);

  // Tabela de Filmes
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      year INTEGER,
      genres TEXT,
      countries TEXT,
      studio TEXT,
      director TEXT,
      writers TEXT,
      composers TEXT,
      cast TEXT,
      rating_imdb REAL,
      rating_rottentomatoes REAL,
      rating_letterboxd REAL,
      rating_filmaffinity REAL,
      personal_rating REAL,
      duration INTEGER,
      rating_age TEXT,
      language TEXT,
      awards TEXT,
      plot TEXT,
      poster TEXT,
      backdrop TEXT,
      trailer_url TEXT,
      watched BOOLEAN DEFAULT 0,
      favorite BOOLEAN DEFAULT 0,
      watched_date DATETIME,
      favorite_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Pessoas
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      full_name TEXT,
      birth_date TEXT,
      birth_place TEXT,
      role TEXT,
      height TEXT,
      nickname TEXT,
      biography TEXT,
      image TEXT,
      links TEXT,
      movies TEXT,
      watched BOOLEAN DEFAULT 0,
      favorite BOOLEAN DEFAULT 0,
      followed BOOLEAN DEFAULT 0,
      watched_date DATETIME,
      favorite_date DATETIME,
      followed_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Scrapers
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrapers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      last_run DATETIME,
      status TEXT,
      last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
      settings TEXT DEFAULT '{}'
    )
  `);

  // Tabela de Watchlist
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      person_id INTEGER,
      type TEXT, -- 'movie' ou 'person'
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (movie_id) REFERENCES movies (id),
      FOREIGN KEY (person_id) REFERENCES people (id)
    )
  `);

  // Tabela de Estatísticas
  db.exec(`
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT, -- 'movie', 'person', 'overall'
      data TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Sessões (para autenticação)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      ip_address TEXT,
      user_agent TEXT,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Favoritos
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      person_id INTEGER,
      type TEXT, -- 'movie' ou 'person'
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (movie_id) REFERENCES movies (id),
      FOREIGN KEY (person_id) REFERENCES people (id)
    )
  `);

  // Tabela de Configurações do Usuário
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'pt-BR',
      notifications BOOLEAN DEFAULT 1,
      email_notifications BOOLEAN DEFAULT 1,
      backup_enabled BOOLEAN DEFAULT 0,
      backup_frequency TEXT DEFAULT 'weekly',
      streaming_providers TEXT DEFAULT '[]',
      privacy_level TEXT DEFAULT 'public',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Logs de Atividade
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT, -- 'movie', 'person', 'user', etc.
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Backups
  db.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT NOT NULL,
      size INTEGER,
      type TEXT DEFAULT 'local', -- 'local', 'cloud'
      status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
      location TEXT, -- caminho do arquivo local ou identificador na nuvem
      checksum TEXT, -- hash SHA256 do arquivo
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME, -- data de expiração
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Streaming Availability
  db.exec(`
    CREATE TABLE IF NOT EXISTS streaming_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER,
      platform TEXT NOT NULL,
      link TEXT,
      available BOOLEAN DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movie_id) REFERENCES movies (id)
    )
  `);

  // Tabela de Streaming Platforms
  db.exec(`
    CREATE TABLE IF NOT EXISTS streaming_platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      icon TEXT,
      color TEXT,
      base_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Streaming Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS streaming_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      movie_id INTEGER,
      platform_id TEXT,
      status TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (movie_id) REFERENCES movies (id),
      FOREIGN KEY (platform_id) REFERENCES streaming_platforms (id)
    )
  `);

  // Tabela de Recomendações
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      reason TEXT,
      score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (movie_id) REFERENCES movies (id)
    )
  `);

  // Tabela de Notificações
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- info, success, warning, error
      priority TEXT DEFAULT 'medium', -- low, medium, high
      is_read BOOLEAN DEFAULT 0,
      read_at DATETIME,
      related_movie_id INTEGER,
      related_person_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (related_movie_id) REFERENCES movies (id),
      FOREIGN KEY (related_person_id) REFERENCES people (id)
    )
  `);

  // Tabela de Lembretes
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      reminder_date DATETIME NOT NULL,
      is_recurring BOOLEAN DEFAULT 0,
      recurrence_pattern TEXT, -- daily, weekly, monthly, yearly
      is_completed BOOLEAN DEFAULT 0,
      completed_at DATETIME,
      related_movie_id INTEGER,
      related_person_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (related_movie_id) REFERENCES movies (id),
      FOREIGN KEY (related_person_id) REFERENCES people (id)
    )
  `);

  // Tabela de Cloud Sync
  db.exec(`
    CREATE TABLE IF NOT EXISTS cloud_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      sync_type TEXT NOT NULL, -- 'full', 'changes', 'backup'
      status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
      file_name TEXT,
      file_size INTEGER,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      error_message TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Critic Ratings
  db.exec(`
    CREATE TABLE IF NOT EXISTS critic_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER,
      api_source TEXT NOT NULL, -- imdb, rt, lbxd, fa, trakt, mc, tmdb
      rating_value REAL,
      rating_votes INTEGER DEFAULT 0,
      rating_url TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Templates de E-mail
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      is_html BOOLEAN DEFAULT 1,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Relatórios
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      type TEXT, -- 'movie', 'person', 'statistics', 'custom'
      format TEXT DEFAULT 'pdf', -- 'pdf', 'excel', 'csv', 'json'
      file_path TEXT,
      file_size INTEGER,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Widgets
  db.exec(`
    CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      type TEXT, -- 'movie-stats', 'person-stats', 'streaming', 'recommendations', etc.
      config TEXT, -- JSON com configurações do widget
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      width INTEGER DEFAULT 4,
      height INTEGER DEFAULT 4,
      is_visible BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Dashboards
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      layout TEXT DEFAULT 'grid', -- 'grid', 'flex', 'masonry'
      is_public BOOLEAN DEFAULT 0,
      allow_sharing BOOLEAN DEFAULT 0,
      sharing_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de Dashboard Widgets
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dashboard_id INTEGER,
      widget_type TEXT NOT NULL,
      title TEXT,
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      width INTEGER DEFAULT 4,
      height INTEGER DEFAULT 4,
      config TEXT DEFAULT '{}',
      is_visible BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dashboard_id) REFERENCES dashboards (id)
    )
  `);

  console.log('Todas as tabelas criadas com sucesso!');
}

function seedData() {
  // Dados de exemplo para testar
  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password)
    VALUES (?, ?, ?)
  `);

  // Usuário de exemplo (senha não criptografada, apenas para testes)
  userStmt.run('admin', 'admin@movienizer.com', 'hashed_password_here');

  const movieStmt = db.prepare(`
    INSERT OR IGNORE INTO movies (user_id, title, year, genres, director, rating_imdb, poster)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  movieStmt.run(
    1, // user_id
    'O Poderoso Chefão',
    1972,
    JSON.stringify(['Crime', 'Drama']),
    JSON.stringify(['Francis Ford Coppola']),
    9.2,
    'https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'
  );

  movieStmt.run(
    1, // user_id
    'E.T.',
    1982,
    JSON.stringify(['Sci-Fi', 'Family']),
    JSON.stringify(['Steven Spielberg']),
    7.8,
    'https://image.tmdb.org/t/p/w300/7kQ4uLx6Y8H9uX8l2qduHh8FxIp.jpg'
  );

  // Inserir plataformas padrão
  const platforms = [
    ['nfx', 'Netflix', 1, 'netflix', '#e50914', 'https://www.netflix.com'],
    ['dsnp', 'Disney+', 1, 'disney', '#113ccf', 'https://www.disneyplus.com'],
    ['amzn', 'Amazon Prime Video', 1, 'prime', '#00a8e1', 'https://www.primevideo.com'],
    ['atvp', 'Apple TV+', 1, 'apple', '#000000', 'https://tv.apple.com'],
    ['hbo', 'HBO Max', 1, 'hbo', '#000000', 'https://www.hbomax.com'],
    ['hulu', 'Hulu', 1, 'hulu', '#1ce783', 'https://www.hulu.com'],
    ['pmax', 'Paramount+', 1, 'paramount', '#0064ff', 'https://www.paramountplus.com'],
    ['srz', 'Starz', 1, 'starz', '#000000', 'https://www.starz.com'],
    ['sho', 'Showtime', 1, 'showtime', '#c7102f', 'https://www.sho.com'],
    ['crav', 'Crunchyroll', 1, 'crunchyroll', '#f47521', 'https://www.crunchyroll.com'],
    ['tubi', 'Tubi', 1, 'tubi', '#ff5200', 'https://www.tubitv.com'],
    ['kanp', 'Kanopy', 1, 'kanopy', '#000000', 'https://www.kanopy.com']
  ];

  const platformStmt = db.prepare(`
    INSERT OR IGNORE INTO streaming_platforms (id, name, enabled, icon, color, base_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  platforms.forEach(platform => {
    platformStmt.run(...platform);
  });

  // Inserir ratings de exemplo
  const criticStmt = db.prepare(`
    INSERT OR IGNORE INTO critic_ratings (title, year, api_source, rating_value, rating_votes, rating_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  criticStmt.run('O Poderoso Chefão', 1972, 'imdb', 9.2, 2500000, 'https://www.imdb.com/title/tt0068646/');
  criticStmt.run('O Poderoso Chefão', 1972, 'rt', 98, 150000, 'https://www.rottentomatoes.com/m/the_godfather');
  criticStmt.run('O Poderoso Chefão', 1972, 'lbxd', 4.8, 80000, 'https://letterboxd.com/film/the-godfather/');
  criticStmt.run('O Poderoso Chefão', 1972, 'fa', 9.1, 45000, 'https://www.filmaffinity.com/pt/film123456.html');
  criticStmt.run('O Poderoso Chefão', 1972, 'trakt', 9.3, 120000, 'https://trakt.tv/movies/the-godfather-1972');
  criticStmt.run('O Poderoso Chefão', 1972, 'mc', 100, 60000, 'https://www.metacritic.com/movie/the-godfather');
  criticStmt.run('O Poderoso Chefão', 1972, 'tmdb', 8.7, 22000, 'https://www.themoviedb.org/movie/238-the-godfather');

  criticStmt.run('E.T.', 1982, 'imdb', 7.8, 420000, 'https://www.imdb.com/title/tt0083866/');
  criticStmt.run('E.T.', 1982, 'rt', 98, 85000, 'https://www.rottentomatoes.com/m/e_t_the_extra_terrestrial');
  criticStmt.run('E.T.', 1982, 'lbxd', 4.2, 65000, 'https://letterboxd.com/film/e-t-the-extra-terrestrial/');
  criticStmt.run('E.T.', 1982, 'fa', 7.9, 25000, 'https://www.filmaffinity.com/pt/film789012.html');
  criticStmt.run('E.T.', 1982, 'trakt', 7.9, 95000, 'https://trakt.tv/movies/e-t-the-extra-terrestrial-1982');
  criticStmt.run('E.T.', 1982, 'mc', 91, 35000, 'https://www.metacritic.com/movie/e-t-the-extra-terrestrial');
  criticStmt.run('E.T.', 1982, 'tmdb', 7.5, 18000, 'https://www.themoviedb.org/movie/601-e-t-the-extra-terrestrial');

  console.log('Dados de exemplo inseridos!');
}

// Executar
createTables();
seedData();

module.exports = db;