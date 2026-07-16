const { contextBridge, app } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  isElectron: true,
  appVersion: app.getVersion(),
  appName: app.getName()
});

// Detect if running in Electron
window.isElectron = true;