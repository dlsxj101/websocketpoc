const { contextBridge, ipcRenderer } = require('electron');

// 로드 확인용 로그 추가
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
  toggleOverlay: (fishData) => {
    console.log('[preload] toggleOverlay called with fishData:', fishData);
    ipcRenderer.send('toggle-overlay', fishData);
  },
  showAlert: (message) => {
    console.log('[preload] showAlert called with message:', message);
    return ipcRenderer.invoke('show-alert', message);
  },
});
