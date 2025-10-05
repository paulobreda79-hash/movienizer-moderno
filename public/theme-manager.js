// theme-manager.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados iniciais
  loadCurrentTheme();
  loadAvailableThemes();
  loadThemeStats();

  // Eventos
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-refresh').addEventListener('click', refreshData);
  document.getElementById('btn-create-theme').addEventListener('click', showCreateThemeModal);
  document.getElementById('btn-cancel-create').addEventListener('click', hideCreateThemeModal);
  document.getElementById('create-theme-form').addEventListener('submit', createCustomTheme);
  document.getElementById('btn-close-preview').addEventListener('click', hidePreviewModal);

  // Atualizar dados a cada 30 segundos
  setInterval(refreshData, 30000);
});

async function loadCurrentTheme() {
  try {
    const response = await fetch('/api/theme/current');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const data = await response.json();

    const theme = data.theme || 'light';
    updateCurrentThemeDisplay(theme);
  } catch (error) {
    console.error('Erro ao carregar tema atual:', error);
  }
}

function updateCurrentThemeDisplay(themeId) {
  const themes = {
    light: { name: 'Claro', icon: '☀️', description: 'Tema claro padrão' },
    dark: { name: 'Escuro', icon: '🌙', description: 'Tema escuro para ambientes com pouca luz' },
    auto: { name: 'Automático', icon: '🌓', description: 'Adapta-se automaticamente ao sistema' },
    blue: { name: 'Azul Profundo', icon: '🔵', description: 'Tema azul profundo e elegante' },
    green: { name: 'Verde Natureza', icon: '🌿', description: 'Tema verde inspirado na natureza' },
    purple: { name: 'Roxo Místico', icon: '🟣', description: 'Tema roxo misterioso e sofisticado' },
    highContrast: { name: 'Alto Contraste', icon: '🔆', description: 'Tema de alto contraste para melhor visibilidade' }
  };

  const theme = themes[themeId] || themes.light;

  document.getElementById('current-theme-icon').textContent = theme.icon;
  document.getElementById('current-theme-name').textContent = theme.name;
  document.getElementById('current-theme-description').textContent = theme.description;

  // Mostrar cores do tema
  showThemeColors(themeId);
}

function showThemeColors(themeId) {
  const colors = {
    light: {
      primary: '#3498db',
      secondary: '#95a5a6',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#333333',
      border: '#dddddd'
    },
    dark: {
      primary: '#3498db',
      secondary: '#7f8c8d',
      background: '#1a1a1a',
      surface: '#2d2d2d',
      text: '#ffffff',
      border: '#444444'
    }
  };

  const themeColors = colors[themeId] || colors.light;
  const colorsContainer = document.getElementById('theme-colors');
  colorsContainer.innerHTML = '';

  Object.entries(themeColors).forEach(([name, color]) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.name = name;
    colorsContainer.appendChild(swatch);
  });
}

async function loadAvailableThemes() {
  try {
    const response = await fetch('/api/theme/list');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const themes = await response.json();

    const grid = document.getElementById('themes-grid');
    grid.innerHTML = '';

    themes.forEach(theme => {
      const item = document.createElement('div');
      item.className = 'theme-item';
      item.dataset.themeId = theme.id;

      item.innerHTML = `
        <div class="theme-item-header">
          <span class="theme-item-icon">${theme.icon}</span>
          <h4 class="theme-item-name">${theme.name}</h4>
        </div>
        <p class="theme-item-description">Clique para pré-visualizar</p>
      `;

      item.addEventListener('click', () => previewTheme(theme.id));
      grid.appendChild(item);
    });
  } catch (error) {
    console.error('Erro ao carregar temas disponíveis:', error);
  }
}

async function loadThemeStats() {
  try {
    const response = await fetch('/api/theme/stats');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('total-themes').textContent = stats.totalThemes || 0;
    document.getElementById('most-used-theme').textContent = stats.mostUsed ? stats.mostUsed.theme : '-';
    document.getElementById('custom-themes').textContent = stats.usageDistribution ? 
      stats.usageDistribution.filter(u => u.theme.startsWith('custom-')).length : 0;
    document.getElementById('system-theme').textContent = await getSystemTheme();
  } catch (error) {
    console.error('Erro ao carregar estatísticas de temas:', error);
  }
}

