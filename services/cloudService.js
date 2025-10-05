// cloudService.js

const AWS = require('aws-sdk');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const cloudConfig = require('../config/cloudConfig');
const EncryptionService = require('./encryptionService');

class CloudService {
  constructor() {
    this.provider = cloudConfig.provider;
    this.client = this.initializeClient();
  }

  initializeClient() {
    switch (this.provider) {
      case 'aws':
        return this.initAWS();
      case 'google':
        return this.initGoogleDrive();
      case 'dropbox':
        return this.initDropbox();
      case 'onedrive':
        return this.initOneDrive();
      default:
        throw new Error(`Provedor de nuvem não suportado: ${this.provider}`);
    }
  }

  // AWS S3
  initAWS() {
    const s3 = new AWS.S3({
      accessKeyId: cloudConfig.aws.accessKeyId,
      secretAccessKey: cloudConfig.aws.secretAccessKey,
      region: cloudConfig.aws.region
    });

    return {
      upload: async (fileName, data, metadata = {}) => {
        const params = {
          Bucket: cloudConfig.aws.bucketName,
          Key: fileName,
          Body: data,
          Metadata: metadata
        };

        return await s3.upload(params).promise();
      },
      download: async (fileName) => {
        const params = {
          Bucket: cloudConfig.aws.bucketName,
          Key: fileName
        };

        const data = await s3.getObject(params).promise();
        return data.Body;
      },
      listFiles: async (prefix = '') => {
        const params = {
          Bucket: cloudConfig.aws.bucketName,
          Prefix: prefix
        };

        const data = await s3.listObjectsV2(params).promise();
        return data.Contents || [];
      },
      deleteFile: async (fileName) => {
        const params = {
          Bucket: cloudConfig.aws.bucketName,
          Key: fileName
        };

        return await s3.deleteObject(params).promise();
      }
    };
  }

  // Google Drive
  initGoogleDrive() {
    const auth = new google.auth.OAuth2(
      cloudConfig.google.clientId,
      cloudConfig.google.clientSecret,
      cloudConfig.google.redirectUri
    );

    auth.setCredentials({ refresh_token: cloudConfig.google.refreshToken });

    const drive = google.drive({ version: 'v3', auth });

    return {
      upload: async (fileName, data, metadata = {}) => {
        const media = {
          mimeType: 'application/json',
          body: typeof data === 'string' ? data : JSON.stringify(data)
        };

        const fileMetadata = {
          name: fileName,
          parents: ['appDataFolder'],
          appProperties: metadata
        };

        return await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id'
        });
      },
      download: async (fileId) => {
        const response = await drive.files.get({
          fileId: fileId,
          alt: 'media'
        });

        return response.data;
      },
      listFiles: async (query = '') => {
        const q = query || "'appDataFolder' in parents";
        const response = await drive.files.list({
          q: q,
          spaces: 'appDataFolder',
          fields: 'files(id, name, appProperties, modifiedTime)'
        });

        return response.data.files || [];
      },
      deleteFile: async (fileId) => {
        return await drive.files.delete({ fileId });
      }
    };
  }

  // Dropbox
  initDropbox() {
    return {
      upload: async (fileName, data, metadata = {}) => {
        const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudConfig.dropbox.accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: `/${fileName}`,
              mode: 'overwrite',
              autorename: true,
              mute: false
            }),
            'Content-Type': 'application/octet-stream'
          },
          body: typeof data === 'string' ? data : JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`Dropbox upload failed: ${response.statusText}`);
        }

        return await response.json();
      },
      download: async (fileName) => {
        const response = await fetch('https://content.dropboxapi.com/2/files/download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudConfig.dropbox.accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: `/${fileName}`
            })
          }
        });

        if (!response.ok) {
          throw new Error(`Dropbox download failed: ${response.statusText}`);
        }

        return await response.text();
      },
      listFiles: async (path = '') => {
        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudConfig.dropbox.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: path,
            recursive: false,
            include_media_info: false,
            include_deleted: false,
            include_has_explicit_shared_members: false
          })
        });

        if (!response.ok) {
          throw new Error(`Dropbox list failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.entries || [];
      },
      deleteFile: async (fileName) => {
        const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudConfig.dropbox.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: `/${fileName}`
          })
        });

        if (!response.ok) {
          throw new Error(`Dropbox delete failed: ${response.statusText}`);
        }

        return await response.json();
      }
    };
  }

  // OneDrive
  initOneDrive() {
    return {
      upload: async (fileName, data, metadata = {}) => {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${fileName}:/content`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${cloudConfig.onedrive.refreshToken}`,
            'Content-Type': 'application/json'
          },
          body: typeof data === 'string' ? data : JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`OneDrive upload failed: ${response.statusText}`);
        }

        return await response.json();
      },
      download: async (fileName) => {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${fileName}:/content`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cloudConfig.onedrive.refreshToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`OneDrive download failed: ${response.statusText}`);
        }

        return await response.text();
      },
      listFiles: async (folderPath = '') => {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot${folderPath ? ':/' + folderPath + ':/children' : '/children'}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cloudConfig.onedrive.refreshToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`OneDrive list failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
      },
      deleteFile: async (fileName) => {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/special/approot:/${fileName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudConfig.onedrive.refreshToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`OneDrive delete failed: ${response.statusText}`);
        }

        return { success: true };
      }
    };
  }

  async uploadFile(fileName, data, metadata = {}) {
    try {
      // Comprimir dados se necessário
      const compressedData = EncryptionService.compressData(data);
      
      // Criptografar dados se necessário
      const encryptedData = EncryptionService.encryptData(compressedData);

      // Upload para a nuvem
      const result = await this.client.upload(fileName, encryptedData, {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        hash: EncryptionService.generateHash(data)
      });

      console.log(`Arquivo ${fileName} enviado com sucesso para a nuvem`);
      return result;
    } catch (error) {
      console.error(`Erro ao enviar arquivo ${fileName} para a nuvem:`, error);
      throw error;
    }
  }

  async downloadFile(fileName) {
    try {
      // Download da nuvem
      const encryptedData = await this.client.download(fileName);

      // Descriptografar dados se necessário
      const decryptedData = EncryptionService.decryptData(encryptedData);

      // Descomprimir dados se necessário
      const decompressedData = EncryptionService.decompressData(decryptedData);

      console.log(`Arquivo ${fileName} baixado com sucesso da nuvem`);
      return decompressedData;
    } catch (error) {
      console.error(`Erro ao baixar arquivo ${fileName} da nuvem:`, error);
      throw error;
    }
  }

  async listFiles(prefix = '') {
    try {
      const files = await this.client.listFiles(prefix);
      console.log(`Listagem de arquivos obtida com sucesso`);
      return files;
    } catch (error) {
      console.error('Erro ao listar arquivos da nuvem:', error);
      throw error;
    }
  }

  async deleteFile(fileName) {
    try {
      const result = await this.client.deleteFile(fileName);
      console.log(`Arquivo ${fileName} excluído com sucesso da nuvem`);
      return result;
    } catch (error) {
      console.error(`Erro ao excluir arquivo ${fileName} da nuvem:`, error);
      throw error;
    }
  }
}

module.exports = new CloudService();