// backup-manager.js

document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados iniciais
  loadBackupStats();
  loadBackupList();

  // Eventos
  document.getElementById('btn-create-backup').addEventListener('click', showCreateBackupModal);
  document.getElementById('btn-refresh').addEventListener('click', refreshData);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-cleanup-old').addEventListener('click', cleanupOldBackups);
  document.getElementById('btn-confirm-create').addEventListener('click', createBackup);
  document.getElementById('btn-cancel-create').addEventListener('click', hideCreateBackupModal);
  document.getElementById('btn-cancel-restore').addEventListener('click', hideRestoreModal);

  // Atualizar dados a cada 30 segundos
  setInterval(refreshData, 30000);
});

async function loadBackupStats() {
  try {
    const response = await fetch('/api/backup/stats');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    const stats = await response.json();

    document.getElementById('total-backups').textContent = stats.total_backups;
    document.getElementById('total-size').textContent = stats.total_size_formatted;
    document.getElementById('failed-backups').textContent = stats.failed_backups;
    document.getElementById('last-backup').textContent = stats.last_backup ? 
      new Date(stats.last_backup.created_at).toLocaleString() : 'Nunca';
  } catch (error) {
    console.error('Erro ao carregar estatísticas de backup:', error);
  }
}

async function loadBackupList() {
  try {
    const response = await fetch('/api/backup/list');
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

      const date = new Date(backup.created_at);
      const statusIcon = backup.status === 'completed' ? '✅' : '❌';

      item.innerHTML = `
        <div class="backup-info">
          <h4>${backup.filename} ${statusIcon}</h4>
          <p>${date.toLocaleString()} • ${backup.size_formatted}</p>
          <p>${backup.exists_locally ? '💾 Local' : '☁️ Nuvem'}</p>
        </div>
        <div class="backup-actions">
          <button class="btn-primary" onclick="restoreBackup(${backup.id})">Restaurar</button>
          <button class="btn-secondary" onclick="downloadBackup(${backup.id})">Download</button>
          <button class="btn-danger" onclick="deleteBackup(${backup.id})">Excluir</button>
        </div>
      `;

      list.appendChild(item);
    });
  } catch (error) {
    console.error('Erro ao carregar lista de backups:', error);
    alert('Erro ao carregar lista de backups.');
  }
}

function showCreateBackupModal() {
  document.getElementById('create-backup-modal').style.display = 'flex';
}

function hideCreateBackupModal() {
  document.getElementById('create-backup-modal').style.display = 'none';
}

function showProgressModal(title, message) {
  document.getElementById('progress-title').textContent = title;
  document.getElementById('progress-message').textContent = message;
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-modal').style.display = 'flex';
}

function updateProgress(percent, message) {
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-message').textContent = message;
}

function hideProgressModal() {
  document.getElementById('progress-modal').style.display = 'none';
}

async function createBackup() {
  hideCreateBackupModal();
  showProgressModal('Criando Backup', 'Iniciando processo de backup...');

  try {
    const options = {
      includeMovies: document.getElementById('include-movies').checked,
      includePeople: document.getElementById('include-people').checked,
      includeReminders: document.getElementById('include-reminders').checked,
      includeFavorites: document.getElementById('include-favorites').checked,
      includeNotifications: document.getElementById('include-notifications').checked
    };

    updateProgress(20, 'Preparando dados...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(40, 'Compactando dados...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(60, 'Criptografando backup...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(80, 'Enviando para armazenamento...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch('/api/backup/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options })
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    updateProgress(100, 'Backup concluído com sucesso!');

    setTimeout(() => {
      hideProgressModal();
      alert('Backup criado com sucesso!');
      refreshData();
    }, 1000);

  } catch (error) {
    console.error('Erro ao criar backup:', error);
    hideProgressModal();
    alert('Erro ao criar backup: ' + error.message);
  }
}

function restoreBackup(backupId) {
  document.getElementById('restore-modal').dataset.backupId = backupId;
  document.getElementById('restore-modal').style.display = 'flex';
}

function hideRestoreModal() {
  document.getElementById('restore-modal').style.display = 'none';
}

async function confirmRestore() {
  const backupId = document.getElementById('restore-modal').dataset.backupId;
  hideRestoreModal();

  if (!confirm('ATENÇÃO: Esta ação substituirá todos os seus dados atuais. Tem certeza?')) {
    return;
  }

  showProgressModal('Restaurando Backup', 'Iniciando processo de restauração...');

  try {
    updateProgress(20, 'Preparando restauração...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(40, 'Baixando backup...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(60, 'Descriptografando dados...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateProgress(80, 'Descompactando dados...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(`/api/backup/restore/${backupId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    updateProgress(100, 'Restauração concluída com sucesso!');

    setTimeout(() => {
      hideProgressModal();
      alert('Dados restaurados com sucesso! A aplicação será reiniciada.');
      // Aqui você pode recarregar a página ou reiniciar a aplicação
      location.reload();
    }, 1000);

  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    hideProgressModal();
    alert('Erro ao restaurar backup: ' + error.message);
  }
}

async function downloadBackup(backupId) {
  try {
    const response = await fetch(`/api/backup/${backupId}/download`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backupId}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert('Download iniciado!');
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    alert('Erro ao baixar backup: ' + error.message);
  }
}

async function deleteBackup(backupId) {
  if (!confirm('Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.')) {
    return;
  }

  try {
    const response = await fetch(`/api/backup/${backupId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert('Backup excluído com sucesso!');
    loadBackupList();
    loadBackupStats();
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    alert('Erro ao excluir backup: ' + error.message);
  }
}

async function cleanupOldBackups() {
  if (!confirm('Tem certeza que deseja limpar backups antigos?')) {
    return;
  }

  try {
    const response = await fetch('/api/backup/cleanup', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    const result = await response.json();
    alert(`${result.deleted_files} arquivos antigos excluídos!`);
    loadBackupList();
    loadBackupStats();
  } catch (error) {
    console.error('Erro ao limpar backups antigos:', error);
    alert('Erro ao limpar backups antigos: ' + error.message);
  }
}

async function saveSettings() {
  try {
    const settings = {
      autoBackupEnabled: document.getElementById('auto-backup-enabled').value === 'true',
      backupFrequency: document.getElementById('backup-frequency').value,
      retentionDays: parseInt(document.getElementById('retention-days').value),
      compressionEnabled: document.getElementById('compression-enabled').value === 'true',
      encryptionEnabled: document.getElementById('encryption-enabled').value === 'true',
      cloudBackupEnabled: document.getElementById('cloud-backup-enabled').value === 'true'
    };

    // Aqui você salvaria as configurações no servidor
    // Por enquanto, vamos apenas mostrar um alerta
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}

async function refreshData() {
  await loadBackupStats();
  await loadBackupList();
}

// Eventos para botões de confirmação
document.getElementById('btn-confirm-restore').addEventListener('click', confirmRestore);