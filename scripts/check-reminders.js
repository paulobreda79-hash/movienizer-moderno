const ReminderService = require('../services/reminderService');

async function checkReminders() {
  console.log('Verificando lembretes pendentes...');
  await ReminderService.checkPendingReminders();
  console.log('Verificação de lembretes concluída.');
}

// Executar imediatamente ou agendar
if (require.main === module) {
  checkReminders();
}

module.exports = checkReminders;