// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false, // OS 기본 타이틀바 제거
    alwaysOnTop: true, // 항상 최상단 위치
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // IPC용 preload 스크립트
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 로컬 래퍼 페이지인 index.html 로드
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 개발 중 디버깅 창 열기 (개발 시에만 사용)
  //   mainWindow.webContents.openDevTools();

  // 창이 닫힐 때 처리
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 초기화 후 창 생성
app.whenReady().then(createWindow);

// 모든 창이 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS에서 앱 아이콘 클릭 시 창 재생성
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 이벤트 처리: 창 제어 기능
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});
