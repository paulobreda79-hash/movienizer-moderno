// movie-detail.js

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  if (!movieId) {
    alert('ID do filme não fornecido.');
    return;
  }

  // Carregar dados do filme
  loadMovieDetails(movieId);

  // Eventos
  document.getElementById('btn-back').addEventListener('click', () => history.back());
  document.getElementById('btn-edit').addEventListener('click', showEditModal);
  document.getElementById('btn-favorite').addEventListener('click', toggleFavorite);
  document.getElementById('btn-watched').addEventListener('click', toggleWatched);
  document.getElementById('btn-imdb').addEventListener('click', openImdbPage);
  document.getElementById('btn-add-to-watchlist').addEventListener('click', addToWatchlist);
  document.getElementById('btn-share').addEventListener('click', shareMovie);
  document.getElementById('btn-delete').addEventListener('click', deleteMovie);
  document.getElementById('btn-refresh-poster').addEventListener('click', updateMovieDetails);
  document.getElementById('btn-cancel-edit').addEventListener('click', hideEditModal);

  document.getElementById('edit-form').addEventListener('submit', saveMovieChanges);

  // Eventos das estrelas
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
      setPersonalRating(movieId, value);
    });
  });

  // Trocar abas
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
});

// Função para carregar detalhes do filme
async function loadMovieDetails(id) {
  try {
    const response = await fetch(`/api/movies/${id}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const movie = await response.json();

    // Preencher campos
    document.getElementById('movie-title').textContent = `${movie.title} (${movie.year})`;
    document.getElementById('movie-slogan').textContent = movie.slogan || "N/A";
    document.getElementById('movie-type').textContent = movie.type || "N/A";
    document.getElementById('movie-genres').textContent = JSON.parse(movie.genres).join(", ") || "N/A";
    document.getElementById('movie-countries').textContent = JSON.parse(movie.countries).join(", ") || "N/A";
    document.getElementById('movie-duration').textContent = movie.duration ? `${movie.duration} min` : "N/A";
    document.getElementById('movie-rating').textContent = movie.rating_age || "N/A";
    document.getElementById('movie-imdb-rating').textContent = movie.rating_imdb || "N/A";
    document.getElementById('movie-poster').src = movie.poster || "https://via.placeholder.com/300x450?text=No+Image";

    // Preencher estrelas
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
      star.classList.toggle('active', parseInt(star.dataset.value) <= (movie.personal_rating || 0));
    });

    // Preencher streaming
    const platforms = document.getElementById('streaming-platforms');
    platforms.innerHTML = '';
    if (movie.streaming) {
      JSON.parse(movie.streaming).forEach(platform => {
        const span = document.createElement('span');
        span.className = 'platform';
        span.textContent = platform;
        platforms.appendChild(span);
      });
    }

    // Preencher abas
    document.getElementById('movie-directors').textContent = JSON.parse(movie.director).join(", ") || "N/A";
    document.getElementById('movie-writers').textContent = JSON.parse(movie.writers).join(", ") || "N/A";
    document.getElementById('movie-composers').textContent = JSON.parse(movie.composers).join(", ") || "N/A";

    // Preencher atores
    const castList = document.getElementById('movie-cast-list');
    castList.innerHTML = '';
    if (movie.cast) {
      JSON.parse(movie.cast).forEach(actor => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-id="${actor.id}">${actor.name}</a> — ${actor.role}`;
        castList.appendChild(li);
      });
    }

    // Preencher descrição
    document.getElementById('movie-description').textContent = movie.plot || "N/A";

    // Preencher ligações
    const links = JSON.parse(movie.links || '{}');
    document.getElementById('link-imdb').href = links.imdb || '#';
    document.getElementById('link-rottentomatoes').href = links.rottentomatoes || '#';
    document.getElementById('link-letterboxd').href = links.letterboxd || '#';
    document.getElementById('link-adorocinema').href = links.adorocinema || '#';

    // Atualizar estado de favorito e visto
    const btnFavorite = document.getElementById('btn-favorite');
    const btnWatched = document.getElementById('btn-watched');
    if (movie.favorite) {
      btnFavorite.querySelector('i').classList.replace('icon-star-empty', 'icon-star-full');
      btnFavorite.style.backgroundColor = '#f1c40f';
      btnFavorite.style.color = 'white';
    }
    if (movie.watched) {
      btnWatched.querySelector('i').classList.replace('icon-eye', 'icon-eye-off');
      btnWatched.style.backgroundColor = '#2ecc71';
      btnWatched.style.color = 'white';
    }

  } catch (error) {
    console.error('Erro ao carregar detalhes do filme:', error);
    alert('Erro ao carregar detalhes do filme.');
  }
}

