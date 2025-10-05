// social-share.js

document.addEventListener('DOMContentLoaded', () => {
  let shares = [];
  let engagement = [];

  // Carregar dados iniciais
  loadSocialStats();
  loadPlatforms();
  loadRecentShares();
  loadEngagement();

  // Eventos
  document.getElementById('btn-share-all').addEventListener('click', shareAllContent);
  document.getElementById('btn-refresh').addEventListener('click', refreshData);
  document.getElementById('btn-refresh-platforms').addEventListener('click', loadPlatforms);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('filter-platform').addEventListener('change', filterShares);
  document.getElementById('search-shares').addEventListener('input', searchShares);
  document.getElementById('filter-engagement-type').addEventListener('change', filterEngagement);
  document.getElementById('search-engagement').addEventListener('input', searchEngagement);

  // Atualizar dados a cada 30 segundos
  setInterval(refreshData, 30000);
});

async function loadSocialStats() {
  try {
    const response = await fetch('/api/social/status');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('total-shares').textContent = stats.total_shares || 0;
    document.getElementById('active-platforms').textContent = stats.active_platforms || 0;
    document.getElementById('total-engagement').textContent = stats.total_engagement || 0;
    document.getElementById('last-share').textContent = stats.last_share ? 
      new Date(stats.last_share).toLocaleString() : 'Nunca';
  } catch (error) {
    console.error('Erro ao carregar estatísticas de redes sociais:', error);
  }
}

async function loadPlatforms() {
  try {
    const response = await fetch('/api/social/status');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const platforms = await response.json();

    const grid = document.getElementById('platforms-grid');
    grid.innerHTML = '';

    const filterSelect = document.getElementById('filter-platform');
    filterSelect.innerHTML = '<option value="all">Todas as Plataformas</option>';

    Object.entries(platforms).forEach(([platformId, platform]) => {
      // Grid de plataformas
      const card = document.createElement('div');
      card.className = 'platform-card';
      card.onclick = () => window.location.href = `/platform-detail.html?id=${platformId}`;

      card.innerHTML = `
        <div class="platform-icon">${platform.icon}</div>
        <div class="platform-name">${platform.name}</div>
        <div class="platform-stats">${platform.status}</div>
      `;

      grid.appendChild(card);

      // Opções de filtro
      const option = document.createElement('option');
      option.value = platformId;
      option.textContent = platform.name;
      filterSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar plataformas:', error);
  }
}

async function loadRecentShares() {
  try {
    const response = await fetch('/api/social/recent-shares');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    shares = await response.json();

    renderSharesList();
  } catch (error) {
    console.error('Erro ao carregar compartilhamentos recentes:', error);
  }
}

async function loadEngagement() {
  try {
    const response = await fetch('/api/social/recent-engagements');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    engagement = await response.json();

    renderEngagementList();
  } catch (error) {
    console.error('Erro ao carregar engajamento:', error);
  }
}

function renderSharesList() {
  const list = document.getElementById('shares-list');
  list.innerHTML = '';

  const filteredShares = applyFilters(shares);

  if (filteredShares.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #777;">Nenhum compartilhamento encontrado.</p>';
    return;
  }

  filteredShares.forEach(share => {
    const item = document.createElement('div');
    item.className = `share-item ${share.platform}`;

    const date = new Date(share.shared_at);
    const platformName = getPlatformName(share.platform);

    item.innerHTML = `
      <div class="share-header">
        <h4 class="share-title">${share.content_type} ${share.content_id}</h4>
        <div class="share-platform">${platformName}</div>
      </div>
      <div class="share-details">
        <div class="share-date">${date.toLocaleString()}</div>
      </div>
    `;

    list.appendChild(item);
  });
}

function renderEngagementList() {
  const list = document.getElementById('engagement-list');
  list.innerHTML = '';

  const filteredEngagement = applyEngagementFilters(engagement);

  if (filteredEngagement.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #777;">Nenhum engajamento encontrado.</p>';
    return;
  }

  filteredEngagement.forEach(eng => {
    const item = document.createElement('div');
    item.className = `engagement-item ${eng.engagement_type}`;

    const date = new Date(eng.created_at);
    const userName = eng.user_id || 'Anônimo';

    item.innerHTML = `
      <div class="engagement-header">
        <h4 class="engagement-title">${eng.content_type} ${eng.content_id}</h4>
        <div class="engagement-user">${userName}</div>
      </div>
      <div class="engagement-details">
        <div class="engagement-type">${getEngagementType(eng.engagement_type)}</div>
        <div class="engagement-date">${date.toLocaleString()}</div>
      </div>
    `;

    list.appendChild(item);
  });
}

function applyFilters(shares) {
  const platformFilter = document.getElementById('filter-platform').value;
  const searchFilter = document.getElementById('search-shares').value.toLowerCase();

  return shares.filter(share => {
    const matchesPlatform = platformFilter === 'all' || share.platform === platformFilter;
    const matchesSearch = searchFilter ? 
      share.content_type.toLowerCase().includes(searchFilter) : true;
    
    return matchesPlatform && matchesSearch;
  });
}

function applyEngagementFilters(engagement) {
  const typeFilter = document.getElementById('filter-engagement-type').value;
  const searchFilter = document.getElementById('search-engagement').value.toLowerCase();

  return engagement.filter(eng => {
    const matchesType = typeFilter === 'all' || eng.engagement_type === typeFilter;
    const matchesSearch = searchFilter ? 
      eng.content_type.toLowerCase().includes(searchFilter) : true;
    
    return matchesType && matchesSearch;
  });
}

function getPlatformName(platformId) {
  const platforms = {
    'facebook': 'Facebook',
    'twitter': 'Twitter',
    'instagram': 'Instagram',
    'linkedin': 'LinkedIn',
    'whatsapp': 'WhatsApp',
    'telegram': 'Telegram',
    'email': 'Email',
    'sms': 'SMS'
  };
  return platforms[platformId] || platformId;
}

function getEngagementType(type) {
  const types = {
    'like': 'Like',
    'comment': 'Comentário',
    'share': 'Compartilhamento',
    'follow': 'Seguidor'
  };
  return types[type] || type;
}

function filterShares() {
  renderSharesList();
}

function searchShares() {
  renderSharesList();
}

function filterEngagement() {
  renderEngagementList();
}

function searchEngagement() {
  renderEngagementList();
}

async function shareAllContent() {
  if (!confirm('Tem certeza que deseja compartilhar todo o conteúdo? Isso pode levar alguns minutos.')) return;

  try {
    const response = await fetch('/api/social/share/all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert(`Compartilhamento concluído!\nTotal: ${result.total}\nCompartilhados: ${result.shared}\nErros: ${result.errors}`);
    refreshData();
  } catch (error) {
    console.error('Erro ao compartilhar todo o conteúdo:', error);
    alert('Erro ao compartilhar todo o conteúdo: ' + error.message);
  }
}

async function refreshData() {
  await loadSocialStats();
  await loadPlatforms();
  await loadRecentShares();
  await loadEngagement();
}

async function saveSettings() {
  try {
    const settings = {
      autoShareEnabled: document.getElementById('auto-share-enabled').value === 'true',
      shareFrequency: document.getElementById('share-frequency').value,
      notificationsEnabled: document.getElementById('notifications-enabled').value === 'true'
    };

    // Aqui você salvaria as configurações no servidor
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}