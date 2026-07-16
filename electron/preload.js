const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  isElectron: true
});

// Detect if running in Electron
window.isElectron = true;