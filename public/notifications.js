// notifications.js

document.addEventListener('DOMContentLoaded', () => {
  let notifications = [];
  let currentPage = 1;
  const itemsPerPage = 10;

  // Carregar notificações
  loadNotifications();

  // Eventos
  document.getElementById('btn-mark-all-read').addEventListener('click', markAllAsRead);
  document.getElementById('btn-clear-all').addEventListener('click', clearAllNotifications);
  document.getElementById('btn-prev').addEventListener('click', () => changePage(-1));
  document.getElementById('btn-next').addEventListener('click', () => changePage(1));

  // Eventos de filtros
  document.querySelectorAll('.filter-group select').forEach(select => {
    select.addEventListener('change', filterNotifications);
  });
});

async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    notifications = await response.json();
    renderNotifications();
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    alert('Erro ao carregar notificações.');
  }
}

function renderNotifications() {
  const list = document.getElementById('notifications-list');
  list.innerHTML = '';

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = notifications.slice(start, end);

  pageData.forEach(notification => {
    const item = document.createElement('div');
    item.className = `notification-item ${notification.is_read ? '' : 'unread'} ${notification.type || 'info'}`;
    
    const date = new Date(notification.created_at);
    const timeString = date.toLocaleString('pt-BR');

    item.innerHTML = `
      <div class="notification-header">
        <h3 class="notification-title">${notification.title}</h3>
        <span class="notification-time">${timeString}</span>
      </div>
      <p class="notification-message">${notification.message}</p>
      <div class="notification-actions">
        ${!notification.is_read ? 
          `<button class="btn-small btn-mark-read" onclick="markAsRead(${notification.id})">Marcar como Lida</button>` : ''}
        <button class="btn-small btn-delete" onclick="deleteNotification(${notification.id})">Excluir</button>
      </div>
    `;

    list.appendChild(item);
  });

  updatePagination();
}

function filterNotifications() {
  const type = document.getElementById('filter-type').value;
  const status = document.getElementById('filter-status').value;
  const period = document.getElementById('filter-period').value;

  let filtered = [...notifications];

  // Filtrar por tipo
  if (type !== 'all') {
    filtered = filtered.filter(n => n.type === type);
  }

  // Filtrar por status
  if (status !== 'all') {
    filtered = filtered.filter(n => {
      if (status === 'unread') return !n.is_read;
      if (status === 'read') return n.is_read;
      return true;
    });
  }

  // Filtrar por período
  if (period !== 'all') {
    const days = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    filtered = filtered.filter(n => {
      const notificationDate = new Date(n.created_at);
      return notificationDate >= cutoffDate;
    });
  }

  notifications = filtered;
  currentPage = 1;
  renderNotifications();
}

async function markAsRead(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    // Atualizar interface
    const item = event.target.closest('.notification-item');
    item.classList.remove('unread');
    item.querySelector('.btn-mark-read')?.remove();

    // Atualizar dados
    const index = notifications.findIndex(n => n.id == notificationId);
    if (index !== -1) {
      notifications[index].is_read = 1;
    }

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    alert('Erro ao marcar notificação como lida.');
  }
}

async function markAllAsRead() {
  if (!confirm('Tem certeza que deseja marcar todas as notificações como lidas?')) return;

  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    // Atualizar interface
    document.querySelectorAll('.notification-item.unread').forEach(item => {
      item.classList.remove('unread');
      item.querySelector('.btn-mark-read')?.remove();
    });

    // Atualizar dados
    notifications.forEach(n => n.is_read = 1);

    alert('Todas as notificações foram marcadas como lidas!');
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    alert('Erro ao marcar todas as notificações como lidas.');
  }
}

async function deleteNotification(notificationId) {
  if (!confirm('Tem certeza que deseja excluir esta notificação?')) return;

  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    // Remover da interface
    event.target.closest('.notification-item').remove();

    // Remover dos dados
    const index = notifications.findIndex(n => n.id == notificationId);
    if (index !== -1) {
      notifications.splice(index, 1);
    }

    updatePagination();
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    alert('Erro ao excluir notificação.');
  }
}

async function clearAllNotifications() {
  if (!confirm('Tem certeza que deseja excluir TODAS as notificações?')) return;

  try {
    // Excluir todas individualmente (ou implementar endpoint bulk delete)
    const deletePromises = notifications.map(n => 
      fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })
    );

    await Promise.all(deletePromises);

    // Limpar interface
    document.getElementById('notifications-list').innerHTML = '';
    notifications = [];

    alert('Todas as notificações foram excluídas!');
  } catch (error) {
    console.error('Erro ao limpar todas as notificações:', error);
    alert('Erro ao limpar todas as notificações.');
  }
}

function changePage(direction) {
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  currentPage += direction;

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  renderNotifications();
}

function updatePagination() {
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;

  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;
}