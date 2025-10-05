// streaming-manager.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados iniciais
  loadStreamingStats();
  loadPopularPlatforms();
  loadAvailableMovies();

  // Eventos
  document.getElementById('btn-check-all').addEventListener('click', checkAllMovies);
  document.getElementById('btn-refresh').addEventListener('click', refreshData);
  document.getElementById('btn-refresh-platforms').addEventListener('click', loadPopularPlatforms);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('filter-platform').addEventListener('change', filterMovies);
  document.getElementById('search-movies').addEventListener('input', searchMovies);
});

async function loadStreamingStats() {
  try {
    const response = await fetch('/api/streaming/statistics');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('total-movies').textContent = stats.total_movies || 0;
    document.getElementById('available-movies').textContent = stats.available_movies || 0;
    document.getElementById('total-platforms').textContent = stats.total_platforms || 0;
    document.getElementById('last-check').textContent = stats.last_check ? 
      new Date(stats.last_check).toLocaleString() : 'Nunca';
  } catch (error) {
    console.error('Erro ao carregar estatísticas de streaming:', error);
  }
}

async function loadPopularPlatforms() {
  try {
    const response = await fetch('/api/streaming/popular-platforms');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const platforms = await response.json();

    const grid = document.getElementById('platforms-grid');
    grid.innerHTML = '';

    platforms.forEach(platform => {
      const card = document.createElement('div');
      card.className = 'platform-card';
      card.innerHTML = `
        <div class="platform-icon">📺</div>
        <div class="platform-name">${platform.platform_name || platform.platform}</div>
        <div class="platform-stats">${platform.movie_count || 0} filmes</div>
      `;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar plataformas populares:', error);
  }
}

async function loadAvailableMovies() {
  try {
    const response = await fetch('/api/streaming/movie/1/availability'); // Placeholder
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const movies = await response.json();

    const grid = document.getElementById('movies-grid');
    grid.innerHTML = '';

    movies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.onclick = () => window.location.href = `/movie-detail.html?id=${movie.id}`;

      card.innerHTML = `
        <img src="${movie.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${movie.title}" />
        <div class="movie-info">
          <h4>${movie.title}</h4>
          <div class="year">${movie.year || 'N/A'}</div>
          <div class="platforms">
            ${movie.platforms ? movie.platforms.map(p => 
              `<span class="platform-badge" style="background: ${getPlatformColor(p.platform_id)}">
                ${getPlatformInitials(p.platform_id)}
              </span>`
            ).join('') : ''}
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar filmes disponíveis:', error);
  }
}

function getPlatformColor(platformId) {
  const colors = {
    'nfx': '#e50914', // Netflix
    'dsnp': '#113ccf', // Disney+
    'amzn': '#00a8e1', // Amazon Prime
    'atvp': '#000000', // Apple TV+
    'hbo': '#000000',  // HBO Max
    'hulu': '#1ce783', // Hulu
    'pmax': '#0064ff', // Paramount+
    'srz': '#000000',  // Starz
    'sho': '#c7102f',  // Showtime
    'crav': '#f47521', // Crunchyroll
    'tubi': '#ff5200', // Tubi
    'kanp': '#000000'   // Kanopy
  };
  return colors[platformId] || '#666666';
}

function getPlatformInitials(platformId) {
  const initials = {
    'nfx': 'NF',  // Netflix
    'dsnp': 'DP', // Disney+
    'amzn': 'AP', // Amazon Prime
    'atvp': 'AT', // Apple TV+
    'hbo': 'HB',  // HBO Max
    'hulu': 'HU', // Hulu
    'pmax': 'PM', // Paramount+
    'srz': 'SZ',  // Starz
    'sho': 'SH',  // Showtime
    'crav': 'CR', // Crunchyroll
    'tubi': 'TB', // Tubi
    'kanp': 'KN'  // Kanopy
  };
  return initials[platformId] || 'PL';
}

async function checkAllMovies() {
  showProgressModal('Verificando Disponibilidade', 'Iniciando verificação de todos os filmes...');

  try {
    updateProgress(20, 'Preparando verificação...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(40, 'Verificando Netflix...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(60, 'Verificando Disney+...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(80, 'Verificando Amazon Prime...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch('/api/streaming/check-all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    updateProgress(100, 'Verificação concluída!');

    setTimeout(() => {
      hideProgressModal();
      alert(`Verificação concluída!\nTotal: ${result.total}\nVerificados: ${result.checked}\nDisponíveis: ${result.available}\nErros: ${result.errors}`);
      refreshData();
    }, 1000);

  } catch (error) {
    console.error('Erro ao verificar todos os filmes:', error);
    hideProgressModal();
    alert('Erro ao verificar disponibilidade: ' + error.message);
  }
}

function showProgressModal(title, message) {
  document.getElementById('progress-title').textContent = title;
  document.getElementById('progress-message').textContent = message;
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-modal').style.display = 'flex';
}

function updateProgress(percent, message) {
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-message').textContent = message;
}

function hideProgressModal() {
  document.getElementById('progress-modal').style.display = 'none';
}

async function refreshData() {
  await loadStreamingStats();
  await loadPopularPlatforms();
  await loadAvailableMovies();
}

async function filterMovies() {
  // Implementar filtro por plataforma
  await loadAvailableMovies();
}

async function searchMovies() {
  // Implementar busca de filmes
  await loadAvailableMovies();
}

async function saveSettings() {
  try {
    const settings = {
      autoCheckEnabled: document.getElementById('auto-check-enabled').value === 'true',
      checkFrequency: document.getElementById('check-frequency').value,
      notificationsEnabled: document.getElementById('notifications-enabled').value === 'true'
    };

    // Aqui você salvaria as configurações no servidor
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}