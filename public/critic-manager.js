// critic-manager.js

document.addEventListener('DOMContentLoaded', () => {
  let ratings = [];
  let sources = [];
  let changes = [];

  // Carregar dados iniciais
  loadCriticStats();
  loadSources();
  loadRecentRatings();
  loadRecentChanges();

  // Eventos
  document.getElementById('btn-update-all').addEventListener('click', updateAllRatings);
  document.getElementById('btn-refresh').addEventListener('click', refreshData);
  document.getElementById('btn-refresh-sources').addEventListener('click', loadSources);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('filter-source').addEventListener('change', filterRatings);
  document.getElementById('search-ratings').addEventListener('input', searchRatings);
  document.getElementById('filter-changes-days').addEventListener('change', loadRecentChanges);

  // Atualizar dados a cada 30 segundos
  setInterval(refreshData, 30000);
});

async function loadCriticStats() {
  try {
    const response = await fetch('/api/critic/statistics');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('total-ratings').textContent = stats.total_ratings || 0;
    document.getElementById('active-sources').textContent = stats.active_sources || 0;
    document.getElementById('overall-average').textContent = stats.overall_average || '0.0';
    document.getElementById('last-update').textContent = stats.last_update ? 
      new Date(stats.last_update).toLocaleString() : 'Nunca';
  } catch (error) {
    console.error('Erro ao carregar estatísticas de críticas:', error);
  }
}

async function loadSources() {
  try {
    const response = await fetch('/api/critic/sources');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    sources = await response.json();

    const grid = document.getElementById('sources-grid');
    grid.innerHTML = '';

    const filterSelect = document.getElementById('filter-source');
    filterSelect.innerHTML = '<option value="all">Todas as Fontes</option>';

    sources.forEach(source => {
      // Grid de fontes
      const card = document.createElement('div');
      card.className = 'source-card';
      card.onclick = () => window.location.href = `/source-detail.html?id=${source.id}`;

      card.innerHTML = `
        <div class="source-icon">${source.icon}</div>
        <div class="source-name">${source.name}</div>
        <div class="source-stats">${source.rating_count || 0} ratings</div>
      `;

      grid.appendChild(card);

      // Opções de filtro
      const option = document.createElement('option');
      option.value = source.id;
      option.textContent = source.name;
      filterSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar fontes de crítica:', error);
  }
}

async function loadRecentRatings() {
  try {
    const response = await fetch('/api/critic/recent');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    ratings = await response.json();

    renderRatingsGrid();
  } catch (error) {
    console.error('Erro ao carregar ratings recentes:', error);
  }
}

async function loadRecentChanges() {
  try {
    const days = document.getElementById('filter-changes-days').value;
    const response = await fetch(`/api/critic/changes?days=${days}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    changes = await response.json();

    const list = document.getElementById('changes-list');
    list.innerHTML = '';

    if (changes.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #777;">Nenhuma mudança encontrada.</p>';
      return;
    }

    changes.forEach(change => {
      const item = document.createElement('div');
      item.className = `change-item ${change.type}`;

      const date = new Date(change.last_updated);
      const oldRating = change.previous_rating || 0;
      const newRating = change.current_rating || 0;
      const difference = newRating - oldRating;
      const sign = difference > 0 ? '+' : '';

      item.innerHTML = `
        <div class="change-header">
          <h4 class="change-title">${change.title} (${change.year})</h4>
          <div class="change-source">${getCriticSourceName(change.api_source)}</div>
        </div>
        <div class="change-details">
          <div class="change-old-rating">${oldRating.toFixed(1)}</div>
          <div class="change-new-rating">${newRating.toFixed(1)}</div>
          <div class="change-difference ${difference > 0 ? 'positive' : 'negative'}">
            ${sign}${difference.toFixed(1)}
          </div>
        </div>
        <div class="change-time">${date.toLocaleString()}</div>
      `;

      list.appendChild(item);
    });
  } catch (error) {
    console.error('Erro ao carregar mudanças recentes:', error);
  }
}

function renderRatingsGrid() {
  const grid = document.getElementById('ratings-grid');
  grid.innerHTML = '';

  const filteredRatings = applyFilters(ratings);

  if (filteredRatings.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #777; grid-column: 1 / -1;">Nenhum rating encontrado.</p>';
    return;
  }

  filteredRatings.forEach(rating => {
    const card = document.createElement('div');
    card.className = 'rating-card';
    card.onclick = () => window.location.href = `/movie-detail.html?id=${rating.movie_id}`;

    card.innerHTML = `
      <img src="${rating.poster || 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${rating.title}" />
      <div class="rating-info">
        <h4>${rating.title}</h4>
        <div class="year">${rating.year}</div>
        <div class="source">${getCriticSourceName(rating.api_source)}</div>
        <div class="rating-value">⭐ ${rating.rating_value || 'N/A'}</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function getCriticSourceName(sourceId) {
  const sources = {
    'imdb': 'IMDb',
    'rt': 'Rotten Tomatoes',
    'lbxd': 'Letterboxd',
    'fa': 'FilmAffinity',
    'trakt': 'Trakt.tv',
    'mc': 'Metacritic',
    'tmdb': 'TMDb'
  };
  return sources[sourceId] || sourceId;
}

function applyFilters(ratings) {
  const sourceFilter = document.getElementById('filter-source').value;
  const searchFilter = document.getElementById('search-ratings').value.toLowerCase();

  return ratings.filter(rating => {
    const matchesSource = sourceFilter === 'all' || rating.api_source === sourceFilter;
    const matchesSearch = searchFilter ? 
      rating.title.toLowerCase().includes(searchFilter) : true;
    
    return matchesSource && matchesSearch;
  });
}

function filterRatings() {
  renderRatingsGrid();
}

function searchRatings() {
  renderRatingsGrid();
}

async function updateAllRatings() {
  if (!confirm('Tem certeza que deseja atualizar todos os ratings? Isso pode levar alguns minutos.')) return;

  try {
    const response = await fetch('/api/critic/update-all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert(`Atualização concluída!\nTotal: ${result.total}\nAtualizados: ${result.checked}\nDisponíveis: ${result.available}\nErros: ${result.errors}`);
    refreshData();
  } catch (error) {
    console.error('Erro ao atualizar todos os ratings:', error);
    alert('Erro ao atualizar todos os ratings: ' + error.message);
  }
}

async function refreshData() {
  await loadCriticStats();
  await loadSources();
  await loadRecentRatings();
  await loadRecentChanges();
}

async function saveSettings() {
  try {
    const settings = {
      autoUpdateEnabled: document.getElementById('auto-update-enabled').value === 'true',
      updateFrequency: document.getElementById('update-frequency').value,
      notificationsEnabled: document.getElementById('notifications-enabled').value === 'true'
    };

    // Aqui você salvaria as configurações no servidor
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}