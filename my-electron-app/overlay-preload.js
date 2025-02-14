// overlay-preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  onFishData: (callback) => {
    ipcRenderer.on('fish-data', (_event, fishPath) => {
      console.log('[overlay-preload] Received fish-data:', fishPath);
      callback(fishPath);
    });
  },
});
