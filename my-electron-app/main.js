// main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: true,
    alwaysOnTop: true, // 초기 설정 (나중에 relativeLevel로 조정)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  // URL 로드
  mainWindow.loadURL('https://i12e203.p.ssafy.io');
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 창이 준비되면 메인 창은 relativeLevel 0으로 설정
  mainWindow.once('ready-to-show', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 0);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app
  .whenReady()
  .then(() => {
    session.defaultSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        console.log(
          'Permission requested:',
          permission,
          'from URL:',
          webContents.getURL()
        );
        callback(permission === 'media');
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

// 오버레이 창 토글 및 fishPath 전달
let overlayWindow = null;

ipcMain.on('toggle-overlay', (event, fishPath) => {
  console.log('[main.js] Received toggle-overlay, fishPath:', fishPath);
  if (overlayWindow) {
    // 이미 열려 있다면 닫습니다.
    overlayWindow.close();
    overlayWindow = null;
  } else {
    // 오버레이 창 생성 (전체 화면)
    overlayWindow = new BrowserWindow({
      fullscreen: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true, // 초기 설정 (나중에 relativeLevel로 조정)
      skipTaskbar: true,
      focusable: false, // 포커스를 받지 않도록
      webPreferences: {
        preload: path.join(__dirname, 'overlay-preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    overlayWindow.webContents.on('did-finish-load', () => {
      // 오버레이 창은 relativeLevel 1로 설정하여 메인 창보다 위에 표시
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      console.log('[main.js] Sending fish-data to overlay:', fishPath);
      overlayWindow.webContents.send('fish-data', fishPath);
    });

    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    overlayWindow.on('closed', () => {
      console.log('[main.js] Overlay window closed.');
      overlayWindow = null;
    });
  }
});

// 메인 창이 복원되거나 포커스를 받을 때마다 오버레이 창의 relativeLevel을 유지
if (mainWindow) {
  mainWindow.on('restore', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    }
  });
  mainWindow.on('focus', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    }
  });
}

// 모든 브라우저 창 생성 시에도 오버레이 창 우선순위 재설정
app.on('browser-window-created', (event, newWindow) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }
});
