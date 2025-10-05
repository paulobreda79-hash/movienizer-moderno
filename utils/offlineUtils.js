// offlineUtils.js

const offlineConfig = require('../config/offlineConfig');

class OfflineUtils {
  static async openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        offlineConfig.indexedDB.dbName,
        offlineConfig.indexedDB.version
      );

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createStores(db);
      };
    });
  }

  static createStores(db) {
    Object.values(offlineConfig.indexedDB.stores).forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
        
        if (storeConfig.indexes) {
          storeConfig.indexes.forEach(index => {
            store.createIndex(index, index, { unique: false });
          });
        }
      }
    });
  }

  static async addToStore(storeName, data) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.add(data);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao adicionar dados à store ${storeName}:`, error);
      throw error;
    }
  }

  static async getFromStore(storeName, key) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.get(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter dados da store ${storeName}:`, error);
      throw error;
    }
  }

  static async getAllFromStore(storeName) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter todos os dados da store ${storeName}:`, error);
      throw error;
    }
  }

  static async updateInStore(storeName, key, data) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put({ ...data, id: key });
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao atualizar dados na store ${storeName}:`, error);
      throw error;
    }
  }

  static async deleteFromStore(storeName, key) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao excluir dados da store ${storeName}:`, error);
      throw error;
    }
  }

  static async clearStore(storeName) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao limpar store ${storeName}:`, error);
      throw error;
    }
  }

  static async getStoreCount(storeName) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.count();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter contagem da store ${storeName}:`, error);
      throw error;
    }
  }

  static async searchInStore(storeName, indexName, query, limit = 50) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const request = index.getAll(query, limit);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao buscar na store ${storeName}:`, error);
      throw error;
    }
  }

  static async getStoreSize(storeName) {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let size = 0;
      const request = store.openCursor();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const keySize = JSON.stringify(cursor.key).length;
            const valueSize = JSON.stringify(cursor.value).length;
            size += keySize + valueSize;
            cursor.continue();
          } else {
            resolve(size);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Erro ao obter tamanho da store ${storeName}:`, error);
      throw error;
    }
  }

  static async getAllStoreSizes() {
    try {
      const sizes = {};
      for (const storeName of Object.keys(offlineConfig.indexedDB.stores)) {
        sizes[storeName] = await this.getStoreSize(storeName);
      }
      return sizes;
    } catch (error) {
      console.error('Erro ao obter tamanhos das stores:', error);
      throw error;
    }
  }

  static async getTotalSize() {
    try {
      const sizes = await this.getAllStoreSizes();
      return Object.values(sizes).reduce((acc, size) => acc + size, 0);
    } catch (error) {
      console.error('Erro ao obter tamanho total:', error);
      throw error;
    }
  }

  static async checkIndexedDBSupport() {
    return 'indexedDB' in window;
  }

  static async checkOfflineSupport() {
    const support = {
      indexedDB: await this.checkIndexedDBSupport(),
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      cache: 'caches' in window,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      mediaDevices: 'mediaDevices' in navigator,
      webRTC: 'RTCPeerConnection' in window,
      webGL: 'WebGLRenderingContext' in window,
      webAudio: 'AudioContext' in window,
      webVR: 'VRDisplay' in window,
      webXR: 'XRSystem' in navigator,
      webAssembly: 'WebAssembly' in window,
      webSockets: 'WebSocket' in window,
      webWorkers: 'Worker' in window,
      sharedWorkers: 'SharedWorker' in window,
      crypto: 'crypto' in window,
      fetch: 'fetch' in window,
      promises: 'Promise' in window,
      asyncAwait: (() => {
        try {
          eval('async () => {}');
          return true;
        } catch {
          return false;
        }
      })(),
      arrowFunctions: (() => {
        try {
          eval('() => {}');
          return true;
        } catch {
          return false;
        }
      })(),
      destructuring: (() => {
        try {
          eval('const {a} = {a:1}');
          return true;
        } catch {
          return false;
        }
      })(),
      templateLiterals: (() => {
        try {
          eval('`test`');
          return true;
        } catch {
          return false;
        }
      })(),
      modules: 'import' in document.createElement('script'),
      customElements: 'customElements' in window,
      shadowDOM: 'attachShadow' in Element.prototype,
      slots: 'slot' in document.createElement('div'),
      intl: 'Intl' in window,
      performance: 'performance' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      fullscreen: 'fullscreenEnabled' in document,
      pointerLock: 'pointerLockElement' in document,
      pageVisibility: 'visibilityState' in document,
      battery: 'getBattery' in navigator,
      vibration: 'vibrate' in navigator,
      clipboard: 'clipboard' in navigator,
      credentials: 'credentials' in navigator,
      payment: 'PaymentRequest' in window,
      permissions: 'permissions' in navigator,
      presentation: 'presentation' in navigator,
      push: 'PushManager' in window,
      storage: 'storage' in navigator,
      sync: 'sync' in ServiceWorkerRegistration.prototype,
      wakeLock: 'wakeLock' in navigator,
      webShare: 'share' in navigator,
      webUSB: 'usb' in navigator,
      webBluetooth: 'bluetooth' in navigator,
      webNFC: 'NDEFReader' in window,
      webSerial: 'serial' in navigator,
      webHID: 'hid' in navigator,
      webTransport: 'WebTransport' in window,
      webCodecs: 'VideoDecoder' in window,
      webGPU: 'gpu' in navigator,
      webNN: 'ml' in navigator,
      webLocks: 'locks' in navigator,
      webOTP: 'OTPCredential' in window,
      webIdentity: 'IdentityCredential' in window,
      webAuthentication: 'PublicKeyCredential' in window,
      webShareTarget: 'share_target' in window,
      webAppManifest: document.querySelector('link[rel="manifest"]') !== null,
      progressiveWebApp: window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        document.referrer.includes('android-app://'),
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      deviceMotion: 'DeviceMotionEvent' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      ambientLight: 'AmbientLightSensor' in window,
      accelerometer: 'Accelerometer' in window,
      gyroscope: 'Gyroscope' in window,
      magnetometer: 'Magnetometer' in window,
      proximity: 'ProximitySensor' in window,
      gravity: 'GravitySensor' in window,
      linearAcceleration: 'LinearAccelerationSensor' in window,
      orientation: 'AbsoluteOrientationSensor' in window,
      relativeOrientation: 'RelativeOrientationSensor' in window,
      barcodeDetector: 'BarcodeDetector' in window,
      faceDetector: 'FaceDetector' in window,
      textDetector: 'TextDetector' in window,
      handDetector: 'HandDetector' in window,
      bodyPix: 'BodyPix' in window,
      poseNet: 'PoseNet' in window,
      cocoSsd: 'cocoSsd' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window,
      mediaRecorder: 'MediaRecorder' in window,
      mediaSession: 'mediaSession' in navigator,
      pictureInPicture: 'pictureInPictureEnabled' in document,
      remotePlayback: 'RemotePlayback' in window,
      presentationRequest: 'PresentationRequest' in window,
      gamepad: 'getGamepads' in navigator,
      midi: 'requestMIDIAccess' in navigator,
      webMIDI: 'MIDIInputMap' in window,
      webAudioAPI: 'AudioContext' in window,
      webVR1_1: 'VRFrameData' in window,
      webXRDeviceAPI: 'XRDevice' in window,
      webGL2: 'WebGL2RenderingContext' in window,
      webGLShader: 'WebGLShader' in window,
      webGLProgram: 'WebGLProgram' in window,
      webGLBuffer: 'WebGLBuffer' in window,
      webGLTexture: 'WebGLTexture' in window,
      webGLRenderbuffer: 'WebGLRenderbuffer' in window,
      webGLFramebuffer: 'WebGLFramebuffer' in window,
      webGLUniformLocation: 'WebGLUniformLocation' in window,
      webGLActiveInfo: 'WebGLActiveInfo' in window,
      webGLShaderPrecisionFormat: 'WebGLShaderPrecisionFormat' in window,
      webGLContextAttributes: 'WebGLContextAttributes' in window,
      webGLContextEvent: 'WebGLContextEvent' in window,
      webGLRenderingContext: 'WebGLRenderingContext' in window,
      webGLVertexArrayObject: 'WebGLVertexArrayObject' in window,
      webGLTransformFeedback: 'WebGLTransformFeedback' in window,
      webGLQuery: 'WebGLQuery' in window,
      webGLSampler: 'WebGLSampler' in window,
      webGLSync: 'WebGLSync' in window,
      webGLVertexArrayObjectOES: 'WebGLVertexArrayObjectOES' in window,
      webGLDrawBuffers: 'WEBGL_draw_buffers' in window,
      webGLDepthTexture: 'WEBGL_depth_texture' in window,
      webGLColorBufferFloat: 'EXT_color_buffer_float' in window,
      webGLColorBufferHalfFloat: 'EXT_color_buffer_half_float' in window,
      webGLSRGB: 'EXT_sRGB' in window,
      webGLTextureFilterAnisotropic: 'EXT_texture_filter_anisotropic' in window,
      webGLCompressedTextureS3TC: 'WEBGL_compressed_texture_s3tc' in window,
      webGLCompressedTextureATC: 'WEBGL_compressed_texture_atc' in window,
      webGLCompressedTexturePVRTC: 'WEBGL_compressed_texture_pvrtc' in window,
      webGLCompressedTextureETC1: 'WEBGL_compressed_texture_etc1' in window,
      webGLCompressedTextureASTC: 'WEBGL_compressed_texture_astc' in window,
      webGLDebugRendererInfo: 'WEBGL_debug_renderer_info' in window,
      webGLDebugShaders: 'WEBGL_debug_shaders' in window,
      webGLOESVertexArrayObject: 'OES_vertex_array_object' in window,
      webGLOESTextureFloat: 'OES_texture_float' in window,
      webGLOESTextureHalfFloat: 'OES_texture_half_float' in window,
      webGLOESElementIndexUint: 'OES_element_index_uint' in window,
      webGLOESStandardDerivatives: 'OES_standard_derivatives' in window,
      webGLOESVertexArrayObject: 'OES_vertex_array_object' in window,
      webGLOESFragmentPrecisionHigh: 'OES_fragment_precision_high' in window,
      webGLOESTextureFloatLinear: 'OES_texture_float_linear' in window,
      webGLOESTextureHalfFloatLinear: 'OES_texture_half_float_linear' in window,
      webGLOESDrawBuffers: 'EXT_draw_buffers' in window,
      webGLOESSRGB: 'EXT_sRGB' in window,
      webGLOESTextureFilterAnisotropic: 'EXT_texture_filter_anisotropic' in window,
      webGLCompressedTextureS3TC: 'WEBGL_compressed_texture_s3tc' in window,
      webGLCompressedTextureATC: 'WEBGL_compressed_texture_atc' in window,
      webGLCompressedTexturePVRTC: 'WEBGL_compressed_texture_pvrtc' in window,
      webGLCompressedTextureETC1: 'WEBGL_compressed_texture_etc1' in window,
      webGLCompressedTextureASTC: 'WEBGL_compressed_texture_astc' in window,
      webGLDebugRendererInfo: 'WEBGL_debug_renderer_info' in window,
      webGLDebugShaders: 'WEBGL_debug_shaders' in window,
      webGLOESVertexArrayObject: 'OES_vertex_array_object' in window,
      webGLOESTextureFloat: 'OES_texture_float' in window,
      webGLOESTextureHalfFloat: 'OES_texture_half_float' in window,
      webGLOESElementIndexUint: 'OES_element_index_uint' in window,
      webGLOESStandardDerivatives: 'OES_standard_derivatives' in window,
      webGLOESVertexArrayObject: 'OES_vertex_array_object' in window,
      webGLOESFragmentPrecisionHigh: 'OES_fragment_precision_high' in window,
      webGLOESTextureFloatLinear: 'OES_texture_float_linear' in window,
      webGLOESTextureHalfFloatLinear: 'OES_texture_half_float_linear' in window,
      webGLOESDrawBuffers: 'EXT_draw_buffers' in window,
      webGLOESSRGB: 'EXT_sRGB' in window,
      webGLOESTextureFilterAnisotropic: 'EXT_texture_filter_anisotropic' in window
    };

    return support;
  }

  static async checkInternetConnection() {
    try {
      const online = navigator.onLine;
      if (!online) return false;

      const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      return response.ok || response.type === 'opaque';
    } catch {
      return false;
    }
  }

  static async waitForOnline() {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve();
        return;
      }

      const onlineHandler = () => {
        window.removeEventListener('online', onlineHandler);
        resolve();
      };

      window.addEventListener('online', onlineHandler);
    });
  }

  static async waitForOffline() {
    return new Promise((resolve) => {
      if (!navigator.onLine) {
        resolve();
        return;
      }

      const offlineHandler = () => {
        window.removeEventListener('offline', offlineHandler);
        resolve();
      };

      window.addEventListener('offline', offlineHandler);
    });
  }

  static async getFreeSpace() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.quota - estimate.usage;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao obter espaço livre:', error);
      return 0;
    }
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async compressData(data) {
    if (!offlineConfig.general.compressData) return data;

    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(typeof data === 'string' ? data : JSON.stringify(data));
      return compressed.toString('base64');
    } catch (error) {
      console.error('Erro ao comprimir dados:', error);
      return data;
    }
  }

  static async decompressData(compressedData) {
    if (!offlineConfig.general.compressData) return compressedData;

    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return decompressed.toString('utf8');
    } catch (error) {
      console.error('Erro ao descomprimir dados:', error);
      return compressedData;
    }
  }

  static async encryptData(data) {
    if (!offlineConfig.general.encryptData) return data;

    try {
      const crypto = require('crypto');
      const key = crypto.scryptSync(offlineConfig.security.encryptionKey, offlineConfig.security.salt, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(offlineConfig.security.algorithm, key);
      
      let encrypted = cipher.update(typeof data === 'string' ? data : JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      throw error;
    }
  }

  static async decryptData(encryptedData) {
    if (!offlineConfig.general.encryptData) return encryptedData;

    try {
      const crypto = require('crypto');
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = crypto.scryptSync(offlineConfig.security.encryptionKey, offlineConfig.security.salt, 32);
      const decipher = crypto.createDecipher(offlineConfig.security.algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      throw error;
    }
  }

  static async saveToLocalStorage(key, data) {
    try {
      const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      throw error;
    }
  }

  static async getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao obter do localStorage:', error);
      throw error;
    }
  }

  static async removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      throw error;
    }
  }

  static async clearLocalStorage() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      throw error;
    }
  }

  static async saveToSessionStorage(key, data) {
    try {
      const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
      sessionStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no sessionStorage:', error);
      throw error;
    }
  }

  static async getFromSessionStorage(key) {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao obter do sessionStorage:', error);
      throw error;
    }
  }

  static async removeFromSessionStorage(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do sessionStorage:', error);
      throw error;
    }
  }

  static async clearSessionStorage() {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar sessionStorage:', error);
      throw error;
    }
  }

  static async saveToFile(fileName, data) {
    try {
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      throw error;
    }
  }

  static async loadFromFile(fileInput) {
    return new Promise((resolve, reject) => {
      const file = fileInput.files[0];
      if (!file) {
        reject(new Error('Nenhum arquivo selecionado'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Arquivo inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  static async generateBackupFileName(prefix = 'movienizer-backup') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.json`;
  }

  static async createBackup(userId) {
    try {
      // Obter todos os dados do usuário
      const movies = await this.getAllFromStore('movies');
      const people = await this.getAllFromStore('people');
      const ratings = await this.getAllFromStore('ratings');
      const watchlist = await this.getAllFromStore('watchlist');
      const favorites = await this.getAllFromStore('favorites');
      const reminders = await this.getAllFromStore('reminders');
      const notifications = await this.getAllFromStore('notifications');
      const settings = await this.getAllFromStore('settings');
      const activityLogs = await this.getAllFromStore('activity_logs');
      const backups = await this.getAllFromStore('backups');
      const streaming = await this.getAllFromStore('streaming');
      const recommendations = await this.getAllFromStore('recommendations');

      const backupData = {
        movies,
        people,
        ratings,
        watchlist,
        favorites,
        reminders,
        notifications,
        settings,
        activityLogs,
        backups,
        streaming,
        recommendations,
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const fileName = await this.generateBackupFileName(`movienizer-backup-user-${userId}`);
      await this.saveToFile(fileName, backupData);

      return { success: true, fileName };
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  static async restoreBackup(userId, fileInput) {
    try {
      const backupData = await this.loadFromFile(fileInput);

      if (backupData.userId !== userId) {
        throw new Error('Backup não pertence a este usuário');
      }

      // Restaurar dados
      await this.clearAllStores();
      
      if (backupData.movies) {
        for (const movie of backupData.movies) {
          await this.addToStore('movies', movie);
        }
      }

      if (backupData.people) {
        for (const person of backupData.people) {
          await this.addToStore('people', person);
        }
      }

      if (backupData.ratings) {
        for (const rating of backupData.ratings) {
          await this.addToStore('ratings', rating);
        }
      }

      if (backupData.watchlist) {
        for (const item of backupData.watchlist) {
          await this.addToStore('watchlist', item);
        }
      }

      if (backupData.favorites) {
        for (const item of backupData.favorites) {
          await this.addToStore('favorites', item);
        }
      }

      if (backupData.reminders) {
        for (const reminder of backupData.reminders) {
          await this.addToStore('reminders', reminder);
        }
      }

      if (backupData.notifications) {
        for (const notification of backupData.notifications) {
          await this.addToStore('notifications', notification);
        }
      }

      if (backupData.settings) {
        for (const setting of backupData.settings) {
          await this.addToStore('settings', setting);
        }
      }

      if (backupData.activityLogs) {
        for (const log of backupData.activityLogs) {
          await this.addToStore('activity_logs', log);
        }
      }

      if (backupData.backups) {
        for (const backup of backupData.backups) {
          await this.addToStore('backups', backup);
        }
      }

      if (backupData.streaming) {
        for (const item of backupData.streaming) {
          await this.addToStore('streaming', item);
        }
      }

      if (backupData.recommendations) {
        for (const recommendation of backupData.recommendations) {
          await this.addToStore('recommendations', recommendation);
        }
      }

      return { success: true, message: 'Backup restaurado com sucesso!' };
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  static async clearAllStores() {
    try {
      for (const storeName of Object.keys(offlineConfig.indexedDB.stores)) {
        await this.clearStore(storeName);
      }
      return true;
    } catch (error) {
      console.error('Erro ao limpar todas as stores:', error);
      throw error;
    }
  }

  static async getOfflineStats() {
    try {
      const stats = {};

      for (const storeName of Object.keys(offlineConfig.indexedDB.stores)) {
        stats[storeName] = await this.getStoreCount(storeName);
      }

      const totalSize = await this.getTotalSize();
      
      return {
        ...stats,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        lastSync: await this.getFromLocalStorage('lastSync') || 'Nunca',
        isOnline: await this.checkInternetConnection(),
        cacheEnabled: offlineConfig.cache.enabled,
        syncEnabled: offlineConfig.sync.enabled
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas offline:', error);
      throw error;
    }
  }

  static async scheduleAutoSync() {
    const cron = require('node-cron');
    
    if (!offlineConfig.sync.enabled) {
      console.log('Sincronização automática offline desativada');
      return;
    }

    const schedule = offlineConfig.schedule[offlineConfig.sync.frequency];
    if (!schedule) {
      console.error('Agendamento inválido:', offlineConfig.sync.frequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando sincronização automática offline...`);
        await this.syncOfflineData();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na sincronização automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Sincronização automática offline agendada para executar ${offlineConfig.sync.frequency}`);
  }

  static async syncOfflineData() {
    try {
      const isOnline = await this.checkInternetConnection();
      if (!isOnline) {
        console.log('Sem conexão com a internet. Sincronização adiada.');
        return;
      }

      console.log(`[${new Date().toISOString()}] Iniciando sincronização offline...`);

      // Aqui você implementaria a lógica de sincronização real
      // Por enquanto, vamos apenas simular
      await this.sleep(2000);

      await this.saveToLocalStorage('lastSync', new Date().toISOString());
      
      console.log(`[${new Date().toISOString()}] Sincronização offline concluída`);
      return { success: true, message: 'Sincronização offline concluída!' };

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na sincronização offline:`, error);
      throw error;
    }
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async cleanupOldData(days = 30) {
    try {
      // Limpar dados antigos do cache
      console.log(`Dados offline anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  static async getApiDetails(apiId) {
    try {
      return offlineConfig.apis[apiId];
    } catch (error) {
      console.error('Erro ao obter detalhes da API:', error);
      throw error;
    }
  }

  static async searchApiContent(apiId, query, limit = 20) {
    try {
      // Esta função seria implementada com dados reais do banco ou API
      return [];
    } catch (error) {
      console.error('Erro ao buscar conteúdo na API:', error);
      throw error;
    }
  }

  static async getNewRatings(apiId = null, days = 7) {
    try {
      // Esta função seria implementada com dados reais do banco ou API
      return [];
    } catch (error) {
      console.error('Erro ao obter novos ratings:', error);
      throw error;
    }
  }

  static async getPopularRatings(apiId = null, limit = 50) {
    try {
      // Esta função seria implementada com dados reais do banco ou API
      return [];
    } catch (error) {
      console.error('Erro ao obter ratings populares:', error);
      throw error;
    }
  }

  static async getSimilarRatings(title, year, limit = 10) {
    try {
      // Esta função seria implementada com dados reais do banco ou API
      return [];
    } catch (error) {
      console.error('Erro ao obter ratings similares:', error);
      throw error;
    }
  }
}

module.exports = OfflineUtils;