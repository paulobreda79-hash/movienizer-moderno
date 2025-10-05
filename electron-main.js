const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const serverApp = express();

// Iniciar servidor Express
const PORT = 3001;
serverApp.use(express.static(path.join(__dirname, 'public')));
serverApp.use('/api', require('./routes/movies'));
serverApp.use('/api', require('./routes/people'));
serverApp.use('/api', require('./routes/download'));

const server = serverApp.listen(PORT, () => {
  console.log(`Servidor interno rodando na porta ${PORT}`);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('public/index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server.close();
    app.quit();
  }
});