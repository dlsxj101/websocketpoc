// main.js
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  session,
  Tray,
  Menu,
  dialog,
} = require('electron');
const path = require('path');

// 단일 인스턴스 락 설정
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow;
let overlayWindow = null;
let tray = null;
let isQuiting = false; // 실제 종료할 때만 true로 전환

// preload 파일 경로 확인용 로그
const mainPreloadPath = path.join(__dirname, 'preload.js');
const overlayPreloadPath = path.join(__dirname, 'overlay-preload.js');
console.log('[main.js] Main preload path:', mainPreloadPath);
console.log('[main.js] Overlay preload path:', overlayPreloadPath);

// fade-in 효과 함수 (투명도 조절)
function fadeInWindow(win, duration = 300) {
  const steps = 20;
  const intervalTime = duration / steps;
  let opacity = 0;
  win.setOpacity(0);
  win.show();

  const fadeInterval = setInterval(() => {
    opacity += 1 / steps;
    if (opacity >= 1) {
      win.setOpacity(1);
      clearInterval(fadeInterval);
    } else {
      win.setOpacity(opacity);
    }
  }, intervalTime);
}

// fade-out 효과 함수 (투명도 조절)
function fadeOutWindow(win, duration = 300, callback) {
  const steps = 20;
  const intervalTime = duration / steps;
  let opacity = win.getOpacity(); // 보통 1일 것임
  const fadeInterval = setInterval(() => {
    opacity -= 1 / steps;
    if (opacity <= 0) {
      win.setOpacity(0);
      clearInterval(fadeInterval);
      if (callback) callback();
    } else {
      win.setOpacity(opacity);
    }
  }, intervalTime);
}

// 두 번째 인스턴스 실행 시 기존 창을 fade-in 효과와 함께 포커스하도록 처리
app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    fadeInWindow(mainWindow);
    mainWindow.focus();
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: true,
    // 기본적으로는 항상 위로 두지만, 오버레이가 열리면 해제할 예정
    alwaysOnTop: true,
    webPreferences: {
      preload: mainPreloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      devTools: true, // DevTools 활성화
    },
  });

  mainWindow.loadURL('https://i12e203.p.ssafy.io');
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 창 닫기(X 버튼) 시 fade-out 효과 후 트레이로 숨김
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      fadeOutWindow(mainWindow, 300, () => {
        mainWindow.hide();
        // fade-out 후, 다시 사용할 수 있도록 투명도를 복원
        mainWindow.setOpacity(1);
      });
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
            if (result.response === 0) {
              // '네' 버튼 선택
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

  tray.setToolTip('AQoO');
  tray.setContextMenu(contextMenu);

  // 더블클릭 시 창을 fade-in 효과와 함께 보이게 함
  tray.on('double-click', () => {
    if (mainWindow) {
      fadeInWindow(mainWindow);
      mainWindow.focus();
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

ipcMain.handle("get-displays", () => {
  // 디스플레이 정보 가져오기
  const displays = screen.getAllDisplays();
  console.log("Detected displays:", displays);
  return displays.map((display) => ({
    id: display.id,
    bounds: display.bounds,
  }));
});

// 오버레이 창 토글 및 fishPath 전달
ipcMain.on('toggle-overlay', (event, fishPath, displayId) => {
  console.log('[toggle-overlay] Called with fishPath:', fishPath);
  console.log('[toggle-overlay] 선택된 displayId:', displayId);

  const displays = screen.getAllDisplays();
  // 선택한 displayId와 일치하는 디스플레이를 찾고, 없으면 기본(primary) 디스플레이 사용
  const targetDisplay = displays.find(display => display.id === displayId) || screen.getPrimaryDisplay();
  const { x, y, width, height } = targetDisplay.bounds;

  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
    if (mainWindow) mainWindow.setAlwaysOnTop(true);
  } else {
    if (!fishPath) {
      console.warn(
        '[toggle-overlay] No fishPath provided. Aborting overlay creation.'
      );
      return;
    }

    if (mainWindow) mainWindow.setAlwaysOnTop(false);

    overlayWindow = new BrowserWindow({
      x, // target display의 x 좌표
      y, // target display의 y 좌표
      width, // target display의 너비
      height, // target display의 높이
      frame: false,
      transparent: true,
      alwaysOnTop: true, // 오버레이는 계속 위에 표시
      skipTaskbar: true,
      focusable: false, // 포커스 불가
      webPreferences: {
        preload: overlayPreloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        devTools: true, // DevTools 활성화
      },
    });

    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    overlayWindow.webContents.on('did-finish-load', () => {
      // 오버레이 창을 'screen-saver' 우선순위로 고정 (필요에 따라 다른 레벨 사용 가능)
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 0);
      overlayWindow.webContents.send('fish-data', fishPath);
      if (mainWindow) mainWindow.focus();
    });

    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    overlayWindow.on('closed', () => {
      overlayWindow = null;
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

ipcMain.handle('show-alert', async (event, message) => {
  await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: 'AQoO',
    message: message,
    buttons: ['확인'],
    defaultId: 0,
  });
});
