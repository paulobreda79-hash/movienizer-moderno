// reportConfig.js

const reportConfig = {
  // Configurações gerais de relatórios
  general: {
    enabled: process.env.REPORTS_ENABLED === 'true' || true,
    autoGenerate: process.env.REPORTS_AUTO_GENERATE === 'true' || true,
    maxReports: parseInt(process.env.REPORTS_MAX_REPORTS) || 100,
    retentionDays: parseInt(process.env.REPORTS_RETENTION_DAYS) || 90,
    defaultFormat: process.env.REPORTS_DEFAULT_FORMAT || 'pdf',
    compression: process.env.REPORTS_COMPRESSION === 'true' || true,
    encryption: process.env.REPORTS_ENCRYPTION === 'true' || false
  },

  // Formatos de exportação disponíveis
  formats: {
    pdf: {
      name: 'PDF',
      extension: '.pdf',
      mimeType: 'application/pdf',
      icon: '📄',
      enabled: true
    },
    excel: {
      name: 'Excel',
      extension: '.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      icon: '📊',
      enabled: true
    },
    csv: {
      name: 'CSV',
      extension: '.csv',
      mimeType: 'text/csv',
      icon: '📋',
      enabled: true
    },
    json: {
      name: 'JSON',
      extension: '.json',
      mimeType: 'application/json',
      icon: '🔧',
      enabled: true
    },
    html: {
      name: 'HTML',
      extension: '.html',
      mimeType: 'text/html',
      icon: '🌐',
      enabled: true
    }
  },

  // Tipos de relatórios disponíveis
  types: {
    movieSummary: {
      id: 'movie-summary',
      name: 'Resumo de Filmes',
      description: 'Relatório com estatísticas gerais dos filmes',
      category: 'movies',
      icon: '🎬',
      defaultTemplate: 'movie-summary-template'
    },
    personSummary: {
      id: 'person-summary',
      name: 'Resumo de Pessoas',
      description: 'Relatório com estatísticas gerais das pessoas',
      category: 'people',
      icon: '👥',
      defaultTemplate: 'person-summary-template'
    },
    streamingAvailability: {
      id: 'streaming-availability',
      name: 'Disponibilidade em Streaming',
      description: 'Relatório com disponibilidade dos filmes em plataformas de streaming',
      category: 'streaming',
      icon: '📺',
      defaultTemplate: 'streaming-availability-template'
    },
    recommendations: {
      id: 'recommendations',
      name: 'Recomendações Personalizadas',
      description: 'Relatório com filmes recomendados com base na coleção',
      category: 'recommendations',
      icon: '💡',
      defaultTemplate: 'recommendations-template'
    },
    recentlyAdded: {
      id: 'recently-added',
      name: 'Adicionados Recentemente',
      description: 'Relatório com filmes e pessoas adicionados recentemente',
      category: 'activity',
      icon: '🆕',
      defaultTemplate: 'recently-added-template'
    },
    topRated: {
      id: 'top-rated',
      name: 'Melhor Avaliados',
      description: 'Relatório com os filmes com melhor avaliação',
      category: 'movies',
      icon: '⭐',
      defaultTemplate: 'top-rated-template'
    },
    watchlist: {
      id: 'watchlist',
      name: 'Lista de Observação',
      description: 'Relatório com filmes e pessoas na lista de observação',
      category: 'activity',
      icon: '📋',
      defaultTemplate: 'watchlist-template'
    },
    upcomingReleases: {
      id: 'upcoming-releases',
      name: 'Próximos Lançamentos',
      description: 'Relatório com filmes que serão lançados em breve',
      category: 'movies',
      icon: '📅',
      defaultTemplate: 'upcoming-releases-template'
    },
    favorites: {
      id: 'favorites',
      name: 'Favoritos',
      description: 'Relatório com filmes e pessoas favoritos',
      category: 'activity',
      icon: '❤️',
      defaultTemplate: 'favorites-template'
    },
    genreDistribution: {
      id: 'genre-distribution',
      name: 'Distribuição por Gênero',
      description: 'Relatório com gráfico de distribuição de filmes por gênero',
      category: 'analytics',
      icon: '📊',
      defaultTemplate: 'genre-distribution-template'
    },
    yearDistribution: {
      id: 'year-distribution',
      name: 'Distribuição por Ano',
      description: 'Relatório com gráfico de distribuição de filmes por ano',
      category: 'analytics',
      icon: '📈',
      defaultTemplate: 'year-distribution-template'
    },
    custom: {
      id: 'custom',
      name: 'Relatório Personalizado',
      description: 'Relatório com filtros e campos personalizados',
      category: 'custom',
      icon: '⚙️',
      defaultTemplate: 'custom-template'
    }
  },

  // Categorias de relatórios
  categories: {
    movies: { name: 'Filmes', icon: '🎬', color: '#3498db' },
    people: { name: 'Pessoas', icon: '👥', color: '#e74c3c' },
    streaming: { name: 'Streaming', icon: '📺', color: '#2ecc71' },
    recommendations: { name: 'Recomendações', icon: '💡', color: '#f39c12' },
    activity: { name: 'Atividade', icon: '🔥', color: '#9b59b6' },
    analytics: { name: 'Analytics', icon: '📊', color: '#1abc9c' },
    custom: { name: 'Personalizados', icon: '⚙️', color: '#34495e' }
  },

  // Templates de relatórios
  templates: {
    'movie-summary-template': {
      name: 'Template de Resumo de Filmes',
      description: 'Template padrão para relatório de resumo de filmes',
      type: 'movie-summary',
      content: `
        <h1>Relatório de Resumo de Filmes - MovieNizer</h1>
        <p>Data: {{reportDate}}</p>
        <h2>Estatísticas Gerais</h2>
        <ul>
          <li>Total de Filmes: {{totalMovies}}</li>
          <li>Filmes Vistos: {{watchedMovies}}</li>
          <li>Filmes Favoritos: {{favoriteMovies}}</li>
          <li>Média de Rating: {{averageRating}}</li>
          <li>Porcentagem Vistos: {{watchedPercentage}}%</li>
        </ul>
        <h2>Distribuição por Gênero</h2>
        <table>
          <thead>
            <tr>
              <th>Gênero</th>
              <th>Quantidade</th>
              <th>Porcentagem</th>
            </tr>
          </thead>
          <tbody>
            {{#genreDistribution}}
            <tr>
              <td>{{genre}}</td>
              <td>{{count}}</td>
              <td>{{percentage}}%</td>
            </tr>
            {{/genreDistribution}}
          </tbody>
        </table>
        <h2>Distribuição por Ano</h2>
        <table>
          <thead>
            <tr>
              <th>Ano</th>
              <th>Quantidade</th>
              <th>Porcentagem</th>
            </tr>
          </thead>
          <tbody>
            {{#yearDistribution}}
            <tr>
              <td>{{year}}</td>
              <td>{{count}}</td>
              <td>{{percentage}}%</td>
            </tr>
            {{/yearDistribution}}
          </tbody>
        </table>
      `
    },
    'person-summary-template': {
      name: 'Template de Resumo de Pessoas',
      description: 'Template padrão para relatório de resumo de pessoas',
      type: 'person-summary',
      content: `
        <h1>Relatório de Resumo de Pessoas - MovieNizer</h1>
        <p>Data: {{reportDate}}</p>
        <h2>Estatísticas Gerais</h2>
        <ul>
          <li>Total de Pessoas: {{totalPeople}}</li>
          <li>Pessoas Seguidas: {{followedPeople}}</li>
          <li>Pessoas Favoritas: {{favoritePeople}}</li>
        </ul>
        <h2>Distribuição por Função</h2>
        <table>
          <thead>
            <tr>
              <th>Função</th>
              <th>Quantidade</th>
              <th>Porcentagem</th>
            </tr>
          </thead>
          <tbody>
            {{#roleDistribution}}
            <tr>
              <td>{{role}}</td>
              <td>{{count}}</td>
              <td>{{percentage}}%</td>
            </tr>
            {{/roleDistribution}}
          </tbody>
        </table>
        <h2>Top 10 Atores Mais Atuados</h2>
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Nome</th>
              <th>Número de Filmes</th>
            </tr>
          </thead>
          <tbody>
            {{#topActors}}
            <tr>
              <td>{{position}}</td>
              <td>{{name}}</td>
              <td>{{movieCount}}</td>
            </tr>
            {{/topActors}}
          </tbody>
        </table>
      `
    }
  },

  // Configurações de agendamento
  schedule: {
    hourly: '0 * * * *', // a cada hora
    daily: '0 2 * * *',   // diariamente às 2h
    weekly: '0 3 * * 0',  // semanalmente domingo às 3h
    monthly: '0 4 1 * *'  // mensalmente no dia 1 às 4h
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.REPORTS_NOTIFICATIONS_ENABLED === 'true' || true,
    email: process.env.REPORTS_NOTIFICATION_EMAIL === 'true' || false,
    system: process.env.REPORTS_NOTIFICATION_SYSTEM === 'true' || true,
    completion: process.env.REPORTS_NOTIFY_COMPLETION === 'true' || true,
    failure: process.env.REPORTS_NOTIFY_FAILURE === 'true' || true
  },

  // Configurações de segurança
  security: {
    encryptionKey: process.env.REPORTS_ENCRYPTION_KEY || 'movienizer-reports-key-32-chars!!',
    salt: process.env.REPORTS_ENCRYPTION_SALT || 'movienizer-reports-salt-16-chars!',
    algorithm: process.env.REPORTS_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de armazenamento
  storage: {
    local: {
      enabled: process.env.REPORTS_LOCAL_STORAGE === 'true' || true,
      directory: process.env.REPORTS_LOCAL_DIRECTORY || './reports',
      maxSize: parseInt(process.env.REPORTS_LOCAL_MAX_SIZE) || 1024, // MB
      autoCleanup: process.env.REPORTS_LOCAL_AUTO_CLEANUP === 'true' || true
    },
    cloud: {
      enabled: process.env.REPORTS_CLOUD_STORAGE === 'true' || false,
      provider: process.env.REPORTS_CLOUD_PROVIDER || 'aws',
      bucket: process.env.REPORTS_CLOUD_BUCKET || 'movienizer-reports',
      region: process.env.REPORTS_CLOUD_REGION || 'us-east-1'
    }
  }
};

module.exports = reportConfig;