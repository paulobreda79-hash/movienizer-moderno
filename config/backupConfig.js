// backupConfig.js

const path = require('path');

const backupConfig = {
  // Configurações gerais de backup
  general: {
    enabled: process.env.BACKUP_ENABLED === 'true' || true,
    frequency: process.env.BACKUP_FREQUENCY || 'daily', // hourly, daily, weekly, monthly
    retention: parseInt(process.env.BACKUP_RETENTION) || 30, // dias para manter backups
    maxBackups: parseInt(process.env.BACKUP_MAX_BACKUPS) || 10,
    compression: process.env.BACKUP_COMPRESSION === 'true' || true,
    encryption: process.env.BACKUP_ENCRYPTION === 'true' || true
  },

  // Configurações de backup local
  local: {
    enabled: process.env.LOCAL_BACKUP_ENABLED === 'true' || true,
    directory: process.env.LOCAL_BACKUP_DIR || path.join(__dirname, '../backups'),
    maxSize: parseInt(process.env.LOCAL_BACKUP_MAX_SIZE) || 1024, // MB
    autoCleanup: process.env.LOCAL_BACKUP_AUTO_CLEANUP === 'true' || true
  },

  // Configurações de backup na nuvem
  cloud: {
    enabled: process.env.CLOUD_BACKUP_ENABLED === 'true' || false,
    provider: process.env.CLOUD_BACKUP_PROVIDER || 'aws', // aws, google, dropbox, onedrive
    bucket: process.env.CLOUD_BACKUP_BUCKET || 'movienizer-backups',
    region: process.env.CLOUD_BACKUP_REGION || 'us-east-1'
  },

  // Configurações de segurança
  security: {
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'movienizer-backup-key-32-chars!!',
    salt: process.env.BACKUP_ENCRYPTION_SALT || 'movienizer-backup-salt-16-chars!',
    algorithm: process.env.BACKUP_ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de notificação
  notifications: {
    enabled: process.env.BACKUP_NOTIFICATIONS_ENABLED === 'true' || true,
    email: process.env.BACKUP_NOTIFICATION_EMAIL === 'true' || false,
    system: process.env.BACKUP_NOTIFICATION_SYSTEM === 'true' || true
  },

  // Configurações de agendamento
  schedule: {
    hourly: '0 * * * *', // a cada hora
    daily: '0 2 * * *',   // diariamente às 2h
    weekly: '0 3 * * 0',  // semanalmente domingo às 3h
    monthly: '0 4 1 * *' // mensalmente no dia 1 às 4h
  }
};

module.exports = backupConfig;