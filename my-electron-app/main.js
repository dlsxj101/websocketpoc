// main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false, // OS 기본 타이틀바 제거 (커스텀 타이틀바 사용)
    alwaysOnTop: true, // 창이 항상 최상단에 위치
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // IPC용 preload 스크립트
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // <webview> 태그 사용 허용
    },
  });

  // 로컬 래퍼 페이지인 index.html 로드
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 개발 중 디버깅 창 열기 (필요 시)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app
  .whenReady()
  .then(() => {
    // (옵션) 권한 요청 핸들러: 미디어 권한 자동 허용(테스트용)
    session.defaultSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        console.log(
          'Permission requested:',
          permission,
          'from URL:',
          webContents.getURL()
        );
        if (permission === 'media') {
          callback(true);
        } else {
          callback(false);
        }
      }
    );

    createMainWindow();
  })
  .catch((err) => console.error(err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
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
