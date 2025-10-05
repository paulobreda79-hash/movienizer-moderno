document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados
  loadDashboardData();

  // Eventos de navegação
  document.getElementById('nav-dashboard').addEventListener('click', () => window.location.href = '/');
  document.getElementById('nav-movies').addEventListener('click', () => window.location.href = '/movies-list.html');
  document.getElementById('nav-people').addEventListener('click', () => window.location.href = '/people-list.html');
  document.getElementById('nav-search').addEventListener('click', () => window.location.href = '/advanced-search-movies.html');
  document.getElementById('nav-reports').addEventListener('click', () => window.location.href = '/reports.html');
  document.getElementById('nav-settings').addEventListener('click', () => alert('Configurações ainda não implementadas'));

  // Eventos de ações
  document.getElementById('btn-search').addEventListener('click', () => window.location.href = '/advanced-search-movies.html');
  document.getElementById('btn-add').addEventListener('click', () => window.location.href = '/movie-detail.html?id=new');
});

// Função para carregar dados do dashboard
async function loadDashboardData() {
  try {
    // Carregar filmes e pessoas
    const [moviesResponse, peopleResponse] = await Promise.all([
      fetch('/api/movies'),
      fetch('/api/people')
    ]);

    if (!moviesResponse.ok || !peopleResponse.ok) {
      throw new Error('Erro ao carregar dados');
    }

    const movies = await moviesResponse.json();
    const people = await peopleResponse.json();

    // Atualizar estatísticas
    updateStats(movies, people);

    // Renderizar gráfico
    renderGenreChart(movies);

    // Renderizar seções
    renderRecentMovies(movies);
    renderTopRatedMovies(movies);
    renderFavoritePeople(people);

  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    alert('Erro ao carregar dados do dashboard.');
  }
}

// Função para atualizar estatísticas
function updateStats(movies, people) {
  document.getElementById('total-movies').textContent = movies.length;
  document.getElementById('total-people').textContent = people.length;

  const avgRating = movies.length > 0
    ? (movies.reduce((sum, movie) => sum + (movie.rating_imdb || 0), 0) / movies.length).toFixed(2)
    : '0.0';
  document.getElementById('avg-rating').textContent = avgRating;

  const watchedCount = movies.filter(m => m.watched).length;
  document.getElementById('movies-watched').textContent = watchedCount;
}

// Função para renderizar gráfico de gêneros (corrigido!)
function renderGenreChart(movies) {
  const genreCounts = {};
  movies.forEach(movie => {
    JSON.parse(movie.genres || '[]').forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const ctx = document.getElementById('genre-chart').getContext('2d');
  if (window.genreChart) window.genreChart.destroy();
  window.genreChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(genreCounts),
      datasets: [{
        label: 'Filmes por Gênero',
        data: Object.values(genreCounts),
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Função para renderizar filmes recentes
function renderRecentMovies(movies) {
  const recent = [...movies]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  const container = document.getElementById('recent-movies');
  container.innerHTML = '';

  recent.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => window.location.href = `/movie-detail.html?id=${movie.id}`;
    card.innerHTML = `
      <img src="${movie.poster || 'https://via.placeholder.com/180x260?text=No+Image'}" alt="${movie.title}" />
      <div class="movie-info">
        <h4>${movie.title}</h4>
        <div class="rating">⭐ ${movie.rating_imdb || 'N/A'}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Função para renderizar filmes mais bem avaliados
function renderTopRatedMovies(movies) {
  const topRated = [...movies]
    .sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0))
    .slice(0, 6);

  const container = document.getElementById('top-rated-movies');
  container.innerHTML = '';

  topRated.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => window.location.href = `/movie-detail.html?id=${movie.id}`;
    card.innerHTML = `
      <img src="${movie.poster || 'https://via.placeholder.com/180x260?text=No+Image'}" alt="${movie.title}" />
      <div class="movie-info">
        <h4>${movie.title}</h4>
        <div class="rating">⭐ ${movie.rating_imdb || 'N/A'}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Função para renderizar pessoas favoritas
function renderFavoritePeople(people) {
  const favorites = people.filter(p => p.favorite).slice(0, 6);

  const container = document.getElementById('favorite-people');
  container.innerHTML = '';

  favorites.forEach(person => {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.onclick = () => window.location.href = `/person-detail.html?id=${person.id}`;

    card.innerHTML = `
      <img src="${person.image || 'https://via.placeholder.com/180x260?text=No+Image'}" alt="${person.name}" />
      <div class="person-info">
        <h4>${person.name}</h4>
        <div class="role">${JSON.parse(person.role || '[]').join(', ')}</div>
      </div>
    `;

    container.appendChild(card);
  });
}
