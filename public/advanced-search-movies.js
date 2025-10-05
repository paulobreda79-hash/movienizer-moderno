// advanced-search-movies.js

document.addEventListener('DOMContentLoaded', () => {
  let movies = [];
  let filteredMovies = [];
  let currentPage = 1;
  const itemsPerPage = 8;

  // Carregar dados
  loadMovies();

  // Eventos
  document.getElementById('btn-search').addEventListener('click', performSearch);
  document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);
  document.getElementById('btn-update-all').addEventListener('click', updateAllData);
  document.getElementById('btn-download-results').addEventListener('click', downloadResults);
  document.getElementById('btn-prev').addEventListener('click', () => changePage(-1));
  document.getElementById('btn-next').addEventListener('click', () => changePage(1));
});

// Função para carregar filmes
async function loadMovies() {
  try {
    const response = await fetch('/api/movies');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    movies = await response.json();
    filteredMovies = [...movies];
    renderResults();
  } catch (error) {
    console.error('Erro ao carregar filmes:', error);
    alert('Erro ao carregar filmes.');
  }
}

// Função para realizar a busca avançada
function performSearch() {
  const title = document.getElementById('filter-title').value.toLowerCase();
  const yearMin = parseInt(document.getElementById('filter-year-min').value) || 1900;
  const yearMax = parseInt(document.getElementById('filter-year-max').value) || 2024;
  const genre = document.getElementById('filter-genre').value;
  const country = document.getElementById('filter-country').value.toLowerCase();
  const studio = document.getElementById('filter-studio').value.toLowerCase();
  const director = document.getElementById('filter-director').value.toLowerCase();
  const actor = document.getElementById('filter-actor').value.toLowerCase();
  const ratingMin = parseFloat(document.getElementById('filter-rating-min').value) || 0;
  const ratingMax = parseFloat(document.getElementById('filter-rating-max').value) || 10;
  const durationMin = parseInt(document.getElementById('filter-duration-min').value) || 0;
  const durationMax = parseInt(document.getElementById('filter-duration-max').value) || 300;
  const ratingAge = document.getElementById('filter-rating-age').value;
  const language = document.getElementById('filter-language').value.toLowerCase();
  const awards = document.getElementById('filter-awards').value;

  filteredMovies = movies.filter(movie => {
    const matchesTitle = title ? movie.title.toLowerCase().includes(title) : true;
    const matchesYear = movie.year >= yearMin && movie.year <= yearMax;
    const matchesGenre = genre === 'all' || JSON.parse(movie.genres || '[]').some(g => g.toLowerCase().includes(genre));
    const matchesCountry = country ? JSON.parse(movie.countries || '[]').some(c => c.toLowerCase().includes(country)) : true;
    const matchesStudio = studio ? movie.studio.toLowerCase().includes(studio) : true;
    const matchesDirector = director ? JSON.parse(movie.director || '[]').some(d => d.toLowerCase().includes(director)) : true;
    const matchesActor = actor ? JSON.parse(movie.cast || '[]').some(a => a.name.toLowerCase().includes(actor)) : true;
    const matchesRating = movie.rating_imdb >= ratingMin && movie.rating_imdb <= ratingMax;
    const matchesDuration = movie.duration >= durationMin && movie.duration <= durationMax;
    const matchesRatingAge = ratingAge === 'all' || movie.rating_age === ratingAge;
    const matchesLanguage = language ? movie.language.toLowerCase().includes(language) : true;
    const matchesAwards = awards === 'all' || JSON.parse(movie.awards || '[]').some(a => a.toLowerCase().includes(awards));

    return matchesTitle && matchesYear && matchesGenre && matchesCountry && matchesStudio &&
           matchesDirector && matchesActor && matchesRating && matchesDuration &&
           matchesRatingAge && matchesLanguage && matchesAwards;
  });

  // Ordenação
  const sortBy = document.getElementById('sort-by').value;
  filteredMovies.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'year') {
      return b.year - a.year; // Mais recente primeiro
    } else if (sortBy === 'rating') {
      return b.rating_imdb - a.rating_imdb; // Maior rating primeiro
    } else if (sortBy === 'duration') {
      return b.duration - a.duration; // Mais longos primeiro
    } else if (sortBy === 'popularity') {
      // Aqui você pode implementar um cálculo de popularidade
      return b.rating_imdb - a.rating_imdb; // Exemplo simples
    }
  });

  currentPage = 1;
  renderResults();
}

// Função para renderizar os resultados
function renderResults() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredMovies.slice(start, end);

  pageData.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => openMovieDetail(movie.id);

    card.innerHTML = `
      <img src="${movie.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${movie.title}" />
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="year">${movie.year}</div>
        <div class="rating">⭐ ${movie.rating_imdb || 'N/A'}</div>
        <div class="genre">${JSON.parse(movie.genres || '[]').join(', ')}</div>
      </div>
    `;

    grid.appendChild(card);
  });

  updatePagination();
}

// Função para limpar filtros
function resetFilters() {
  document.getElementById('filter-title').value = '';
  document.getElementById('filter-year-min').value = '';
  document.getElementById('filter-year-max').value = '';
  document.getElementById('filter-genre').value = 'all';
  document.getElementById('filter-country').value = '';
  document.getElementById('filter-studio').value = '';
  document.getElementById('filter-director').value = '';
  document.getElementById('filter-actor').value = '';
  document.getElementById('filter-rating-min').value = '';
  document.getElementById('filter-rating-max').value = '';
  document.getElementById('filter-duration-min').value = '';
  document.getElementById('filter-duration-max').value = '';
  document.getElementById('filter-rating-age').value = 'all';
  document.getElementById('filter-language').value = '';
  document.getElementById('filter-awards').value = 'all';
  document.getElementById('sort-by').value = 'title';

  filteredMovies = [...movies];
  currentPage = 1;
  renderResults();
}

// Função para atualizar todos os dados via scraper
async function updateAllData() {
  try {
    const response = await fetch('/api/download/movies/update-all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Dados atualizados via scraper!');
    loadMovies(); // Recarregar dados
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    alert('Erro ao atualizar dados.');
  }
}

// Função para exportar resultados
function downloadResults() {
  const dataStr = JSON.stringify(filteredMovies, null, 2);
  const dataUri = 'application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `busca-filmes-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Função para mudar página
function changePage(direction) {
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  currentPage += direction;

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  renderResults();
}

// Função para atualizar paginação
function updatePagination() {
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;

  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;
}

// Função para abrir detalhes do filme
function openMovieDetail(id) {
  window.location.href = `/movie-detail.html?id=${id}`;
}