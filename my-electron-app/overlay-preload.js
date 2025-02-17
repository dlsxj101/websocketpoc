const { contextBridge, ipcRenderer } = require('electron');

console.log('overlay-preload.js 실행');

contextBridge.exposeInMainWorld('overlayAPI', {
  onFishData: (callback) => {
    ipcRenderer.on('fish-data', (_event, fishData) => {
      console.log('[overlay-preload] Received fish-data:', fishData);
      callback(fishData);
    });
  },
});
