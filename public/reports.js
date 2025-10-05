document.addEventListener('DOMContentLoaded', () => {
  let movies = [];
  let people = [];

  // Carregar dados
  loadReports();

  // Eventos
  document.getElementById('btn-generate-pdf').addEventListener('click', generatePDF);
  document.getElementById('btn-export-data').addEventListener('click', exportData);

  // Eventos de filtros
  document.querySelectorAll('.filter-group select').forEach(select => {
    select.addEventListener('change', loadReports);
  });
});

// Função para carregar relatórios
async function loadReports() {
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
    console.error('Erro ao carregar relatórios:', error);
    alert('Erro ao carregar relatórios.');
  }
}

// Função para aplicar filtros
function applyFilters(data, type = 'movies') {
  const periodFilter = document.getElementById('filter-period').value;
  const genreFilter = document.getElementById('filter-genre').value;
  const ratingFilter = document.getElementById('filter-rating').value;

  let filtered = data;

  // Filtro por período
  if (periodFilter !== 'all') {
    const currentYear = new Date().getFullYear();
    if (periodFilter === 'last-5-years') {
      filtered = filtered.filter(item => type === 'movies' ? item.year >= currentYear - 5 : true);
    } else if (periodFilter === 'last-year') {
      filtered = filtered.filter(item => type === 'movies' ? item.year === currentYear - 1 : true);
    } else if (periodFilter === 'last-month') {
      // Filtrar por mês (exemplo simplificado)
      filtered = filtered.filter(() => true); // Implementar lógica real
    } else if (periodFilter !== 'all' && !periodFilter.includes('-')) {
      filtered = filtered.filter(item => type === 'movies' ? item.year === parseInt(periodFilter) : true);
    }
  }

  // Filtro por gênero ou função
  if (genreFilter !== 'all') {
    filtered = filtered.filter(item => {
      if (type === 'movies') {
        const genresArray = Array.isArray(item.genres) ? item.genres : JSON.parse(item.genres || '[]');
        return genresArray.some(g => g.toLowerCase().includes(genreFilter));
      } else {
        const roleArray = Array.isArray(item.role) ? item.role : JSON.parse(item.role || '[]');
        return roleArray.some(r => r.toLowerCase().includes(genreFilter));
      }
    });
  }

  // Filtro por classificação
  if (ratingFilter !== 'all') {
    filtered = filtered.filter(item => type === 'movies' && item.rating_age === ratingFilter);
  }

  return filtered;
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

  // Atualizar PDF
  document.getElementById('pdf-total-movies').textContent = movies.length;
  document.getElementById('pdf-total-people').textContent = people.length;
  document.getElementById('pdf-avg-rating').textContent = avgRating;
  document.getElementById('pdf-movies-watched').textContent = watchedCount;
  document.getElementById('report-date').textContent = new Date().toLocaleDateString();
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
      plugins: { legend: { position: 'bottom' } }
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
      scales: { y: { beginAtZero: true } }
    }
  });

  // Gráfico: Rating Médio por Gênero
  const genreRatings = {};
  movies.forEach(movie => {
    const genresArray = Array.isArray(movie.genres) ? movie.genres : JSON.parse(movie.genres || '[]');
    genresArray.forEach(genre => {
      if (!genreRatings[genre]) genreRatings[genre] = { total: 0, count: 0 };
      genreRatings[genre].total += movie.rating_imdb || 0;
      genreRatings[genre].count++;
    });
  });

  const avgRatings = Object.keys(genreRatings).map(genre => (genreRatings[genre].total / genreRatings[genre].count).toFixed(2));

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
      scales: { y: { beginAtZero: true, max: 10 } }
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
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Função para renderizar a tabela de top filmes
function renderTopMoviesTable(movies) {
  const sortedMovies = [...movies].sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0)).slice(0, 10);

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

  // Atualizar PDF
  const pdfTbody = document.getElementById('pdf-top-movies-table').querySelector('tbody');
  pdfTbody.innerHTML = '';
  sortedMovies.forEach((movie, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${movie.title}</td>
      <td>${movie.year}</td>
      <td>⭐ ${movie.rating_imdb || 'N/A'}</td>
    `;
    pdfTbody.appendChild(row);
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

  const sortedActors = Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

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

// Função para gerar PDF
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 10;

  // Título
  doc.setFontSize(20);
  doc.text('Relatório de Estatísticas - MovieNizer', pageWidth / 2, 20, { align: 'center' });

  // Data
  const today = new Date();
  doc.setFontSize(12);
  doc.text(`Data: ${today.toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

  // Resumo
  doc.setFontSize(14);
  doc.text('Resumo Geral', margin, 45);
  doc.setFontSize(12);
  doc.text(`Total de Filmes: ${movies.length}`, margin, 55);
  doc.text(`Total de Pessoas: ${people.length}`, margin, 60);
  const avgRating = (movies.reduce((sum, movie) => sum + (movie.rating_imdb || 0), 0) / movies.length).toFixed(2);
  doc.text(`Média de Rating: ${avgRating}`, margin, 65);
  const watchedCount = movies.filter(m => m.watched).length;
  doc.text(`Filmes Vistos: ${watchedCount}`, margin, 70);

  // Gráficos
  const chartsContainer = document.getElementById('charts-container');
  const canvas = await html2canvas(chartsContainer);
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 180;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  doc.addImage(imgData, 'PNG', margin, 80, imgWidth, imgHeight);

  // Tabelas
  let yPos = 80 + imgHeight + 10;
  doc.text('Top 10 Melhores Filmes', margin, yPos);
  yPos += 10;

  const sortedMovies = [...movies].sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0)).slice(0, 10);
  sortedMovies.forEach((movie, index) => {
    doc.text(`${index + 1}. ${movie.title} (${movie.year}) - ⭐ ${movie.rating_imdb || 'N/A'}`, margin, yPos);
    yPos += 8;
  });

  doc.save(`relatorio-estatisticas-${today.toISOString().slice(0, 10)}.pdf`);
}

// Função para exportar dados
function exportData() {
  const data = {
    movies: movies,
    people: people
  };
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `dados-exportados-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

