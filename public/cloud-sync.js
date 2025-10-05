// cloud-sync.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar status inicial
  loadSyncStatus();
  loadAvailableBackups();

  // Eventos
  document.getElementById('btn-sync-now').addEventListener('click', showSyncConfirmation);
  document.getElementById('btn-pause-resume').addEventListener('click', togglePauseResume);
  document.getElementById('btn-refresh-backups').addEventListener('click', loadAvailableBackups);
  document.getElementById('btn-confirm-sync').addEventListener('click', performSync);
  document.getElementById('btn-cancel-sync').addEventListener('click', hideSyncModal);
  document.getElementById('btn-cancel-restore').addEventListener('click', hideRestoreModal);

  // Atualizar status a cada 30 segundos
  setInterval(loadSyncStatus, 30000);
});

async function loadSyncStatus() {
  try {
    const response = await fetch('/api/cloud/status');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const status = await response.json();

    document.getElementById('sync-status').textContent = status.status;
    document.getElementById('last-sync').textContent = status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Nunca';
    document.getElementById('conflict-count').textContent = status.conflicts;

    // Atualizar botão de pausa/retomar
    const pauseBtn = document.getElementById('btn-pause-resume');
    pauseBtn.textContent = status.status === 'paused' ? 'Retomar' : 'Pausar';
  } catch (error) {
    console.error('Erro ao carregar status de sincronização:', error);
  }
}

async function loadAvailableBackups() {
  try {
    const response = await fetch('/api/cloud/backups');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const backups = await response.json();

    const list = document.getElementById('backups-list');
    list.innerHTML = '';

    if (backups.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #777;">Nenhum backup disponível.</p>';
      return;
    }

    backups.forEach(backup => {
      const item = document.createElement('div');
      item.className = 'backup-item';

      const date = new Date(backup.modifiedTime);
      const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);

      item.innerHTML = `
        <div class="backup-info">
          <h4>${backup.fileName}</h4>
          <p>${date.toLocaleString()} • ${sizeMB} MB</p>
        </div>
        <div class="backup-actions">
          <button class="btn-primary" onclick="restoreBackup('${backup.fileName}')">Restaurar</button>
          <button class="btn-danger" onclick="deleteBackup('${backup.fileName}')">Excluir</button>
        </div>
      `;

      list.appendChild(item);
    });
  } catch (error) {
    console.error('Erro ao carregar backups:', error);
    alert('Erro ao carregar backups disponíveis.');
  }
}

function showSyncConfirmation() {
  document.getElementById('confirm-modal').style.display = 'flex';
}

function hideSyncModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function hideRestoreModal() {
  document.getElementById('restore-modal').style.display = 'none';
}

async function performSync() {
  hideSyncModal();

  try {
    const syncType = document.getElementById('sync-type').value;
    
    const response = await fetch('/api/cloud/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: syncType })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert(`Sincronização ${result.success ? 'concluída' : 'falhou'} com sucesso!`);
    loadSyncStatus();
    loadAvailableBackups();
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    alert('Erro ao sincronizar dados.');
  }
}

async function togglePauseResume() {
  try {
    const isPaused = document.getElementById('btn-pause-resume').textContent === 'Retomar';
    
    const response = await fetch(`/api/cloud/${isPaused ? 'resume' : 'pause'}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    loadSyncStatus();
  } catch (error) {
    console.error('Erro ao pausar/retomar sincronização:', error);
    alert('Erro ao pausar/retomar sincronização.');
  }
}

function restoreBackup(fileName) {
  document.getElementById('restore-message').textContent = `Você tem certeza que deseja restaurar o backup ${fileName}? Todos os dados atuais serão substituídos.`;
  document.getElementById('restore-modal').dataset.fileName = fileName;
  document.getElementById('restore-modal').style.display = 'flex';
}

async function confirmRestore() {
  const fileName = document.getElementById('restore-modal').dataset.fileName;
  hideRestoreModal();

  if (!confirm(`Tem certeza que deseja restaurar o backup ${fileName}? Todos os dados atuais serão perdidos.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/cloud/restore/${fileName}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert(result.success ? 'Backup restaurado com sucesso!' : 'Erro ao restaurar backup.');
    loadAvailableBackups();
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    alert('Erro ao restaurar backup.');
  }
}

async function deleteBackup(fileName) {
  if (!confirm(`Tem certeza que deseja excluir o backup ${fileName}? Esta ação não pode ser desfeita.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/cloud/backup/${fileName}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert(result.success ? 'Backup excluído com sucesso!' : 'Erro ao excluir backup.');
    loadAvailableBackups();
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    alert('Erro ao excluir backup.');
  }
}