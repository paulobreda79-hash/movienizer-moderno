// dashboard-view.js

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dashboardId = urlParams.get('id');

  if (!dashboardId) {
    alert('ID do dashboard não fornecido.');
    window.location.href = '/dashboards';
    return;
  }

  // Carregar dashboard
  loadDashboard(dashboardId);

  // Eventos
  document.getElementById('btn-edit-dashboard').addEventListener('click', showEditDashboardModal);
  document.getElementById('btn-add-widget').addEventListener('click', showAddWidgetModal);
  document.getElementById('btn-refresh-dashboard').addEventListener('click', () => loadDashboard(dashboardId));
  document.getElementById('btn-export-dashboard').addEventListener('click', exportDashboard);
  document.getElementById('btn-share-dashboard').addEventListener('click', shareDashboard);
  document.getElementById('btn-cancel-add-widget').addEventListener('click', hideAddWidgetModal);
  document.getElementById('btn-cancel-config').addEventListener('click', hideConfigureWidgetModal);
  document.getElementById('btn-cancel-edit').addEventListener('click', hideEditDashboardModal);
  document.getElementById('create-dashboard-form').addEventListener('submit', createDashboard);
  document.getElementById('edit-dashboard-form').addEventListener('submit', updateDashboard);
  document.getElementById('widget-config-form').addEventListener('submit', addWidget);

  // Atualizar dados a cada 5 minutos
  setInterval(() => loadDashboard(dashboardId), 300000);
});

