// reminders.js

document.addEventListener('DOMContentLoaded', () => {
  let reminders = [];
  let currentTab = 'upcoming';

  // Carregar lembretes
  loadReminders();

  // Eventos
  document.getElementById('btn-add-reminder').addEventListener('click', showAddReminderModal);
  document.getElementById('btn-cancel-reminder').addEventListener('click', hideReminderModal);
  document.getElementById('reminder-form').addEventListener('submit', saveReminder);

  // Eventos das abas
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      filterReminders();
    });
  });
});

async function loadReminders() {
  try {
    const response = await fetch('/api/reminders');
    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }
    reminders = await response.json();
    filterReminders();
  } catch (error) {
    console.error('Erro ao carregar lembretes:', error);
    alert('Erro ao carregar lembretes.');
  }
}

function filterReminders() {
  let filtered = [...reminders];

  switch (currentTab) {
    case 'upcoming':
      filtered = filtered.filter(r => !r.is_completed && new Date(r.reminder_date) >= new Date());
      break;
    case 'overdue':
      filtered = filtered.filter(r => !r.is_completed && new Date(r.reminder_date) < new Date());
      break;
    case 'completed':
      filtered = filtered.filter(r => r.is_completed);
      break;
    case 'all':
      // Todos os lembretes
      break;
  }

  renderReminders(filtered);
}

function renderReminders(remindersToShow) {
  const list = document.getElementById('reminders-list');
  list.innerHTML = '';

  if (remindersToShow.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #777;">Nenhum lembrete encontrado.</p>';
    return;
  }

  remindersToShow.forEach(reminder => {
    const item = document.createElement('div');
    item.className = `reminder-item ${reminder.is_completed ? 'completed' : ''} ${new Date(reminder.reminder_date) < new Date() && !reminder.is_completed ? 'overdue' : ''}`;
    
    const date = new Date(reminder.reminder_date);
    const dateString = date.toLocaleString('pt-BR');

    item.innerHTML = `
      <div class="reminder-header">
        <h3 class="reminder-title">${reminder.title}</h3>
        <span class="reminder-date">${dateString}</span>
      </div>
      ${reminder.description ? `<p class="reminder-description">${reminder.description}</p>` : ''}
      <div class="reminder-meta">
        ${reminder.is_recurring ? `<div class="meta-item">🔁 Recorrente</div>` : ''}
        ${reminder.related_movie_id ? `<div class="meta-item">🎬 Filme</div>` : ''}
        ${reminder.related_person_id ? `<div class="meta-item">👤 Pessoa</div>` : ''}
      </div>
      <div class="reminder-actions">
        ${!reminder.is_completed ? `
          <button class="btn-small btn-complete" onclick="completeReminder(${reminder.id})">Completar</button>
          <button class="btn-small btn-edit" onclick="editReminder(${reminder.id})">Editar</button>
        ` : ''}
        <button class="btn-small btn-delete" onclick="deleteReminder(${reminder.id})">Excluir</button>
      </div>
    `;

    list.appendChild(item);
  });
}

function showAddReminderModal() {
  document.getElementById('modal-title').textContent = 'Adicionar Lembrete';
  document.getElementById('reminder-id').value = '';
  document.getElementById('reminder-title').value = '';
  document.getElementById('reminder-description').value = '';
  document.getElementById('reminder-date').value = '';
  document.getElementById('reminder-recurrence').value = 'none';
  document.getElementById('reminder-related').value = 'none';
  document.getElementById('reminder-modal').style.display = 'flex';
}

function hideReminderModal() {
  document.getElementById('reminder-modal').style.display = 'none';
}

function editReminder(reminderId) {
  const reminder = reminders.find(r => r.id == reminderId);
  if (!reminder) return;

  document.getElementById('modal-title').textContent = 'Editar Lembrete';
  document.getElementById('reminder-id').value = reminder.id;
  document.getElementById('reminder-title').value = reminder.title;
  document.getElementById('reminder-description').value = reminder.description || '';
  
  const date = new Date(reminder.reminder_date);
  const isoString = date.toISOString().slice(0, 16);
  document.getElementById('reminder-date').value = isoString;
  
  document.getElementById('reminder-recurrence').value = reminder.recurrence_pattern || 'none';
  document.getElementById('reminder-related').value = reminder.related_movie_id ? 'movie' : (reminder.related_person_id ? 'person' : 'none');
  
  document.getElementById('reminder-modal').style.display = 'flex';
}

async function saveReminder(e) {
  e.preventDefault();

  const reminderId = document.getElementById('reminder-id').value;
  const reminderData = {
    title: document.getElementById('reminder-title').value,
    description: document.getElementById('reminder-description').value,
    reminder_date: document.getElementById('reminder-date').value,
    is_recurring: document.getElementById('reminder-recurrence').value !== 'none',
    recurrence_pattern: document.getElementById('reminder-recurrence').value !== 'none' ? 
      document.getElementById('reminder-recurrence').value : null,
    related_movie_id: document.getElementById('reminder-related').value === 'movie' ? 1 : null,
    related_person_id: document.getElementById('reminder-related').value === 'person' ? 1 : null
  };

  try {
    let response;
    if (reminderId) {
      // Atualizar lembrete existente
      response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData)
      });
    } else {
      // Criar novo lembrete
      response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData)
      });
    }

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    hideReminderModal();
    alert(reminderId ? 'Lembrete atualizado com sucesso!' : 'Lembrete criado com sucesso!');
    loadReminders(); // Recarregar lista
  } catch (error) {
    console.error('Erro ao salvar lembrete:', error);
    alert('Erro ao salvar lembrete.');
  }
}

async function completeReminder(reminderId) {
  if (!confirm('Tem certeza que deseja marcar este lembrete como completado?')) return;

  try {
    const response = await fetch(`/api/reminders/${reminderId}/complete`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    // Atualizar interface
    const item = event.target.closest('.reminder-item');
    item.classList.add('completed');
    item.querySelector('.reminder-actions').innerHTML = `
      <button class="btn-small btn-delete" onclick="deleteReminder(${reminderId})">Excluir</button>
    `;

    // Atualizar dados
    const index = reminders.findIndex(r => r.id == reminderId);
    if (index !== -1) {
      reminders[index].is_completed = 1;
    }

    alert('Lembrete completado com sucesso!');
  } catch (error) {
    console.error('Erro ao completar lembrete:', error);
    alert('Erro ao completar lembrete.');
  }
}

async function deleteReminder(reminderId) {
  if (!confirm('Tem certeza que deseja excluir este lembrete?')) return;

  try {
    const response = await fetch(`/api/reminders/${reminderId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Erro: ${response.status}`);
    }

    // Remover da interface
    event.target.closest('.reminder-item').remove();

    // Remover dos dados
    const index = reminders.findIndex(r => r.id == reminderId);
    if (index !== -1) {
      reminders.splice(index, 1);
    }

    alert('Lembrete excluído com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir lembrete:', error);
    alert('Erro ao excluir lembrete.');
  }
}