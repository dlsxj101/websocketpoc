const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  toggleOverlay: (fishPath) => {
    console.log('[preload] toggleOverlay called with fishPath:', fishPath);
    ipcRenderer.send('toggle-overlay', fishPath);
  },
  showAlert: (message) => ipcRenderer.invoke('show-alert', message)
});
