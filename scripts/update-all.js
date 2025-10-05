const cron = require('node-cron');
const ScraperService = require('../services/scraperService');

// Agendar atualizações automáticas
cron.schedule('0 2 * * *', async () => { // Todos os dias às 2h
  console.log('Iniciando atualização automática...');
  await ScraperService.updateAllMovies();
  await ScraperService.updateAllPeople();
  console.log('Atualização automática concluída!');
});

console.log('Serviço de atualização automática iniciado!');

module.exports = { start: () => cron.start() };