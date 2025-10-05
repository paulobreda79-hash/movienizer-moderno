// person-detail.js

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  if (!personId) {
    alert('ID da pessoa não fornecido.');
    return;
  }

  // Carregar dados da pessoa
  loadPersonDetails(personId);

  // Eventos
  document.getElementById('btn-back').addEventListener('click', () => history.back());
  document.getElementById('btn-edit').addEventListener('click', showEditModal);
  document.getElementById('btn-follow').addEventListener('click', toggleFollow);
  document.getElementById('btn-favorite').addEventListener('click', toggleFavorite);
  document.getElementById('btn-add-to-watchlist').addEventListener('click', addToWatchlist);
  document.getElementById('btn-share').addEventListener('click', sharePerson);
  document.getElementById('btn-delete').addEventListener('click', deletePerson);
  document.getElementById('btn-refresh-image').addEventListener('click', updatePersonDetails);
  document.getElementById('btn-cancel-edit').addEventListener('click', hideEditModal);

  document.getElementById('edit-form').addEventListener('submit', savePersonChanges);

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

// Função para carregar detalhes da pessoa
async function loadPersonDetails(id) {
  try {
    const response = await fetch(`/api/people/${id}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const person = await response.json();

    // Preencher campos
    document.getElementById('person-name').textContent = person.name;
    document.getElementById('person-full-name').textContent = person.full_name || "N/A";
    document.getElementById('person-full-name-detail').textContent = person.full_name || "N/A";
    document.getElementById('person-birth-date').textContent = person.birth_date || "N/A";
    document.getElementById('person-birth-date-detail').textContent = person.birth_date || "N/A";
    document.getElementById('person-birth-place').textContent = person.birth_place || "N/A";
    document.getElementById('person-birth-place-detail').textContent = person.birth_place || "N/A";
    document.getElementById('person-roles').textContent = JSON.parse(person.role || '[]').join(", ") || "N/A";
    document.getElementById('person-roles-detail').textContent = JSON.parse(person.role || '[]').join(", ") || "N/A";
    document.getElementById('person-height').textContent = person.height || "N/A";
    document.getElementById('person-height-detail').textContent = person.height || "N/A";
    document.getElementById('person-nickname').textContent = person.nickname || "N/A";
    document.getElementById('person-biography').textContent = person.biography || "N/A";
    document.getElementById('person-image').src = person.image || "https://via.placeholder.com/300x400?text=No+Image";

    // Preencher links externos
    const links = JSON.parse(person.links || '{}');
    document.getElementById('link-imdb-person').href = links.imdb || '#';
    document.getElementById('link-adorocinema-person').href = links.adorocinema || '#';
    document.getElementById('link-justdial-person').href = links.justdial || '#';

    // Preencher filmes
    const moviesList = document.getElementById('person-movies-list');
    moviesList.innerHTML = '';
    if (person.movies) {
      JSON.parse(person.movies).forEach(movie => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-id="${movie.id}">${movie.title}</a> — <span>${movie.year}</span>`;
        moviesList.appendChild(li);
      });
    }

    // Atualizar estado de favorito e seguido
    const btnFavorite = document.getElementById('btn-favorite');
    const btnFollow = document.getElementById('btn-follow');
    if (person.favorite) {
      btnFavorite.querySelector('i').classList.replace('icon-star-empty', 'icon-star-full');
      btnFavorite.style.backgroundColor = '#f1c40f';
      btnFavorite.style.color = 'white';
    }
    if (person.followed) {
      btnFollow.querySelector('i').classList.replace('icon-heart', 'icon-heart-filled');
      btnFollow.style.backgroundColor = '#e74c3c';
      btnFollow.style.color = 'white';
    }

  } catch (error) {
    console.error('Erro ao carregar detalhes da pessoa:', error);
    alert('Erro ao carregar detalhes da pessoa.');
  }
}

// Função para mostrar modal de edição
function showEditModal() {
  document.getElementById('edit-modal').style.display = 'flex';
  // Preencher campos com dados atuais
  const personName = document.getElementById('person-name').textContent;
  document.getElementById('edit-name').value = personName;
  document.getElementById('edit-full-name').value = document.getElementById('person-full-name').textContent;
  document.getElementById('edit-birth-date').value = document.getElementById('person-birth-date').textContent;
  document.getElementById('edit-roles').value = document.getElementById('person-roles').textContent;
  document.getElementById('edit-image').value = document.getElementById('person-image').src;
  document.getElementById('edit-biography').value = document.getElementById('person-biography').textContent;
}

// Função para esconder modal de edição
function hideEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// Função para salvar alterações
async function savePersonChanges(e) {
  e.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  const updatedData = {
    name: document.getElementById('edit-name').value,
    full_name: document.getElementById('edit-full-name').value,
    birth_date: document.getElementById('edit-birth-date').value,
    role: document.getElementById('edit-roles').value.split(',').map(r => r.trim()),
    image: document.getElementById('edit-image').value,
    biography: document.getElementById('edit-biography').value
  };

  try {
    const response = await fetch(`/api/people/${personId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Pessoa atualizada com sucesso!');
    hideEditModal();
    loadPersonDetails(personId); // Recarregar dados
  } catch (error) {
    console.error('Erro ao salvar alterações:', error);
    alert('Erro ao salvar alterações.');
  }
}

// Função para alternar seguir
async function toggleFollow() {
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');
  const btn = document.getElementById('btn-follow');
  const icon = btn.querySelector('i');

  try {
    const response = await fetch(`/api/people/${personId}/followed`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    if (icon.classList.contains('icon-heart')) {
      icon.classList.replace('icon-heart', 'icon-heart-filled');
      btn.style.backgroundColor = '#e74c3c';
      btn.style.color = 'white';
    } else {
      icon.classList.replace('icon-heart-filled', 'icon-heart');
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#333';
    }
  } catch (error) {
    console.error('Erro ao alternar seguir:', error);
    alert('Erro ao alternar seguir.');
  }
}

// Função para alternar favorito
async function toggleFavorite() {
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');
  const btn = document.getElementById('btn-favorite');
  const icon = btn.querySelector('i');

  try {
    const response = await fetch(`/api/people/${personId}/favorite`, {
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

// Função para adicionar à watchlist
async function addToWatchlist() {
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_id: personId, type: 'person' })
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

// Função para compartilhar pessoa
function sharePerson() {
  if (navigator.share) {
    navigator.share({
      title: document.getElementById('person-name').textContent,
      text: 'Confira esta pessoa no MovieNizer!',
      url: window.location.href
    }).catch(console.error);
  } else {
    alert('Compartilhamento não suportado neste navegador.');
  }
}

// Função para deletar pessoa
async function deletePerson() {
  if (!confirm('Tem certeza que deseja remover esta pessoa?')) return;

  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  try {
    const response = await fetch(`/api/people/${personId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Pessoa removida com sucesso!');
    history.back(); // Voltar para a página anterior
  } catch (error) {
    console.error('Erro ao remover pessoa:', error);
    alert('Erro ao remover pessoa.');
  }
}

// Função para atualizar informações via scraper
async function updatePersonDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const personId = urlParams.get('id');

  try {
    const response = await fetch(`/api/download/person`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: document.getElementById('person-name').textContent })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Informações atualizadas via scraper!');
    loadPersonDetails(personId); // Recarregar dados
  } catch (error) {
    console.error('Erro ao atualizar informações:', error);
    alert('Erro ao atualizar informações.');
  }
}