// Função para mostrar modal de edição
function showEditModal() {
  document.getElementById('edit-modal').style.display = 'flex';
  // Preencher campos com dados atuais
  const movieTitle = document.getElementById('movie-title').textContent.split(' (')[0];
  document.getElementById('edit-title').value = movieTitle;
  document.getElementById('edit-year').value = document.getElementById('movie-title').textContent.match(/\((\d{4})\)/)?.[1] || '';
  document.getElementById('edit-genres').value = document.getElementById('movie-genres').textContent;
  document.getElementById('edit-rating').value = document.getElementById('movie-imdb-rating').textContent;
  document.getElementById('edit-poster').value = document.getElementById('movie-poster').src;
  document.getElementById('edit-description').value = document.getElementById('movie-description').textContent;
}

// Função para esconder modal de edição
function hideEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// Função para salvar alterações
async function saveMovieChanges(e) {
  e.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  const updatedData = {
    title: document.getElementById('edit-title').value,
    year: parseInt(document.getElementById('edit-year').value),
    genres: document.getElementById('edit-genres').value.split(',').map(g => g.trim()),
    rating_imdb: parseFloat(document.getElementById('edit-rating').value),
    poster: document.getElementById('edit-poster').value,
    plot: document.getElementById('edit-description').value
  };

  try {
    const response = await fetch(`/api/movies/${movieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Filme atualizado com sucesso!');
    hideEditModal();
    loadMovieDetails(movieId); // Recarregar dados
  } catch (error) {
    console.error('Erro ao salvar alterações:', error);
    alert('Erro ao salvar alterações.');
  }
}

// Função para alternar favorito
async function toggleFavorite() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');
  const btn = document.getElementById('btn-favorite');
  const icon = btn.querySelector('i');

  try {
    const response = await fetch(`/api/movies/${movieId}/favorite`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    if (icon.classList.contains('icon-star-empty')) {
      icon.classList.replace('icon-star-empty', 'icon-star-full');
      btn.style.backgroundColor = '#f1c40f';
      btn.style.color = 'white';
    } else {
      icon.classList.replace('icon-star-full', 'icon-star-empty');
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#333';
    }
  } catch (error) {
    console.error('Erro ao alternar favorito:', error);
    alert('Erro ao alternar favorito.');
  }
}

// Função para alternar visto
async function toggleWatched() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');
  const btn = document.getElementById('btn-watched');
  const icon = btn.querySelector('i');

  try {
    const response = await fetch(`/api/movies/${movieId}/watched`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    if (icon.classList.contains('icon-eye')) {
      icon.classList.replace('icon-eye', 'icon-eye-off');
      btn.style.backgroundColor = '#2ecc71';
      btn.style.color = 'white';
    } else {
      icon.classList.replace('icon-eye-off', 'icon-eye');
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#333';
    }
  } catch (error) {
    console.error('Erro ao alternar visto:', error);
    alert('Erro ao alternar visto.');
  }
}

// Função para definir nota pessoal
async function setPersonalRating(movieId, value) {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.classList.toggle('active', parseInt(star.dataset.value) <= value);
  });

  try {
    const response = await fetch(`/api/movies/${movieId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personal_rating: value })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    console.log(`Nota pessoal definida: ${value}`);
  } catch (error) {
    console.error('Erro ao definir nota pessoal:', error);
  }
}

// Função para abrir página do IMDb
function openImdbPage() {
  const imdbLink = document.getElementById('link-imdb').href;
  if (imdbLink && imdbLink !== '#') {
    window.open(imdbLink, '_blank');
  } else {
    alert('Link do IMDb não disponível.');
  }
}

// Função para adicionar à watchlist
async function addToWatchlist() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_id: movieId, type: 'movie' })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Adicionado à watchlist!');
  } catch (error) {
    console.error('Erro ao adicionar à watchlist:', error);
    alert('Erro ao adicionar à watchlist.');
  }
}

// Função para compartilhar filme
function shareMovie() {
  if (navigator.share) {
    navigator.share({
      title: document.getElementById('movie-title').textContent,
      text: 'Confira este filme no MovieNizer!',
      url: window.location.href
    }).catch(console.error);
  } else {
    alert('Compartilhamento não suportado neste navegador.');
  }
}

// Função para deletar filme
async function deleteMovie() {
  if (!confirm('Tem certeza que deseja remover este filme?')) return;

  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  try {
    const response = await fetch(`/api/movies/${movieId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Filme removido com sucesso!');
    history.back(); // Voltar para a página anterior
  } catch (error) {
    console.error('Erro ao remover filme:', error);
    alert('Erro ao remover filme.');
  }
}

// Função para atualizar informações via scraper
async function updateMovieDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  try {
    const response = await fetch(`/api/download/movie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: document.getElementById('movie-title').textContent.split(' (')[0] })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Informações atualizadas via scraper!');
    loadMovieDetails(movieId); // Recarregar dados
  } catch (error) {
    console.error('Erro ao atualizar informações:', error);
    alert('Erro ao atualizar informações.');
  }
}