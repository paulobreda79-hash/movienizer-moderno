// dashboard-manager.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados iniciais
  loadDashboardStats();
  loadUserDashboards();
  loadAvailableWidgets();

  // Eventos
  document.getElementById('btn-create-dashboard').addEventListener('click', showCreateDashboardModal);
  document.getElementById('btn-refresh').addEventListener('click', refreshData);
  document.getElementById('btn-refresh-widgets').addEventListener('click', loadAvailableWidgets);
  document.getElementById('btn-cancel-create').addEventListener('click', hideCreateDashboardModal);
  document.getElementById('btn-cancel-edit').addEventListener('click', hideEditDashboardModal);
  document.getElementById('create-dashboard-form').addEventListener('submit', createDashboard);
  document.getElementById('edit-dashboard-form').addEventListener('submit', updateDashboard);
  document.getElementById('search-dashboards').addEventListener('input', filterDashboards);
  document.getElementById('filter-category').addEventListener('change', filterDashboards);

  // Atualizar dados a cada 30 segundos
  setInterval(refreshData, 30000);
});

async function loadDashboardStats() {
  try {
    const response = await fetch('/api/dashboard/stats');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('total-dashboards').textContent = stats.total_dashboards || 0;
    document.getElementById('public-dashboards').textContent = stats.public_dashboards || 0;
    document.getElementById('last-created').textContent = stats.last_created ? 
      new Date(stats.last_created).toLocaleDateString() : 'Nunca';
    document.getElementById('most-popular').textContent = stats.most_popular || '-';
  } catch (error) {
    console.error('Erro ao carregar estatísticas de dashboards:', error);
  }
}

async function loadUserDashboards() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const dashboards = await response.json();

    const grid = document.getElementById('dashboards-grid');
    grid.innerHTML = '';

    if (dashboards.length === 0) {
      grid.innerHTML = '<p style="text-align: center; color: var(--theme-text-secondary);">Nenhum dashboard encontrado.</p>';
      return;
    }

    dashboards.forEach(dashboard => {
      const card = document.createElement('div');
      card.className = 'dashboard-card';
      card.dataset.dashboardId = dashboard.id;

      card.innerHTML = `
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">${dashboard.name}</h3>
          <div class="dashboard-card-actions">
            <button class="btn-secondary" onclick="viewDashboard(${dashboard.id})">Ver</button>
            <button class="btn-secondary" onclick="editDashboard(${dashboard.id})">Editar</button>
            <button class="btn-danger" onclick="deleteDashboard(${dashboard.id})">Excluir</button>
          </div>
        </div>
        <p class="dashboard-card-description">${dashboard.description || 'Sem descrição'}</p>
        <div class="dashboard-card-meta">
          <span>Criado: ${new Date(dashboard.created_at).toLocaleDateString()}</span>
          <span>${dashboard.is_public ? '🌐 Público' : '🔒 Privado'}</span>
        </div>
      `;

      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar dashboards:', error);
    alert('Erro ao carregar dashboards.');
  }
}

async function loadAvailableWidgets() {
  try {
    const response = await fetch('/api/dashboard/widgets');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const widgets = await response.json();

    const grid = document.getElementById('widgets-grid');
    grid.innerHTML = '';

    widgets.forEach(widget => {
      const card = document.createElement('div');
      card.className = 'widget-card';
      card.draggable = true;
      card.dataset.widgetType = widget.id;

      card.innerHTML = `
        <div class="widget-card-header">
          <span class="widget-card-icon">${widget.icon}</span>
          <h4 class="widget-card-title">${widget.name}</h4>
        </div>
        <p class="widget-card-description">${widget.description}</p>
        <span class="widget-card-category">${widget.category}</span>
      `;

      card.addEventListener('dragstart', handleWidgetDragStart);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar widgets:', error);
    alert('Erro ao carregar widgets disponíveis.');
  }
}

function handleWidgetDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.widgetType);
  e.dataTransfer.effectAllowed = 'copy';
}

function showCreateDashboardModal() {
  document.getElementById('create-dashboard-modal').style.display = 'flex';
}

function hideCreateDashboardModal() {
  document.getElementById('create-dashboard-modal').style.display = 'none';
  document.getElementById('create-dashboard-form').reset();
}

