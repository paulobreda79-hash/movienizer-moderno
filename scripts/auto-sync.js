// scripts/auto-sync.js

const SyncService = require('../services/syncService');
const cloudConfig = require('../config/cloudConfig');

async function startAutoSync() {
  console.log('Iniciando serviço de sincronização automática...');

  if (cloudConfig.sync.autoSync) {
    // Configurar sincronização periódica
    setInterval(async () => {
      try {
        console.log('Executando sincronização automática...');
        // Aqui você pode obter o userId de alguma forma
        // Por enquanto, vamos usar um placeholder
        const userId = 1; // Este deve vir do contexto de usuário
        await SyncService.syncAllData(userId);
      } catch (error) {
        console.error('Erro na sincronização automática:', error);
      }
    }, cloudConfig.sync.syncInterval);

    console.log(`Sincronização automática configurada para executar a cada ${cloudConfig.sync.syncInterval / 1000 / 60} minutos`);
  } else {
    console.log('Sincronização automática desativada');
  }
}

// Executar imediatamente se chamado diretamente
if (require.main === module) {
  startAutoSync();
}

module.exports = { startAutoSync };