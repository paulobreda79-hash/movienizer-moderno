// people-list.js

document.addEventListener('DOMContentLoaded', () => {
  let people = [];
  let filteredPeople = [];
  let currentPage = 1;
  const itemsPerPage = 8;

  // Carregar dados
  loadPeople();

  // Eventos
  document.getElementById('search-input').addEventListener('input', filterPeople);
  document.getElementById('filter-role').addEventListener('change', filterPeople);
  document.getElementById('sort-by').addEventListener('change', sortPeople);
  document.getElementById('btn-add-person').addEventListener('click', showAddModal);
  document.getElementById('btn-prev').addEventListener('click', () => changePage(-1));
  document.getElementById('btn-next').addEventListener('click', () => changePage(1));
  document.getElementById('btn-cancel-add').addEventListener('click', hideAddModal);

  document.getElementById('add-form').addEventListener('submit', addPerson);
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
    renderPeopleList();
  } catch (error) {
    console.error('Erro ao carregar pessoas:', error);
    alert('Erro ao carregar pessoas.');
  }
}

// Função para renderizar a lista de pessoas
function renderPeopleList() {
  const grid = document.getElementById('people-grid');
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
        <div class="role">${JSON.parse(person.role || '[]').join(', ') || 'N/A'}</div>
        <div class="birth-year">${person.birth_date || 'N/A'}</div>
      </div>
    `;

    grid.appendChild(card);
  });

  updatePagination();
}

// Função para filtrar pessoas
function filterPeople() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const role = document.getElementById('filter-role').value;

  filteredPeople = people.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(search);
    const matchesRole = role === 'all' || JSON.parse(person.role || '[]').some(r => r.toLowerCase().includes(role));
    return matchesSearch && matchesRole;
  });

  currentPage = 1;
  renderPeopleList();
}

// Função para ordenar pessoas
function sortPeople() {
  const sortBy = document.getElementById('sort-by').value;

  filteredPeople.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'birth-year') {
      return (a.birth_date || '').localeCompare(b.birth_date || '');
    } else if (sortBy === 'role') {
      return (JSON.parse(a.role || '[]')[0] || '').localeCompare(JSON.parse(b.role || '[]')[0] || '');
    }
  });

  renderPeopleList();
}

// Função para mudar página
function changePage(direction) {
  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  currentPage += direction;

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  renderPeopleList();
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

// Função para mostrar modal de adição
function showAddModal() {
  document.getElementById('add-modal').style.display = 'flex';
  document.getElementById('add-name').value = '';
  document.getElementById('add-image').value = '';
}

// Função para esconder modal de adição
function hideAddModal() {
  document.getElementById('add-modal').style.display = 'none';
}

// Função para adicionar pessoa
async function addPerson(e) {
  e.preventDefault();

  const newPerson = {
    name: document.getElementById('add-name').value,
    role: [document.getElementById('add-role').value],
    image: document.getElementById('add-image').value
  };

  try {
    const response = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPerson)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Pessoa adicionada com sucesso!');
    hideAddModal();
    loadPeople(); // Recarregar lista
  } catch (error) {
    console.error('Erro ao adicionar pessoa:', error);
    alert('Erro ao adicionar pessoa.');
  }
}