// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  const sessionId = localStorage.getItem('sessionId');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!sessionId) {
    window.location.href = '/login.html';
    return;
  }

  // Carregar dados do usuário
  loadUserData(sessionId, user);
  loadDashboardData(sessionId);

  // Eventos
  document.getElementById('btn-logout').addEventListener('click', logout);
});

async function loadUserData(sessionId, user) {
  document.getElementById('username').textContent = user.username;

  try {
    const response = await fetch(`/api/auth/me?sessionId=${sessionId}`);
    const userData = await response.json();
    
    if (userData.user) {
      document.getElementById('username').textContent = userData.user.username;
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
}

async function loadDashboardData(sessionId) {
  try {
    // Carregar filmes do usuário
    const moviesResponse = await fetch('/api/movies');
    const movies = await moviesResponse.json();

    document.getElementById('my-movies-count').textContent = movies.length;

    // Carregar favoritos
    const favoriteMovies = movies.filter(m => m.favorite);
    document.getElementById('my-favorites-count').textContent = favoriteMovies.length;

    // Carregar últimos filmes
    const recentMovies = [...movies]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    const container = document.getElementById('recent-movies');
    container.innerHTML = '';

    recentMovies.forEach(movie => {
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

  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }
}

async function logout() {
  const sessionId = localStorage.getItem('sessionId');

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    });

    // Limpar dados locais
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');

    // Redirecionar para login
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}