function showEditDashboardModal(dashboardId) {
  // Carregar dados do dashboard para edição
  loadDashboardData(dashboardId);
  document.getElementById('edit-dashboard-modal').style.display = 'flex';
}

function hideEditDashboardModal() {
  document.getElementById('edit-dashboard-modal').style.display = 'none';
  document.getElementById('edit-dashboard-form').reset();
}

async function createDashboard(e) {
  e.preventDefault();

  try {
    const dashboardData = {
      name: document.getElementById('dashboard-name').value,
      description: document.getElementById('dashboard-description').value,
      layout: document.getElementById('dashboard-layout').value,
      is_public: document.getElementById('dashboard-public').checked ? 1 : 0,
      allow_sharing: document.getElementById('dashboard-allow-sharing').checked ? 1 : 0
    };

    const response = await fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dashboardData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Dashboard criado com sucesso!');
    hideCreateDashboardModal();
    loadUserDashboards();
    loadDashboardStats();
  } catch (error) {
    console.error('Erro ao criar dashboard:', error);
    alert('Erro ao criar dashboard: ' + error.message);
  }
}

async function updateDashboard(e) {
  e.preventDefault();

  try {
    const dashboardId = document.getElementById('edit-dashboard-id').value;
    const dashboardData = {
      name: document.getElementById('edit-dashboard-name').value,
      description: document.getElementById('edit-dashboard-description').value,
      layout: document.getElementById('edit-dashboard-layout').value,
      is_public: document.getElementById('edit-dashboard-public').checked ? 1 : 0,
      allow_sharing: document.getElementById('edit-dashboard-allow-sharing').checked ? 1 : 0
    };

    const response = await fetch(`/api/dashboard/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dashboardData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Dashboard atualizado com sucesso!');
    hideEditDashboardModal();
    loadUserDashboards();
    loadDashboardStats();
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
    alert('Erro ao atualizar dashboard: ' + error.message);
  }
}

async function loadDashboardData(dashboardId) {
  try {
    const response = await fetch(`/api/dashboard/${dashboardId}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const dashboard = await response.json();

    document.getElementById('edit-dashboard-id').value = dashboard.id;
    document.getElementById('edit-dashboard-name').value = dashboard.name;
    document.getElementById('edit-dashboard-description').value = dashboard.description || '';
    document.getElementById('edit-dashboard-layout').value = dashboard.layout;
    document.getElementById('edit-dashboard-public').checked = dashboard.is_public === 1;
    document.getElementById('edit-dashboard-allow-sharing').checked = dashboard.allow_sharing === 1;
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    alert('Erro ao carregar dados do dashboard.');
  }
}

async function viewDashboard(dashboardId) {
  window.location.href = `/dashboards/view/${dashboardId}`;
}

async function editDashboard(dashboardId) {
  showEditDashboardModal(dashboardId);
}

async function deleteDashboard(dashboardId) {
  if (!confirm('Tem certeza que deseja excluir este dashboard? Esta ação não pode ser desfeita.')) return;

  try {
    const response = await fetch(`/api/dashboard/${dashboardId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    alert('Dashboard excluído com sucesso!');
    loadUserDashboards();
    loadDashboardStats();
  } catch (error) {
    console.error('Erro ao excluir dashboard:', error);
    alert('Erro ao excluir dashboard: ' + error.message);
  }
}

function filterDashboards() {
  const searchTerm = document.getElementById('search-dashboards').value.toLowerCase();
  const category = document.getElementById('filter-category').value;

  const cards = document.querySelectorAll('.dashboard-card');
  cards.forEach(card => {
    const title = card.querySelector('.dashboard-card-title').textContent.toLowerCase();
    const description = card.querySelector('.dashboard-card-description').textContent.toLowerCase();
    
    const matchesSearch = searchTerm ? 
      title.includes(searchTerm) || description.includes(searchTerm) : true;
    
    // Implementar filtragem por categoria se necessário
    const matchesCategory = category === 'all' || true; // Simplificado
    
    const isVisible = matchesSearch && matchesCategory;
    card.style.display = isVisible ? 'block' : 'none';
  });
}

async function refreshData() {
  await loadDashboardStats();
  await loadUserDashboards();
  await loadAvailableWidgets();
}

// Iniciar sistema de dashboards
DashboardService.scheduleDashboardUpdates();