async function getSystemTheme() {
  try {
    const response = await fetch('/api/theme/system');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const data = await response.json();
    return data.theme === 'dark' ? 'Escuro' : 'Claro';
  } catch (error) {
    console.error('Erro ao obter tema do sistema:', error);
    return '-';
  }
}

async function toggleTheme() {
  try {
    const response = await fetch('/api/theme/current');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const data = await response.json();

    const currentTheme = data.theme || 'light';
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    await setTheme(nextTheme);
    updateCurrentThemeDisplay(nextTheme);
    loadAvailableThemes();
  } catch (error) {
    console.error('Erro ao alternar tema:', error);
  }
}

async function setTheme(themeId) {
  try {
    const response = await fetch('/api/theme/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    // Aplicar tema no frontend
    document.body.className = `theme-${themeId}`;
  } catch (error) {
    console.error('Erro ao definir tema:', error);
    throw error;
  }
}

function previewTheme(themeId) {
  try {
    // Aplicar tema temporariamente
    document.body.className = `theme-${themeId}`;
    
    // Mostrar modal de pré-visualização
    const previewContent = document.getElementById('preview-content');
    previewContent.innerHTML = `
      <h4>Pré-visualização do Tema ${themeId}</h4>
      <p>Esta é uma pré-visualização do tema selecionado.</p>
      <div style="margin: 20px 0; padding: 20px; background: var(--theme-surface); border-radius: 8px; border: 1px solid var(--theme-border);">
        <h5>Exemplo de Card</h5>
        <p>Este é um exemplo de como os elementos aparecerão com este tema.</p>
        <button class="btn-primary" style="margin-right: 10px;">Botão Primário</button>
        <button class="btn-secondary">Botão Secundário</button>
      </div>
    `;

    document.getElementById('preview-modal').style.display = 'flex';
    document.getElementById('btn-apply-theme').onclick = () => applyTheme(themeId);
  } catch (error) {
    console.error('Erro ao pré-visualizar tema:', error);
  }
}

function applyTheme(themeId) {
  try {
    // Aplicar tema permanentemente
    setTheme(themeId);
    updateCurrentThemeDisplay(themeId);
    hidePreviewModal();
    alert(`Tema ${themeId} aplicado com sucesso!`);
  } catch (error) {
    console.error('Erro ao aplicar tema:', error);
    alert('Erro ao aplicar tema: ' + error.message);
  }
}

function hidePreviewModal() {
  document.getElementById('preview-modal').style.display = 'none';
  // Restaurar tema atual
  loadCurrentTheme();
}

function showCreateThemeModal() {
  document.getElementById('create-theme-modal').style.display = 'flex';
}

function hideCreateThemeModal() {
  document.getElementById('create-theme-modal').style.display = 'none';
}

async function createCustomTheme(e) {
  e.preventDefault();

  try {
    const themeData = {
      name: document.getElementById('theme-name').value,
      primary: document.getElementById('primary-color').value,
      secondary: document.getElementById('secondary-color').value,
      background: document.getElementById('background-color').value,
      text: document.getElementById('text-color').value,
      border: document.getElementById('border-color').value
    };

    const response = await fetch('/api/theme/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(themeData)
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Tema personalizado criado com sucesso!');
    hideCreateThemeModal();
    loadAvailableThemes();
    loadThemeStats();
  } catch (error) {
    console.error('Erro ao criar tema personalizado:', error);
    alert('Erro ao criar tema personalizado: ' + error.message);
  }
}

async function refreshData() {
  await loadCurrentTheme();
  await loadAvailableThemes();
  await loadThemeStats();
}

// Inicializar sistema de temas
initializeThemeSystem();

function initializeThemeSystem() {
  try {
    // Carregar tema salvo ou detectar do sistema
    const savedTheme = localStorage.getItem('movienizer-theme') || 'auto';
    document.body.className = `theme-${savedTheme}`;
    updateCurrentThemeDisplay(savedTheme);

    // Ouvir mudanças no sistema
    if (window.matchMedia) {
      const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkMediaQuery.addListener(() => {
        if (document.body.className === 'theme-auto') {
          const newTheme = darkMediaQuery.matches ? 'dark' : 'light';
          updateCurrentThemeDisplay(newTheme);
        }
      });
    }

    console.log('Sistema de temas inicializado');
  } catch (error) {
    console.error('Erro ao inicializar sistema de temas:', error);
  }
}