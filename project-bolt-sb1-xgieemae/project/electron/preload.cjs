const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openLocalFile: (relativePath) => ipcRenderer.invoke('open-local-file', relativePath),
  openDirectory: (directoryPath) => ipcRenderer.invoke('open-directory', directoryPath),
  platform: process.platform,
  isElectron: true,
});

