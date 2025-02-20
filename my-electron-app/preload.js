// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('[preload] Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => {
    console.log('[preload] minimize called');
    ipcRenderer.send('minimize-window');
  },
  maximize: () => {
    console.log('[preload] maximize called');
    ipcRenderer.send('maximize-window');
  },
  close: () => {
    console.log('[preload] close called');
    ipcRenderer.send('close-window');
  },
  toggleOverlay: (fishData, monitorId) => {
    console.log('[preload] toggleOverlay called with fishData:', fishData, 'monitorId:', monitorId);
    ipcRenderer.send('toggle-overlay', fishData, monitorId);
  },
  showAlert: (message) => {
    console.log('[preload] showAlert called with message:', message);
    return ipcRenderer.invoke('show-alert', message);
  },

  // 모니터 정보 가져오기
  getDisplays: () => {
    console.log('[preload] getDisplays called');
    return ipcRenderer.invoke('get-displays');
  },
});
