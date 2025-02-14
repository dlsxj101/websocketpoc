// main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  // index.html 로드 (여기서 웹뷰가 메인 페이지 역할)
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.loadURL("https://i12e203.p.ssafy.io");
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Permission requested:', permission, 'from URL:', webContents.getURL());
    callback(permission === 'media');
  });

  createMainWindow();
}).catch((err) => console.error(err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

// 창 제어 IPC
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// 오버레이 창 띄우기 및 fishPath 전달
ipcMain.on('open-overlay', (event, fishPath) => {
  console.log('[main.js] Received open-overlay, fishPath:', fishPath);

  const overlayWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'overlay-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[main.js] Sending fish-data to overlay:', fishPath);
    overlayWindow.webContents.send('fish-data', fishPath);
  });

  overlayWindow.on('closed', () => {
    console.log('[main.js] Overlay window closed.');
  });
});
