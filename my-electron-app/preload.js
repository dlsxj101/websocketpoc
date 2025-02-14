const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  openOverlay: (fishPath) => {
    console.log('[preload] openOverlay called with fishPath:', fishPath);
    ipcRenderer.send('open-overlay', fishPath);
  },
});
