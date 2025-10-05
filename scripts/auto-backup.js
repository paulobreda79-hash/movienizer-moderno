// scripts/auto-backup.js

const BackupService = require('../services/backupService');
const backupConfig = require('../config/backupConfig');

async function startAutoBackup() {
  console.log('Iniciando serviço de backup automático...');

  if (backupConfig.general.enabled) {
    await BackupService.scheduleAutoBackup();
  } else {
    console.log('Backups automáticos desativados');
  }
}

// Executar imediatamente se chamado diretamente
if (require.main === module) {
  startAutoBackup();
}

module.exports = { startAutoBackup };