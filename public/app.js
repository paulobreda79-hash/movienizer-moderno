document.addEventListener('DOMContentLoaded', () => {
  // Elementos principais
  const tabs = document.querySelectorAll('.tab');
  const movieGrid = document.getElementById('movie-grid');
  const searchInput = document.getElementById('quick-search');
  const addMovieBtn = document.getElementById('add-movie');
  const addPersonBtn = document.getElementById('add-person');
  const sidebarLinks = document.querySelectorAll('.sidebar a');
  const movieCards = document.querySelectorAll('.movie-card');

  // Simulação de dados locais
  let movies = [
    {
      id: 1,
      title: "Exemplo Filme",
      year: 2024,
      poster: "https://image.tmdb.org/t/p/w300/placeholder.jpg",
      imdbRating: 8.5,
      personalRating: 5,
      watched: false,
      favorite: true
    },
    {
      id: 2,
      title: "Outro Filme",
      year: 2023,
      poster: "https://image.tmdb.org/t/p/w300/placeholder2.jpg",
      imdbRating: 7.2,
      personalRating: 4,
      watched: true,
      favorite: false
    },
    {
      id: 3,
      title: "Filme de Ação",
      year: 2022,
      poster: "https://image.tmdb.org/t/p/w300/placeholder3.jpg",
      imdbRating: 9.0,
      personalRating: 5,
      watched: false,
      favorite: true
    }
  ];

  // Função para renderizar filmes no grid
  function renderMovies(moviesToRender) {
    movieGrid.innerHTML = '';

    moviesToRender.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.id = movie.id;

      // Gerar estrelas de rating pessoal
      const stars = '⭐'.repeat(movie.personalRating) + '☆'.repeat(5 - movie.personalRating);

      card.innerHTML = `
        <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
        <div class="movie-info">
          <h4>${movie.title} (${movie.year})</h4>
          <div class="movie-meta">
            <span class="imdb-rating">IMDb: ${movie.imdbRating}</span>
            <span class="personal-rating">${stars}</span>
          </div>
          <div class="movie-actions">
            <i class="fas fa-eye ${movie.watched ? 'watched' : ''}" title="Marcar como visto"></i>
            <i class="fas fa-heart ${movie.favorite ? 'favorite' : ''}" title="Adicionar aos favoritos"></i>
            <i class="fas fa-ellipsis-h" title="Mais opções"></i>
          </div>
        </div>
      `;

      // Eventos para os ícones
      const eyeIcon = card.querySelector('.fa-eye');
      const heartIcon = card.querySelector('.fa-heart');

      eyeIcon.addEventListener('click', () => toggleWatched(movie.id));
      heartIcon.addEventListener('click', () => toggleFavorite(movie.id));

      movieGrid.appendChild(card);
    });
  }

  // Função para marcar como visto
  function toggleWatched(id) {
    const movie = movies.find(m => m.id == id);
    if (movie) {
      movie.watched = !movie.watched;
      renderMovies(movies);
    }
  }

  // Função para marcar como favorito
  function toggleFavorite(id) {
    const movie = movies.find(m => m.id == id);
    if (movie) {
      movie.favorite = !movie.favorite;
      renderMovies(movies);
    }
  }

  // Eventos das abas
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabType = tab.dataset.tab;

      let filteredMovies = movies;

      switch (tabType) {
        case 'added':
          // Ordenar por ordem de adição (id mais alto primeiro)
          filteredMovies = [...movies].sort((a, b) => b.id - a.id);
          break;
        case 'updated':
          // Simular atualizados (mesmo que adicionados por agora)
          filteredMovies = [...movies].sort((a, b) => b.id - a.id);
          break;
        case 'best':
          // Filtrar por melhor nota IMDB
          filteredMovies = [...movies].sort((a, b) => b.imdbRating - a.imdbRating);
          break;
        case 'unseen':
          // Filtrar por não vistos
          filteredMovies = movies.filter(m => !m.watched);
          break;
        case 'favorites':
          // Filtrar por favoritos
          filteredMovies = movies.filter(m => m.favorite);
          break;
      }

      renderMovies(filteredMovies);
    });
  });

  // Evento de busca
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    if (!query) {
      renderMovies(movies);
      return;
    }

    const filtered = movies.filter(movie =>
      movie.title.toLowerCase().includes(query) ||
      movie.year.toString().includes(query)
    );
    renderMovies(filtered);
  });

  // Botão de adicionar filme
  addMovieBtn.addEventListener('click', () => {
    alert('Funcionalidade de adicionar filme ativada!');
    // Aqui você pode abrir um modal ou navegar para a página de adicionar filme
    // Exemplo:
    // openAddMovieModal();
  });

  // Botão de adicionar pessoa
  addPersonBtn.addEventListener('click', () => {
    alert('Funcionalidade de adicionar pessoa ativada!');
    // openAddPersonModal();
  });

  // Navegação no menu lateral
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.getAttribute('href');
      console.log('Navegando para:', target);

      // Aqui você pode carregar conteúdo dinamicamente
      // Exemplo: loadContent(target);
    });
  });

  // Inicializar filmes
  renderMovies(movies);

  // Exemplo de funcionalidade de notificação
  document.querySelector('.fa-bell').addEventListener('click', () => {
    alert('Você tem 0 notificações novas.');
  });

  // Exemplo de ajuda
  document.querySelector('.fa-question-circle').addEventListener('click', () => {
    alert('Ajuda & Suporte - Movienizer Desktop');
  });

  // Simulação de carregamento inicial
  console.log('Movienizer Desktop carregado com sucesso!');
});