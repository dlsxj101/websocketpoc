// main.js
const { app, BrowserWindow, ipcMain, session, Tray, Menu, dialog } = require('electron');
const path = require('path');

let mainWindow;
let overlayWindow = null;
let tray = null;
let isQuiting = false; // 실제 종료할 때만 true로 전환

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: true,
    // 기본적으로는 항상 위로 두지만, 오버레이가 열리면 해제할 예정
    alwaysOnTop: true, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  mainWindow.loadURL('https://i12e203.p.ssafy.io');
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 창 닫기(X 버튼) 시 실제 종료하지 않고 트레이로 숨김
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 메인 창 이벤트에서 오버레이가 없을 때만 항상 위로 설정
  mainWindow.on('show', () => {
    if (!overlayWindow) {
      mainWindow.setAlwaysOnTop(true);
    }
  });
  mainWindow.on('restore', () => {
    if (!overlayWindow) {
      mainWindow.setAlwaysOnTop(true);
    }
  });
  mainWindow.on('focus', () => {
    if (!overlayWindow) {
      mainWindow.setAlwaysOnTop(true);
    }
  });
}

function createTray() {
  // trayIcon.png 파일은 프로젝트 내 아이콘 파일 경로로 대체하세요.
  tray = new Tray(path.join(__dirname, './public/trayIcon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'AQoO 종료',
      click: () => {
        // 확인 메시지 박스 표시
        dialog
          .showMessageBox({
            type: 'question',
            buttons: ['네', '아니오'],
            defaultId: 1,
            cancelId: 1,
            message: 'AQoO를 종료하시겠습니까?',
          })
          .then((result) => {
            if (result.response === 0) { // '네' 버튼 선택
              isQuiting = true;
              // 오버레이가 열려있으면 함께 종료
              if (overlayWindow) {
                overlayWindow.close();
              }
              tray.destroy();
              app.quit();
            }
          });
      },
    },
  ]);

  tray.setToolTip('My Electron App');
  tray.setContextMenu(contextMenu);

  // 더블클릭 시 창을 다시 보이게 할 수도 있음
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
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
    createTray();
  })
  .catch((err) => console.error(err));

app.on('window-all-closed', () => {
  // 모든 창을 닫아도 트레이가 있으면 앱은 종료되지 않음
  if (process.platform !== 'darwin' && !tray) app.quit();
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
ipcMain.on('toggle-overlay', (event, fishPath) => {
  if (overlayWindow) {
    // 오버레이 닫을 때 메인 창을 원래 alwaysOnTop 상태로 복원
    overlayWindow.close();
    overlayWindow = null;
    if (mainWindow) mainWindow.setAlwaysOnTop(true);
  } else {
    // 오버레이 창 열릴 때 메인 창의 alwaysOnTop 해제(활성화 시 일반 창처럼 동작)
    if (mainWindow) mainWindow.setAlwaysOnTop(false);

    overlayWindow = new BrowserWindow({
      fullscreen: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true, // 오버레이는 계속 위에 표시
      skipTaskbar: true,
      focusable: false, // 포커스 불가
      webPreferences: {
        preload: path.join(__dirname, 'overlay-preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    overlayWindow.webContents.on('did-finish-load', () => {
      // 오버레이 창을 'screen-saver' 우선순위로 고정 (필요에 따라 다른 레벨 사용 가능)
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 0);
      overlayWindow.webContents.send('fish-data', fishPath);
      // 오버레이 창이 열렸어도 메인 창이 활성화되도록 포커스 강제 지정
      if (mainWindow) mainWindow.focus();
    });

    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    overlayWindow.on('closed', () => {
      overlayWindow = null;
      // 오버레이 창 닫히면 메인 창 alwaysOnTop 복원
      if (mainWindow) mainWindow.setAlwaysOnTop(true);
    });
  }
});

// 새 브라우저 창 생성 시에도 오버레이 우선순위 재적용 (필요에 따라)
app.on('browser-window-created', (event, newWindow) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setAlwaysOnTop(true, 'screen-saver', 0);
  }
});
