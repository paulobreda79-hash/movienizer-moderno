// advanced-search-people.js

document.addEventListener('DOMContentLoaded', () => {
  let people = [];
  let filteredPeople = [];
  let currentPage = 1;
  const itemsPerPage = 8;

  // Carregar dados
  loadPeople();

  // Eventos
  document.getElementById('btn-search').addEventListener('click', performSearch);
  document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);
  document.getElementById('btn-update-all').addEventListener('click', updateAllData);
  document.getElementById('btn-download-results').addEventListener('click', downloadResults);
  document.getElementById('btn-prev').addEventListener('click', () => changePage(-1));
  document.getElementById('btn-next').addEventListener('click', () => changePage(1));
});

// Função para carregar pessoas
async function loadPeople() {
  try {
    const response = await fetch('/api/people');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    people = await response.json();
    filteredPeople = [...people];
    renderResults();
  } catch (error) {
    console.error('Erro ao carregar pessoas:', error);
    alert('Erro ao carregar pessoas.');
  }
}

// Função para realizar a busca avançada
function performSearch() {
  const name = document.getElementById('filter-name').value.toLowerCase();
  const role = document.getElementById('filter-role').value;
  const birthYearMin = parseInt(document.getElementById('filter-birth-year-min').value) || 0;
  const birthYearMax = parseInt(document.getElementById('filter-birth-year-max').value) || 2024;
  const birthPlace = document.getElementById('filter-birth-place').value.toLowerCase();
  const movieTitle = document.getElementById('filter-movie-title').value.toLowerCase();
  const movieGenre = document.getElementById('filter-movie-genre').value;
  const movieYearMin = parseInt(document.getElementById('filter-movie-year-min').value) || 0;
  const movieYearMax = parseInt(document.getElementById('filter-movie-year-max').value) || 2024;
  const studio = document.getElementById('filter-studio').value.toLowerCase();

  filteredPeople = people.filter(person => {
    const matchesName = name ? person.name.toLowerCase().includes(name) : true;
    const matchesRole = role === 'all' || JSON.parse(person.role || '[]').some(r => r.toLowerCase().includes(role));
    const birthYear = person.birth_date ? parseInt(person.birth_date.split('-')[0]) : 0;
    const matchesBirthYear = birthYear >= birthYearMin && birthYear <= birthYearMax;
    const matchesBirthPlace = birthPlace ? person.birth_place.toLowerCase().includes(birthPlace) : true;

    // Filtrar filmes
    let matchesMovie = true;
    if (movieTitle || movieGenre !== 'all' || studio || movieYearMin > 0 || movieYearMax < 2024) {
      matchesMovie = person.movies ? JSON.parse(person.movies).some(movie => {
        const titleMatch = movieTitle ? movie.title.toLowerCase().includes(movieTitle) : true;
        const genreMatch = movieGenre === 'all' || movie.genre.toLowerCase().includes(movieGenre);
        const yearMatch = movie.year >= movieYearMin && movie.year <= movieYearMax;
        const studioMatch = studio ? movie.studio.toLowerCase().includes(studio) : true;

        return titleMatch && genreMatch && yearMatch && studioMatch;
      }) : false;
    }

    return matchesName && matchesRole && matchesBirthYear && matchesBirthPlace && matchesMovie;
  });

  // Ordenação
  const sortBy = document.getElementById('sort-by').value;
  filteredPeople.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'birth-year') {
      const aYear = a.birth_date ? parseInt(a.birth_date.split('-')[0]) : 0;
      const bYear = b.birth_date ? parseInt(b.birth_date.split('-')[0]) : 0;
      return bYear - aYear;
    } else if (sortBy === 'role') {
      return JSON.parse(a.role || '[]')[0].localeCompare(JSON.parse(b.role || '[]')[0]);
    } else if (sortBy === 'movie-count') {
      return (b.movies ? JSON.parse(b.movies).length : 0) - (a.movies ? JSON.parse(a.movies).length : 0);
    } else if (sortBy === 'popularity') {
      // Aqui você pode implementar um cálculo de popularidade
      return (b.movies ? JSON.parse(b.movies).length : 0) - (a.movies ? JSON.parse(a.movies).length : 0);
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
  const pageData = filteredPeople.slice(start, end);

  pageData.forEach(person => {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.onclick = () => openPersonDetail(person.id);

    card.innerHTML = `
      <img src="${person.image || 'https://via.placeholder.com/300x400?text=No+Image'}" alt="${person.name}" />
      <div class="person-info">
        <h3>${person.name}</h3>
        <div class="role">${JSON.parse(person.role || '[]').join(', ')}</div>
        <div class="birth-year">${person.birth_date || 'N/A'}</div>
        <div class="movie-count">${person.movies ? JSON.parse(person.movies).length : 0} filmes</div>
      </div>
    `;

    grid.appendChild(card);
  });

  updatePagination();
}

// Função para limpar filtros
function resetFilters() {
  document.getElementById('filter-name').value = '';
  document.getElementById('filter-role').value = 'all';
  document.getElementById('filter-birth-year-min').value = '';
  document.getElementById('filter-birth-year-max').value = '';
  document.getElementById('filter-birth-place').value = '';
  document.getElementById('filter-movie-title').value = '';
  document.getElementById('filter-movie-genre').value = 'all';
  document.getElementById('filter-movie-year-min').value = '';
  document.getElementById('filter-movie-year-max').value = '';
  document.getElementById('filter-studio').value = '';
  document.getElementById('sort-by').value = 'name';

  filteredPeople = [...people];
  currentPage = 1;
  renderResults();
}

// Função para atualizar todos os dados via scraper
async function updateAllData() {
  try {
    const response = await fetch('/api/download/people/update-all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Dados atualizados via scraper!');
    loadPeople(); // Recarregar dados
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    alert('Erro ao atualizar dados.');
  }
}

// Função para exportar resultados
function downloadResults() {
  const dataStr = JSON.stringify(filteredPeople, null, 2);
  const dataUri = 'application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `busca-pessoas-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Função para mudar página
function changePage(direction) {
  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  currentPage += direction;

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  renderResults();
}

// Função para atualizar paginação
function updatePagination() {
  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;

  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;
}

// Função para abrir detalhes da pessoa
function openPersonDetail(id) {
  window.location.href = `/person-detail.html?id=${id}`;
}