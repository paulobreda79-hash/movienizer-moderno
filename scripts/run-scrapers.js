const ScraperService = require('../services/scraperService');

async function runScrapers() {
  console.log('Iniciando atualização automática de dados...');

  // Atualizar todos os filmes
  console.log('Atualizando filmes...');
  await ScraperService.updateAllMovies();

  // Atualizar todas as pessoas
  console.log('Atualizando pessoas...');
  await ScraperService.updateAllPeople();

  console.log('Atualização automática concluída!');
}

// Executar imediatamente ou agendar
if (require.main === module) {
  runScrapers();
}

module.exports = runScrapers;