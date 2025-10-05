// scrape-manager.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar status
  loadScrapersStatus();

  // Eventos
  document.getElementById('btn-run-all').addEventListener('click', runAllScrapers);
  document.getElementById('btn-clear-cache').addEventListener('click', clearCache);
  document.getElementById('btn-update-movies').addEventListener('click', updateMovies);
  document.getElementById('btn-update-people').addEventListener('click', updatePeople);
  document.getElementById('btn-update-streaming').addEventListener('click', updateStreaming);

  // Atualizar status a cada 30 segundos
  setInterval(loadScrapersStatus, 30000);
});

// Função para carregar status dos scrapers
async function loadScrapersStatus() {
  try {
    const response = await fetch('/api/scrapers/status');
    const scrapers = await response.json();

    const container = document.getElementById('scrapers-list');
    container.innerHTML = '';

    scrapers.forEach(scraper => {
      const item = document.createElement('div');
      item.className = 'scraper-item';

      let statusClass = 'status-completed';
      if (scraper.status === 'running') statusClass = 'status-running';
      if (scraper.status === 'error') statusClass = 'status-error';

      item.innerHTML = `
        <span>${scraper.source}</span>
        <span class="status-indicator ${statusClass}">${scraper.status}</span>
        <span>${scraper.last_run || 'Nunca'}</span>
      `;

      container.appendChild(item);
    });
  } catch (error) {
    console.error('Erro ao carregar status dos scrapers:', error);
  }
}

// Função para executar todos os scrapers
async function runAllScrapers() {
  try {
    const response = await fetch('/api/scrape/update-all/movies', {
      method: 'POST'
    });

    if (response.ok) {
      addLog('Atualização de filmes iniciada');
    } else {
      addLog('Erro ao iniciar atualização de filmes');
    }

    const response2 = await fetch('/api/scrape/update-all/people', {
      method: 'POST'
    });

    if (response2.ok) {
      addLog('Atualização de pessoas iniciada');
    } else {
      addLog('Erro ao iniciar atualização de pessoas');
    }

    addLog('Execução de todos os scrapers iniciada');
  } catch (error) {
    addLog(`Erro: ${error.message}`);
  }
}

// Função para limpar cache
async function clearCache() {
  try {
    const response = await fetch('/api/cache/clear', {
      method: 'POST'
    });

    if (response.ok) {
      addLog('Cache limpo com sucesso');
    } else {
      addLog('Erro ao limpar cache');
    }
  } catch (error) {
    addLog(`Erro ao limpar cache: ${error.message}`);
  }
}

// Função para atualizar filmes
async function updateMovies() {
  try {
    const response = await fetch('/api/scrape/update-all/movies', {
      method: 'POST'
    });

    if (response.ok) {
      addLog('Atualização de filmes iniciada');
    } else {
      addLog('Erro ao iniciar atualização de filmes');
    }
  } catch (error) {
    addLog(`Erro ao atualizar filmes: ${error.message}`);
  }
}

// Função para atualizar pessoas
async function updatePeople() {
  try {
    const response = await fetch('/api/scrape/update-all/people', {
      method: 'POST'
    });

    if (response.ok) {
      addLog('Atualização de pessoas iniciada');
    } else {
      addLog('Erro ao iniciar atualização de pessoas');
    }
  } catch (error) {
    addLog(`Erro ao atualizar pessoas: ${error.message}`);
  }
}

// Função para atualizar streaming
async function updateStreaming() {
  try {
    addLog('Atualização de streaming não implementada ainda');
    // Implementar chamada para atualizar streaming
  } catch (error) {
    addLog(`Erro ao atualizar streaming: ${error.message}`);
  }
}

// Função para adicionar log
function addLog(message) {
  const logOutput = document.getElementById('log-output');
  const logItem = document.createElement('p');
  logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logOutput.appendChild(logItem);
  logOutput.scrollTop = logOutput.scrollHeight;
}