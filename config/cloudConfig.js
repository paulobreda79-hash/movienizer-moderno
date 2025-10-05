// cloudConfig.js

const cloudConfig = {
  // Configurações do provedor de nuvem (ex: AWS S3, Google Drive, Dropbox, etc.)
  provider: process.env.CLOUD_PROVIDER || 'aws', // aws, google, dropbox, onedrive
  
  // AWS S3 Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_BUCKET_NAME || 'movienizer-backups'
  },

  // Google Drive Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  },

  // Dropbox Configuration
  dropbox: {
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    appKey: process.env.DROPBOX_APP_KEY,
    appSecret: process.env.DROPBOX_APP_SECRET
  },

  // OneDrive Configuration
  onedrive: {
    clientId: process.env.ONEDRIVE_CLIENT_ID,
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
    refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN
  },

  // Configurações gerais de sincronização
  sync: {
    autoSync: process.env.AUTO_SYNC === 'true' || false,
    syncInterval: parseInt(process.env.SYNC_INTERVAL) || 3600000, // 1 hora em ms
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 1024 * 1024, // 1MB
    compression: process.env.COMPRESSION === 'true' || true,
    encryption: process.env.ENCRYPTION === 'true' || true
  },

  // Configurações de segurança
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'movienizer-default-key-32-characters!!',
    salt: process.env.ENCRYPTION_SALT || 'movienizer-salt-16-chars!!',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc'
  },

  // Configurações de rede
  network: {
    timeout: parseInt(process.env.NETWORK_TIMEOUT) || 30000, // 30 segundos
    maxConcurrentUploads: parseInt(process.env.MAX_CONCURRENT_UPLOADS) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000 // 1 segundo
  }
};

module.exports = cloudConfig;