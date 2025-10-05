document.addEventListener('DOMContentLoaded', () => {
  let movies = [];
  let people = [];

  // Carregar dados
  loadStatistics();

  // Eventos
  document.getElementById('btn-refresh-data').addEventListener('click', loadStatistics);
  document.getElementById('btn-export-data').addEventListener('click', exportData);

  // Eventos de filtros
  document.querySelectorAll('.filter-group select').forEach(select => {
    select.addEventListener('change', loadStatistics);
  });
});

// Função para carregar estatísticas
async function loadStatistics() {
  try {
    // Carregar filmes e pessoas
    const [moviesResponse, peopleResponse] = await Promise.all([
      fetch('/api/movies'),
      fetch('/api/people')
    ]);

    if (!moviesResponse.ok || !peopleResponse.ok) {
      throw new Error('Erro ao carregar dados');
    }

    movies = await moviesResponse.json();
    people = await peopleResponse.json();

    // Aplicar filtros
    const filteredMovies = applyFilters(movies);
    const filteredPeople = applyFilters(people, 'people');

    // Renderizar estatísticas
    renderSummaryStats(filteredMovies, filteredPeople);
    renderCharts(filteredMovies, filteredPeople);
    renderTopMoviesTable(filteredMovies);
    renderTopActorsTable(filteredPeople);

  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    alert('Erro ao carregar estatísticas.');
  }
}

// Função para aplicar filtros
function applyFilters(data, type = 'movies') {
  const yearFilter = document.getElementById('filter-year').value;
  const genreFilter = document.getElementById('filter-genre').value;
  const ratingFilter = document.getElementById('filter-rating').value;
  const originFilter = document.getElementById('filter-origin').value;

  return data.filter(item => {
    let matches = true;

    if (type === 'movies') {
      // Filtro por ano
      if (yearFilter !== 'all') {
        if (yearFilter.includes('-')) {
          const [start, end] = yearFilter.split('-').map(Number);
          matches = matches && item.year >= start && item.year <= end;
        } else {
          matches = matches && item.year === parseInt(yearFilter);
        }
      }

      // Filtro por gênero
      if (genreFilter !== 'all') {
        const genresArray = Array.isArray(item.genres) ? item.genres : JSON.parse(item.genres || '[]');
        matches = matches && genresArray.some(g => g.toLowerCase().includes(genreFilter));
      }

      // Filtro por classificação
      if (ratingFilter !== 'all') {
        matches = matches && item.rating_age === ratingFilter;
      }

      // Filtro por origem
      if (originFilter !== 'all') {
        const countriesArray = Array.isArray(item.countries) ? item.countries : JSON.parse(item.countries || '[]');
        matches = matches && countriesArray.some(c => c.toLowerCase().includes(originFilter));
      }
    } else if (type === 'people') {
      // Filtros para pessoas (ex: função)
      if (genreFilter !== 'all') {
        const roleArray = Array.isArray(item.role) ? item.role : JSON.parse(item.role || '[]');
        matches = matches && roleArray.some(r => r.toLowerCase().includes(genreFilter));
      }
    }

    return matches;
  });
}

// Função para renderizar estatísticas resumidas
function renderSummaryStats(movies, people) {
  document.getElementById('total-movies').textContent = movies.length;
  document.getElementById('total-people').textContent = people.length;

  const avgRating = movies.length > 0
    ? (movies.reduce((sum, movie) => sum + (movie.rating_imdb || 0), 0) / movies.length).toFixed(2)
    : '0.0';
  document.getElementById('avg-rating').textContent = avgRating;

  const watchedCount = movies.filter(m => m.watched).length;
  document.getElementById('movies-watched').textContent = watchedCount;
}

// Função para renderizar gráficos
function renderCharts(movies, people) {
  // Gráfico: Filmes por Gênero
  const genreCounts = {};
  movies.forEach(movie => {
    const genresArray = Array.isArray(movie.genres) ? movie.genres : JSON.parse(movie.genres || '[]');
    genresArray.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const genreCtx = document.getElementById('chart-genres').getContext('2d');
  if (window.genreChart) window.genreChart.destroy();
  window.genreChart = new Chart(genreCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(genreCounts),
      datasets: [{
        data: Object.values(genreCounts),
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

  // Gráfico: Filmes por Ano
  const yearCounts = {};
  movies.forEach(movie => {
    yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
  });

  const sortedYears = Object.keys(yearCounts).sort();

  const yearCtx = document.getElementById('chart-years').getContext('2d');
  if (window.yearChart) window.yearChart.destroy();
  window.yearChart = new Chart(yearCtx, {
    type: 'line',
    data: {
      labels: sortedYears,
      datasets: [{
        label: 'Filmes por Ano',
        data: sortedYears.map(year => yearCounts[year]),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        tension: 0.1
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

  // Gráfico: Rating Médio por Gênero
  const genreRatings = {};
  movies.forEach(movie => {
    const genresArray = Array.isArray(movie.genres) ? movie.genres : JSON.parse(movie.genres || '[]');
    genresArray.forEach(genre => {
      if (!genreRatings[genre]) {
        genreRatings[genre] = { total: 0, count: 0 };
      }
      genreRatings[genre].total += movie.rating_imdb || 0;
      genreRatings[genre].count++;
    });
  });

  const avgRatings = Object.keys(genreRatings).map(genre => {
    return (genreRatings[genre].total / genreRatings[genre].count).toFixed(2);
  });

  const ratingCtx = document.getElementById('chart-rating-by-genre').getContext('2d');
  if (window.ratingChart) window.ratingChart.destroy();
  window.ratingChart = new Chart(ratingCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(genreRatings),
      datasets: [{
        label: 'Rating Médio',
        data: avgRatings,
        backgroundColor: '#2ecc71'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 10
        }
      }
    }
  });

  // Gráfico: Pessoas por Função
  const roleCounts = {};
  people.forEach(person => {
    const roleArray = Array.isArray(person.role) ? person.role : JSON.parse(person.role || '[]');
    roleArray.forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
  });

  const roleCtx = document.getElementById('chart-roles').getContext('2d');
  if (window.roleChart) window.roleChart.destroy();
  window.roleChart = new Chart(roleCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(roleCounts),
      datasets: [{
        data: Object.values(roleCounts),
        backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']
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
}

// Função para renderizar a tabela de top filmes
function renderTopMoviesTable(movies) {
  const sortedMovies = [...movies]
    .sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0))
    .slice(0, 10);

  const tbody = document.getElementById('top-movies-table').querySelector('tbody');
  tbody.innerHTML = '';

  sortedMovies.forEach((movie, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${movie.title}</td>
      <td>${movie.year}</td>
      <td>⭐ ${movie.rating_imdb || 'N/A'}</td>
    `;
    tbody.appendChild(row);
  });
}

// Função para renderizar a tabela de top atores
function renderTopActorsTable(people) {
  const actorCounts = {};
  people.forEach(person => {
    const roleArray = Array.isArray(person.role) ? person.role : JSON.parse(person.role || '[]');
    if (roleArray.includes('ator')) {
      actorCounts[person.name] = (person.movies ? JSON.parse(person.movies).length : 0);
    }
  });

  const sortedActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const tbody = document.getElementById('top-actors-table').querySelector('tbody');
  tbody.innerHTML = '';

  sortedActors.forEach(([name, count], index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${name}</td>
      <td>${count} filmes</td>
    `;
    tbody.appendChild(row);
  });
}

// Função para exportar dados
function exportData() {
  const data = {
    movies: movies,
    people: people
  };
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `estatisticas-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}
