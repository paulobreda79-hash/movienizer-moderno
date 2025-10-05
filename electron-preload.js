// electron-preload.js
import { contextBridge, ipcRenderer } from 'electron';

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: async () => {
        return await ipcRenderer.invoke('get-app-version');
    },
    showOpenDialog: async (options) => {
        return await ipcRenderer.invoke('show-open-dialog', options);
    },
    showSaveDialog: async (options) => {
        return await ipcRenderer.invoke('show-save-dialog', options);
    },
    showMessageBox: async (options) => {
        return await ipcRenderer.invoke('show-message-box', options);
    },
    showItemInFolder: async (filePath) => {
        return await ipcRenderer.invoke('show-item-in-folder', filePath);
    },

    // Exemplo de dynamic import se precisares de módulos ES dentro do preload
    loadModule: async (modulePath) => {
        try {
            const mod = await import(modulePath);
            return mod;
        } catch (err) {
            console.error(`Erro ao importar módulo ${modulePath}:`, err);
            return null;
        }
    }
});

