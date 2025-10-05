// ================================================
// 🎬 MovieNizer Desktop - Servidor Principal
// Autor: Paulo Santos © 2025
// ================================================

const express = require('express');
const path = require('path');
const app = express();

const updateAll = require('./scripts/update-all');
const { startAutoSync } = require('./scripts/auto-sync');
const { startAutoBackup } = require('./scripts/auto-backup');
const StreamingService = require('./services/streamingService');
const ThemeSwitcher = require('./scripts/theme-switcher');
const CriticService = require('./services/criticService');

// Middleware base
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ================================================
// 🌍 Configuração de CORS
// ================================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// ================================================
// 🧭 Rotas API
// ================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/people', require('./routes/people'));
app.use('/api/scrape', require('./routes/scrape'));
app.use('/api/cache', require('./routes/cache'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/cloud', require('./routes/cloud'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/streaming', require('./routes/streaming'));
app.use('/api/theme', require('./routes/theme'));
app.use('/api/critic', require('./routes/critic'));
app.use('/api/email', require('./routes/email'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/widgets', require('./routes/widgets'));
app.use('/api/dashboards', require('./routes/dashboards'));

// ✅ NOVA ROTA DE INTELIGÊNCIA ARTIFICIAL
app.use('/api/ai', require('./routes/ai'));

// ================================================
// 🔒 Middleware de Autenticação
// ================================================
const { authenticate } = require('./middleware/auth');

// Proteger rotas que requerem autenticação
const protectedRoutes = [
  '/api/movies',
  '/api/people',
  '/api/scrape',
  '/api/cache',
  '/api/notifications',
  '/api/reminders',
  '/api/cloud',
  '/api/sync',
  '/api/backup',
  '/api/streaming',
  '/api/theme',
  '/api/critic',
  '/api/email',
  '/api/reports',
  '/api/widgets',
  '/api/dashboards',
  '/api/ai' // ✅ proteger também o módulo IA
];

protectedRoutes.forEach(route => app.use(route, authenticate));

// ================================================
// 📄 Rotas de Páginas Principais (Frontend)
// ================================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/movies-list', (req, res) => res.sendFile(path.join(__dirname, 'public', 'movies-list.html')));
app.get('/people-list', (req, res) => res.sendFile(path.join(__dirname, 'public', 'people-list.html')));
app.get('/movie-detail', (req, res) => res.sendFile(path.join(__dirname, 'public', 'movie-detail.html')));
app.get('/person-detail', (req, res) => res.sendFile(path.join(__dirname, 'public', 'person-detail.html')));
app.get('/advanced-search-movies', (req, res) => res.sendFile(path.join(__dirname, 'public', 'advanced-search-movies.html')));
app.get('/advanced-search-people', (req, res) => res.sendFile(path.join(__dirname, 'public', 'advanced-search-people.html')));
app.get('/statistics', (req, res) => res.sendFile(path.join(__dirname, 'public', 'statistics.html')));
app.get('/reports', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reports.html')));
app.get('/email-reports', (req, res) => res.sendFile(path.join(__dirname, 'public', 'email-reports.html')));
app.get('/email-templates', (req, res) => res.sendFile(path.join(__dirname, 'public', 'email-templates.html')));
app.get('/responsive-templates', (req, res) => res.sendFile(path.join(__dirname, 'public', 'responsive-templates.html')));
app.get('/templates-with-tables', (req, res) => res.sendFile(path.join(__dirname, 'public', 'templates-with-tables.html')));
app.get('/advanced-animations', (req, res) => res.sendFile(path.join(__dirname, 'public', 'advanced-animations.html')));
app.get('/scrape-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'scrape-manager.html')));
app.get('/notifications', (req, res) => res.sendFile(path.join(__dirname, 'public', 'notifications.html')));
app.get('/reminders', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reminders.html')));
app.get('/cloud-sync', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cloud-sync.html')));
app.get('/backup-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'backup-manager.html')));
app.get('/streaming-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'streaming-manager.html')));
app.get('/theme-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'theme-manager.html')));
app.get('/critic-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'critic-manager.html')));
app.get('/email-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'email-manager.html')));
app.get('/report-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'report-manager.html')));
app.get('/widget-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'widget-manager.html')));
app.get('/dashboard-manager', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard-manager.html')));

// ✅ Nova página para testes da IA
app.get('/ai', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ai.html')));

// ================================================
// 🎨 Rotas para CSS e JS específicos
// ================================================

// Nota: as rotas abaixo podiam ser automatizadas,
// mas mantemos explícitas para compatibilidade.
const staticFiles = [
  'style.css', 'auth.css', 'dashboard.css', 'movie-detail.css', 'person-detail.css',
  'people-list.css', 'advanced-search-people.css', 'advanced-search-movies.css',
  'statistics.css', 'reports.css', 'email-reports.css', 'email-templates.css',
  'responsive-templates.css', 'templates-with-tables.css', 'advanced-animations.css',
  'scrape-manager.css', 'notifications.css', 'reminders.css', 'cloud-sync.css',
  'backup-manager.css', 'streaming-manager.css', 'theme-manager.css', 'critic-manager.css',
  'email-manager.css', 'report-manager.css', 'widget-manager.css', 'dashboard-manager.css',
  'movie-detail.js', 'person-detail.js', 'people-list.js', 'advanced-search-people.js',
  'advanced-search-movies.js', 'statistics.js', 'reports.js', 'email-reports.js',
  'email-templates.js', 'responsive-templates.js', 'templates-with-tables.js',
  'advanced-animations.js', 'scrape-manager.js', 'notifications.js', 'reminders.js',
  'cloud-sync.js', 'backup-manager.js', 'streaming-manager.js', 'theme-manager.js',
  'critic-manager.js', 'email-manager.js', 'report-manager.js', 'widget-manager.js',
  'dashboard-manager.js'
];

staticFiles.forEach(file => {
  const route = '/' + file;
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
});

// ================================================
// ⚠️ Rota 404
// ================================================
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ================================================
// 🚀 Inicialização de Serviços Automáticos
// ================================================
updateAll.start();
startAutoSync();
startAutoBackup();
StreamingService.scheduleAutoCheck();
ThemeSwitcher.start();
CriticService.scheduleAutoUpdate();

// ================================================
// 🌐 Iniciar Servidor
// ================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎬 Servidor MovieNizer a correr na porta ${PORT}`);
  console.log(`🌍 Acede em: http://localhost:${PORT}`);
});

module.exports = app;