async function loadDashboard(dashboardId) {
  try {
    const response = await fetch(`/api/dashboard/${dashboardId}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const dashboard = await response.json();

    // Atualizar título
    document.getElementById('dashboard-title').textContent = dashboard.name;

    // Carregar widgets
    await loadDashboardWidgets(dashboardId);

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    alert('Erro ao carregar dashboard: ' + error.message);
  }
}

async function loadDashboardWidgets(dashboardId) {
  try {
    const response = await fetch(`/api/dashboard/${dashboardId}/widgets`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const widgets = await response.json();

    const area = document.getElementById('widgets-area');
    area.innerHTML = '';

    if (widgets.length === 0) {
      area.innerHTML = '<p style="text-align: center; color: var(--theme-text-secondary); grid-column: 1 / -1;">Nenhum widget adicionado ainda.</p>';
      return;
    }

    widgets.forEach(widget => {
      const widgetElement = createWidgetElement(widget);
      area.appendChild(widgetElement);
      loadWidgetData(widget);
    });

  } catch (error) {
    console.error('Erro ao carregar widgets:', error);
    alert('Erro ao carregar widgets: ' + error.message);
  }
}

function createWidgetElement(widget) {
  const widgetElement = document.createElement('div');
  widgetElement.className = 'widget-container';
  widgetElement.dataset.widgetId = widget.id;
  widgetElement.style.gridColumn = `span ${widget.width || 4}`;
  widgetElement.style.gridRow = `span ${widget.height || 4}`;

  widgetElement.innerHTML = `
    <div class="widget-header">
      <h3 class="widget-title">${widget.title}</h3>
      <div class="widget-actions">
        <button onclick="refreshWidget(${widget.id})" title="Atualizar">🔄</button>
        <button onclick="configureWidget(${widget.id})" title="Configurar">⚙️</button>
        <button onclick="removeWidget(${widget.id})" title="Remover">🗑️</button>
      </div>
    </div>
    <div class="widget-content" id="widget-content-${widget.id}">
      <div class="widget-loading">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;

  return widgetElement;
}

async function loadWidgetData(widget) {
  try {
    const response = await fetch(`/api/dashboard/widget/${widget.widget_type}/data?config=${encodeURIComponent(JSON.stringify(widget.config || {}))}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const data = await response.json();

    const contentElement = document.getElementById(`widget-content-${widget.id}`);
    contentElement.innerHTML = renderWidgetContent(widget.widget_type, data);

  } catch (error) {
    console.error(`Erro ao carregar dados do widget ${widget.id}:`, error);
    const contentElement = document.getElementById(`widget-content-${widget.id}`);
    contentElement.innerHTML = `
      <div class="widget-error">
        <span>❌</span>
        <p>Erro ao carregar dados: ${error.message}</p>
      </div>
    `;
  }
}

function renderWidgetContent(widgetType, data) {
  switch (widgetType) {
    case 'movie-stats':
      return renderMovieStatsWidget(data);
    case 'person-stats':
      return renderPersonStatsWidget(data);
    case 'streaming-availability':
      return renderStreamingWidget(data);
    case 'recommendations':
      return renderRecommendationsWidget(data);
    case 'recently-added':
      return renderRecentlyAddedWidget(data);
    case 'top-rated':
      return renderTopRatedWidget(data);
    case 'watchlist':
      return renderWatchlistWidget(data);
    case 'upcoming-releases':
      return renderUpcomingReleasesWidget(data);
    case 'favorites':
      return renderFavoritesWidget(data);
    case 'genre-distribution':
      return renderGenreDistributionWidget(data);
    case 'year-distribution':
      return renderYearDistributionWidget(data);
    case 'quick-actions':
      return renderQuickActionsWidget(data);
    case 'calendar':
      return renderCalendarWidget(data);
    case 'notifications':
      return renderNotificationsWidget(data);
    default:
      return `<p>Widget ${widgetType} não reconhecido</p>`;
  }
}

function renderMovieStatsWidget(data) {
  return `
    <div class="widget-stats">
      <div class="stat-item">
        <h4>Total de Filmes</h4>
        <p>${data.totalMovies}</p>
      </div>
      <div class="stat-item">
        <h4>Filmes Vistos</h4>
        <p>${data.watchedMovies}</p>
      </div>
      <div class="stat-item">
        <h4>Média de Rating</h4>
        <p>${data.averageRating}</p>
      </div>
      <div class="stat-item">
        <h4>Porcentagem Vistos</h4>
        <p>${data.watchedPercentage}%</p>
      </div>
    </div>
  `;
}

function renderPersonStatsWidget(data) {
  return `
    <div class="widget-stats">
      <div class="stat-item">
        <h4>Total de Pessoas</h4>
        <p>${data.totalPeople}</p>
      </div>
      <div class="stat-item">
        <h4>Seguidas</h4>
        <p>${data.followedPeople}</p>
      </div>
      <div class="stat-item">
        <h4>Favoritas</h4>
        <p>${data.favoritePeople}</p>
      </div>
    </div>
  `;
}

function renderStreamingWidget(data) {
  let html = '<div class="widget-list">';
  Object.entries(data.platformStats).forEach(([platform, stats]) => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${platform}</div>
          <div class="widget-list-item-meta">
            Disponível: ${stats.available} (${stats.percentage}%)
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderRecommendationsWidget(data) {
  let html = '<div class="widget-list">';
  data.recommendations.forEach(rec => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${rec.title}</div>
          <div class="widget-list-item-meta">
            Score: ${rec.score}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderRecentlyAddedWidget(data) {
  let html = '<div class="widget-list">';
  data.items.forEach(item => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${item.title}</div>
          <div class="widget-list-item-meta">
            ${item.category} • ${new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderTopRatedWidget(data) {
  let html = '<div class="widget-list">';
  data.movies.forEach(movie => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${movie.title} (${movie.year})</div>
          <div class="widget-list-item-meta">
            ⭐ ${movie.rating_imdb}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderWatchlistWidget(data) {
  let html = '<div class="widget-list">';
  data.items.forEach(item => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${item.title}</div>
          <div class="widget-list-item-meta">
            ${item.category} • ${new Date(item.added_date).toLocaleDateString()}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderUpcomingReleasesWidget(data) {
  let html = '<div class="widget-list">';
  data.movies.forEach(movie => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${movie.title}</div>
          <div class="widget-list-item-meta">
            Lançamento: ${movie.release_date}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderFavoritesWidget(data) {
  let html = '<div class="widget-list">';
  data.items.forEach(item => {
    html += `
      <div class="widget-list-item">
        <div class="widget-list-item-content">
          <div class="widget-list-item-title">${item.title}</div>
          <div class="widget-list-item-meta">
            ${item.category} • ⭐ ${item.rating}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderGenreDistributionWidget(data) {
  return `
    <canvas id="genre-chart-${Date.now()}" class="widget-chart"></canvas>
    <script>
      new Chart(document.getElementById('genre-chart-${Date.now()}'), {
        type: 'doughnut',
        data: {
          labels: ${JSON.stringify(data.distribution.map(d => d.genre))},
          datasets: [{
            data: ${JSON.stringify(data.distribution.map(d => d.count))},
            backgroundColor: [
              '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
              '#1abc9c', '#34495e', '#e67e22', '#16a085', '#8e44ad'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    </script>
  `;
}

function renderYearDistributionWidget(data) {
  return `
    <canvas id="year-chart-${Date.now()}" class="widget-chart"></canvas>
    <script>
      new Chart(document.getElementById('year-chart-${Date.now()}'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(data.distribution.map(d => d.year))},
          datasets: [{
            label: 'Filmes por Ano',
            data: ${JSON.stringify(data.distribution.map(d => d.count))},
            backgroundColor: '#3498db'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    </script>
  `;
}

function renderQuickActionsWidget(data) {
  let html = '<div class="widget-actions-grid">';
  data.actions.forEach(action => {
    html += `
      <button class="quick-action-btn">
        <span>${getActionIcon(action)}</span>
        <span>${getActionName(action)}</span>
      </button>
    `;
  });
  html += '</div>';
  return html;
}

function getActionIcon(action) {
  const icons = {
    'add-movie': '🎬',
    'add-person': '👤',
    'search-movie': '🔍',
    'search-person': '🔍',
    'create-backup': '💾',
    'sync-cloud': '☁️',
    'generate-report': '📊'
  };
  return icons[action] || '⚡';
}

function getActionName(action) {
  const names = {
    'add-movie': 'Adicionar Filme',
    'add-person': 'Adicionar Pessoa',
    'search-movie': 'Buscar Filme',
    'search-person': 'Buscar Pessoa',
    'create-backup': 'Criar Backup',
    'sync-cloud': 'Sincronizar',
    'generate-report': 'Gerar Relatório'
  };
  return names[action] || action;
}

function renderCalendarWidget(data) {
  let html = '<div class="widget-calendar">';
  data.events.forEach(event => {
    html += `
      <div class="calendar-event">
        <div class="event-date">${new Date(event.date).toLocaleDateString()}</div>
        <div class="event-title">${event.title}</div>
        <div class="event-category">${event.category}</div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function renderNotificationsWidget(data) {
  let html = '<div class="widget-notifications">';
  data.notifications.forEach(notification => {
    html += `
      <div class="notification-item ${notification.is_read ? 'read' : 'unread'}">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function showAddWidgetModal() {
  loadAvailableWidgetsForModal();
  document.getElementById('add-widget-modal').style.display = 'flex';
}

function hideAddWidgetModal() {
  document.getElementById('add-widget-modal').style.display = 'none';
}

function showConfigureWidgetModal(widgetType) {
  document.getElementById('configure-widget-modal').style.display = 'flex';
  configureWidgetForm(widgetType);
}

function hideConfigureWidgetModal() {
  document.getElementById('configure-widget-modal').style.display = 'none';
}

function showEditDashboardModal() {
  loadDashboardDataForEdit();
  document.getElementById('edit-dashboard-modal').style.display = 'flex';
}

function hideEditDashboardModal() {
  document.getElementById('edit-dashboard-modal').style.display = 'none';
}

async function loadAvailableWidgetsForModal() {
  try {
    const response = await fetch('/api/dashboard/widgets');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const widgets = await response.json();

    const container = document.getElementById('available-widgets');
    container.innerHTML = '';

    widgets.forEach(widget => {
      const widgetOption = document.createElement('div');
      widgetOption.className = 'widget-option';
      widgetOption.dataset.widgetType = widget.id;

      widgetOption.innerHTML = `
        <div class="widget-option-header">
          <span class="widget-option-icon">${widget.icon}</span>
          <h4 class="widget-option-title">${widget.name}</h4>
        </div>
        <p class="widget-option-description">${widget.description}</p>
      `;

      widgetOption.addEventListener('click', () => {
        hideAddWidgetModal();
        showConfigureWidgetModal(widget.id);
      });

      container.appendChild(widgetOption);
    });
  } catch (error) {
    console.error('Erro ao carregar widgets disponíveis:', error);
    alert('Erro ao carregar widgets disponíveis.');
  }
}

function configureWidgetForm(widgetType) {
  const specificConfig = document.getElementById('specific-config');
  specificConfig.innerHTML = '';

  // Configurações específicas por tipo de widget
  switch (widgetType) {
    case 'movie-stats':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-count" checked />
            Mostrar contagem total
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-rating" checked />
            Mostrar média de rating
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-genre" checked />
            Mostrar distribuição por gênero
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-year" />
            Mostrar distribuição por ano
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-watched" checked />
            Mostrar porcentagem de vistos
          </label>
        </div>
      `;
      break;
    case 'person-stats':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-count" checked />
            Mostrar contagem total
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-role" checked />
            Mostrar distribuição por função
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-actors" checked />
            Mostrar atores favoritos
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-directors" checked />
            Mostrar diretores favoritos
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-followed" checked />
            Mostrar pessoas seguidas
          </label>
        </div>
      `;
      break;
    case 'streaming-availability':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>Plataformas:</label>
          <div class="checkbox-group">
            <label><input type="checkbox" value="netflix" checked /> Netflix</label>
            <label><input type="checkbox" value="disney" checked /> Disney+</label>
            <label><input type="checkbox" value="prime" checked /> Prime Video</label>
            <label><input type="checkbox" value="apple" /> Apple TV+</label>
            <label><input type="checkbox" value="hbo" /> HBO Max</label>
            <label><input type="checkbox" value="hulu" /> Hulu</label>
            <label><input type="checkbox" value="paramount" /> Paramount+</label>
            <label><input type="checkbox" value="starz" /> Starz</label>
            <label><input type="checkbox" value="showtime" /> Showtime</label>
            <label><input type="checkbox" value="crunchyroll" /> Crunchyroll</label>
            <label><input type="checkbox" value="tubi" /> Tubi</label>
            <label><input type="checkbox" value="kanopy" /> Kanopy</label>
          </div>
        </div>
      `;
      break;
    case 'recommendations':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>Número máximo de recomendações:</label>
          <input type="number" id="config-max-recommendations" value="10" min="1" max="50" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-reason" checked />
            Mostrar razão
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-score" checked />
            Mostrar pontuação
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-poster" checked />
            Mostrar pôster
          </label>
        </div>
      `;
      break;
    case 'recently-added':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-movies" checked />
            Mostrar filmes
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-people" checked />
            Mostrar pessoas
          </label>
        </div>
        <div class="form-group">
          <label>Número máximo de itens:</label>
          <input type="number" id="config-max-items" value="5" min="1" max="20" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-poster" checked />
            Mostrar pôster
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-date" checked />
            Mostrar data
          </label>
        </div>
      `;
      break;
    case 'top-rated':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>Número máximo de filmes:</label>
          <input type="number" id="config-max-items" value="10" min="1" max="50" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-rating" checked />
            Mostrar rating
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-poster" checked />
            Mostrar pôster
          </label>
        </div>
        <div class="form-group">
          <label>Rating mínimo:</label>
          <input type="number" id="config-min-rating" value="7.0" min="0" max="10" step="0.1" />
        </div>
      `;
      break;
    case 'watchlist':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-movies" checked />
            Mostrar filmes
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-people" checked />
            Mostrar pessoas
          </label>
        </div>
        <div class="form-group">
          <label>Número máximo de itens:</label>
          <input type="number" id="config-max-items" value="10" min="1" max="50" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-poster" checked />
            Mostrar pôster
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-date" checked />
            Mostrar data adicionada
          </label>
        </div>
      `;
      break;
    case 'upcoming-releases':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>Número máximo de filmes:</label>
          <input type="number" id="config-max-items" value="10" min="1" max="50" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-date" checked />
            Mostrar data de lançamento
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-poster" checked />
            Mostrar pôster
          </label>
        </div>
        <div class="form-group">
          <label>Dias à frente:</label>
          <input type="number" id="config-days-ahead" value="30" min="1" max="365" />
        </div>
      `;
      break;
    case 'favorites':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-movies" checked />
            Mostrar filmes
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-people" checked />
            Mostrar pessoas
          </label>
        </div>
        <div class="form-group">
          <label>Número máximo de itens:</label>
          <input type="number" id="config-max-items" value="10" min="1" max="50" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-poster" checked />
            Mostrar pôster
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-rating" checked />
            Mostrar rating
          </label>
        </div>
      `;
      break;
    case 'genre-distribution':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-chart" checked />
            Mostrar gráfico
          </label>
        </div>
        <div class="form-group">
          <label>Tipo de gráfico:</label>
          <select id="config-chart-type">
            <option value="doughnut">Rosca</option>
            <option value="pie">Pizza</option>
            <option value="bar">Barra</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-legend" checked />
            Mostrar legenda
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-percentage" checked />
            Mostrar porcentagem
          </label>
        </div>
      `;
      break;
    case 'year-distribution':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-chart" checked />
            Mostrar gráfico
          </label>
        </div>
        <div class="form-group">
          <label>Tipo de gráfico:</label>
          <select id="config-chart-type">
            <option value="bar">Barra</option>
            <option value="line">Linha</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-legend" checked />
            Mostrar legenda
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-group-decade" />
            Agrupar por década
          </label>
        </div>
      `;
      break;
    case 'quick-actions':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>Ações:</label>
          <div class="checkbox-group">
            <label><input type="checkbox" value="add-movie" checked /> Adicionar Filme</label>
            <label><input type="checkbox" value="add-person" checked /> Adicionar Pessoa</label>
            <label><input type="checkbox" value="search-movie" checked /> Buscar Filme</label>
            <label><input type="checkbox" value="search-person" checked /> Buscar Pessoa</label>
            <label><input type="checkbox" value="create-backup" checked /> Criar Backup</label>
            <label><input type="checkbox" value="sync-cloud" /> Sincronizar</label>
            <label><input type="checkbox" value="generate-report" /> Gerar Relatório</label>
          </div>
        </div>
      `;
      break;
    case 'calendar':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-reminders" checked />
            Mostrar lembretes
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-birthdays" checked />
            Mostrar aniversários
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-releases" checked />
            Mostrar lançamentos
          </label>
        </div>
        <div class="form-group">
          <label>Dias à frente:</label>
          <input type="number" id="config-days-show" value="30" min="1" max="365" />
        </div>
      `;
      break;
    case 'notifications':
      specificConfig.innerHTML = `
        <div class="form-group">
          <label>Número máximo de notificações:</label>
          <input type="number" id="config-max-notifications" value="5" min="1" max="20" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-unread-only" />
            Mostrar apenas não lidas
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="config-show-timestamp" checked />
            Mostrar horário
          </label>
        </div>
      `;
      break;
    default:
      specificConfig.innerHTML = '<p>Configurações específicas não disponíveis</p>';
  }
}

async function addWidget(e) {
  e.preventDefault();

  const dashboardId = new URLSearchParams(window.location.search).get('id');
  const widgetType = document.querySelector('.widget-option.selected')?.dataset.widgetType;

  if (!widgetType) {
    alert('Selecione um widget para adicionar.');
    return;
  }

  try {
    const widgetData = {
      dashboard_id: dashboardId,
      widget_type: widgetType,
      title: document.getElementById('widget-title').value,
      position_x: 0,
      position_y: 0,
      width: parseInt(document.getElementById('widget-width').value),
      height: parseInt(document.getElementById('widget-height').value),
      config: getWidgetConfig(widgetType),
      is_visible: 1
    };

    const response = await fetch(`/api/dashboard/${dashboardId}/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widgetData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Widget adicionado com sucesso!');
    hideConfigureWidgetModal();
    loadDashboard(dashboardId);
  } catch (error) {
    console.error('Erro ao adicionar widget:', error);
    alert('Erro ao adicionar widget: ' + error.message);
  }
}

function getWidgetConfig(widgetType) {
  const config = {};

  switch (widgetType) {
    case 'movie-stats':
      config.showCount = document.getElementById('config-show-count')?.checked;
      config.showRating = document.getElementById('config-show-rating')?.checked;
      config.showGenreDistribution = document.getElementById('config-show-genre')?.checked;
      config.showYearDistribution = document.getElementById('config-show-year')?.checked;
      config.showWatchedPercentage = document.getElementById('config-show-watched')?.checked;
      break;
    case 'person-stats':
      config.showCount = document.getElementById('config-show-count')?.checked;
      config.showRoleDistribution = document.getElementById('config-show-role')?.checked;
      config.showFavoriteActors = document.getElementById('config-show-actors')?.checked;
      config.showFavoriteDirectors = document.getElementById('config-show-directors')?.checked;
      config.showFollowed = document.getElementById('config-show-followed')?.checked;
      break;
    case 'streaming-availability':
      config.showPlatforms = Array.from(document.querySelectorAll('#specific-config input[type="checkbox"]:checked'))
        .map(cb => cb.value);
      break;
    case 'recommendations':
      config.maxRecommendations = parseInt(document.getElementById('config-max-recommendations')?.value);
      config.showReason = document.getElementById('config-show-reason')?.checked;
      config.showScore = document.getElementById('config-show-score')?.checked;
      config.showPoster = document.getElementById('config-show-poster')?.checked;
      break;
    case 'recently-added':
      config.showMovies = document.getElementById('config-show-movies')?.checked;
      config.showPeople = document.getElementById('config-show-people')?.checked;
      config.maxItems = parseInt(document.getElementById('config-max-items')?.value);
      config.showPoster = document.getElementById('config-show-poster')?.checked;
      config.showDate = document.getElementById('config-show-date')?.checked;
      break;
    case 'top-rated':
      config.maxItems = parseInt(document.getElementById('config-max-items')?.value);
      config.showRating = document.getElementById('config-show-rating')?.checked;
      config.showPoster = document.getElementById('config-show-poster')?.checked;
      config.minRating = parseFloat(document.getElementById('config-min-rating')?.value);
      break;
    case 'watchlist':
      config.showMovies = document.getElementById('config-show-movies')?.checked;
      config.showPeople = document.getElementById('config-show-people')?.checked;
      config.maxItems = parseInt(document.getElementById('config-max-items')?.value);
      config.showPoster = document.getElementById('config-show-poster')?.checked;
      config.showDateAdded = document.getElementById('config-show-date')?.checked;
      break;
    case 'upcoming-releases':
      config.maxItems = parseInt(document.getElementById('config-max-items')?.value);
      config.showReleaseDate = document.getElementById('config-show-date')?.checked;
      config.showPoster = document.getElementById('config-show-poster')?.checked;
      config.daysAhead = parseInt(document.getElementById('config-days-ahead')?.value);
      break;
    case 'favorites':
      config.showMovies = document.getElementById('config-show-movies')?.checked;
      config.showPeople = document.getElementById('config-show-people')?.checked;
      config.maxItems = parseInt(document.getElementById('config-max-items')?.value);
      config.showPoster = document.getElementById('config-show-poster')?.checked;
      config.showRating = document.getElementById('config-show-rating')?.checked;
      break;
    case 'genre-distribution':
      config.showChart = document.getElementById('config-show-chart')?.checked;
      config.chartType = document.getElementById('config-chart-type')?.value;
      config.showLegend = document.getElementById('config-show-legend')?.checked;
      config.showPercentage = document.getElementById('config-show-percentage')?.checked;
      break;
    case 'year-distribution':
      config.showChart = document.getElementById('config-show-chart')?.checked;
      config.chartType = document.getElementById('config-chart-type')?.value;
      config.showLegend = document.getElementById('config-show-legend')?.checked;
      config.groupByDecade = document.getElementById('config-group-decade')?.checked;
      break;
    case 'quick-actions':
      config.actions = Array.from(document.querySelectorAll('#specific-config input[type="checkbox"]:checked'))
        .map(cb => cb.value);
      break;
    case 'calendar':
      config.showReminders = document.getElementById('config-show-reminders')?.checked;
      config.showBirthdays = document.getElementById('config-show-birthdays')?.checked;
      config.showReleaseDates = document.getElementById('config-show-releases')?.checked;
      config.daysToShow = parseInt(document.getElementById('config-days-show')?.value);
      break;
    case 'notifications':
      config.maxNotifications = parseInt(document.getElementById('config-max-notifications')?.value);
      config.showUnreadOnly = document.getElementById('config-unread-only')?.checked;
      config.showTimestamp = document.getElementById('config-show-timestamp')?.checked;
      break;
  }

  return config;
}

async function loadDashboardDataForEdit() {
  const dashboardId = new URLSearchParams(window.location.search).get('id');
  
  try {
    const response = await fetch(`/api/dashboard/${dashboardId}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const dashboard = await response.json();

    document.getElementById('edit-dashboard-name').value = dashboard.name;
    document.getElementById('edit-dashboard-description').value = dashboard.description || '';
    document.getElementById('edit-dashboard-layout').value = dashboard.layout;
    document.getElementById('edit-dashboard-public').checked = dashboard.is_public === 1;
    document.getElementById('edit-dashboard-allow-sharing').checked = dashboard.allow_sharing === 1;
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    alert('Erro ao carregar dados do dashboard.');
  }
}

async function updateDashboard(e) {
  e.preventDefault();

  const dashboardId = new URLSearchParams(window.location.search).get('id');
  
  try {
    const dashboardData = {
      name: document.getElementById('edit-dashboard-name').value,
      description: document.getElementById('edit-dashboard-description').value,
      layout: document.getElementById('edit-dashboard-layout').value,
      is_public: document.getElementById('edit-dashboard-public').checked ? 1 : 0,
      allow_sharing: document.getElementById('edit-dashboard-allow-sharing').checked ? 1 : 0
    };

    const response = await fetch(`/api/dashboard/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dashboardData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Dashboard atualizado com sucesso!');
    hideEditDashboardModal();
    loadDashboard(dashboardId);
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
    alert('Erro ao atualizar dashboard: ' + error.message);
  }
}

async function exportDashboard() {
  const dashboardId = new URLSearchParams(window.location.search).get('id');
  
  try {
    const response = await fetch(`/api/dashboard/${dashboardId}/export?format=json`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const data = await response.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-${dashboardId}.json`;
    link.click();

    URL.revokeObjectURL(url);
    alert('Dashboard exportado com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar dashboard:', error);
    alert('Erro ao exportar dashboard: ' + error.message);
  }
}

async function shareDashboard() {
  const dashboardId = new URLSearchParams(window.location.search).get('id');
  
  try {
    const response = await fetch(`/api/dashboard/${dashboardId}/share`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    const shareUrl = result.shareUrl;

    // Copiar URL para a área de transferência
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('URL de compartilhamento copiado para a área de transferência!');
    }).catch(() => {
      prompt('Copie o URL de compartilhamento:', shareUrl);
    });
  } catch (error) {
    console.error('Erro ao compartilhar dashboard:', error);
    alert('Erro ao compartilhar dashboard: ' + error.message);
  }
}

async function refreshWidget(widgetId) {
  try {
    const response = await fetch(`/api/dashboard/widget/${widgetId}/data`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const data = await response.json();

    const contentElement = document.getElementById(`widget-content-${widgetId}`);
    contentElement.innerHTML = renderWidgetContent(widgetId, data);
  } catch (error) {
    console.error(`Erro ao atualizar widget ${widgetId}:`, error);
    alert('Erro ao atualizar widget: ' + error.message);
  }
}

async function configureWidget(widgetId) {
  try {
    const response = await fetch(`/api/dashboard/widget/${widgetId}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const widget = await response.json();

    // Mostrar modal de configuração
    showConfigureWidgetModal(widget.widget_type, widget);
  } catch (error) {
    console.error(`Erro ao configurar widget ${widgetId}:`, error);
    alert('Erro ao configurar widget: ' + error.message);
  }
}

async function removeWidget(widgetId) {
  if (!confirm('Tem certeza que deseja remover este widget?')) return;

  try {
    const response = await fetch(`/api/dashboard/widget/${widgetId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const dashboardId = new URLSearchParams(window.location.search).get('id');
    alert('Widget removido com sucesso!');
    loadDashboard(dashboardId);
  } catch (error) {
    console.error(`Erro ao remover widget ${widgetId}:`, error);
    alert('Erro ao remover widget: ' + error.message);
  }
}

// Iniciar sistema de dashboards
DashboardService.scheduleDashboardUpdates();