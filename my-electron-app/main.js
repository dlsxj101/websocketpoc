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
} = require("electron");
const path = require("path");

// 추가: 업데이트 관련 모듈 로드
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// 로깅 설정
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// 단일 인스턴스 락 설정
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow;
let overlayWindow = null;
let tray = null;
let isQuiting = false; // 실제 종료할 때만 true로 전환
let updateWindow = null; // 업데이트 진행 모달 창

// preload 파일 경로 확인용 로그
const mainPreloadPath = path.join(__dirname, "preload.js");
const overlayPreloadPath = path.join(__dirname, "overlay-preload.js");
console.log("[main.js] Main preload path:", mainPreloadPath);
console.log("[main.js] Overlay preload path:", overlayPreloadPath);

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
app.on("second-instance", (event, commandLine, workingDirectory) => {
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

  // 웹 프로젝트를 래핑하므로 URL 로드 (index.html 대신 원격 URL 사용)
  mainWindow.loadURL("https://i12e203.p.ssafy.io");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 창 닫기(X 버튼) 시 fade-out 효과 후 트레이로 숨김
  mainWindow.on("close", (event) => {
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
  mainWindow.on("show", () => {
    if (!overlayWindow) {
      mainWindow.setAlwaysOnTop(true);
    }
  });
  mainWindow.on("restore", () => {
    if (!overlayWindow) {
      mainWindow.setAlwaysOnTop(true);
    }
  });
  mainWindow.on("focus", () => {
    if (!overlayWindow) {
      mainWindow.setAlwaysOnTop(true);
    }
  });
}

function createTray() {
  // trayIcon.png 파일은 프로젝트 내 아이콘 파일 경로로 대체하세요.
  tray = new Tray(path.join(__dirname, "./public/trayIcon.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "AQoO 종료",
      click: () => {
        // 확인 메시지 박스 표시
        dialog
          .showMessageBox({
            type: "question",
            buttons: ["네", "아니오"],
            defaultId: 1,
            cancelId: 1,
            message: "AQoO를 종료하시겠습니까?",
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

  tray.setToolTip("AQoO");
  tray.setContextMenu(contextMenu);

  // 더블클릭 시 창을 fade-in 효과와 함께 보이게 함
  tray.on("double-click", () => {
    if (mainWindow) {
      fadeInWindow(mainWindow);
      mainWindow.focus();
    }
  });
}

// 업데이트 모달 창 생성 함수
function createUpdateModal() {
  if (updateWindow) return; // 이미 존재하면 재생성하지 않음

  updateWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    show: false,
    frame: false,
    width: 400,
    height: 200,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true, // 간단한 IPC 및 DOM 조작을 위해 사용 (보안에 주의)
      contextIsolation: false,
    },
  });

  // data URL을 사용하여 업데이트 모달 HTML 정의
  updateWindow.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`
    <html>
      <head>
        <meta charset="UTF-8">
        <title>업데이트 진행중</title>
        <style>
          body {
            font-family: sans-serif;
            text-align: center;
            padding: 20px;
          }
          #progress {
            width: 100%;
          }
        </style>
      </head>
      <body>
        <h2>업데이트 진행 중...</h2>
        <p id="message">업데이트를 확인 중입니다.</p>
        <progress id="progress" value="0" max="100"></progress>
        <script>
          const { ipcRenderer } = require('electron');
          ipcRenderer.on('update-modal-message', (event, data) => {
            document.getElementById('message').innerText = data.message;
            if (data.progress !== undefined) {
              document.getElementById('progress').value = data.progress;
            }
          });
        </script>
      </body>
    </html>
  `)
  );

  updateWindow.once("ready-to-show", () => {
    updateWindow.show();
  });

  // 모달 창이 닫히면 updateWindow 변수 초기화
  updateWindow.on("closed", () => {
    updateWindow = null;
  });
}

app
  .whenReady()
  .then(() => {
    session.defaultSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        console.log(
          "Permission requested:",
          permission,
          "from URL:",
          webContents.getURL()
        );
        callback(permission === "media");
      }
    );
    createMainWindow();
    createTray();

    // 앱이 준비되면 업데이트 확인 및 알림 시작
    autoUpdater.checkForUpdatesAndNotify();
  })
  .catch((err) => console.error(err));

app.on("window-all-closed", () => {
  // 모든 창을 닫아도 트레이가 있으면 앱은 종료되지 않음
  if (process.platform !== "darwin" && !tray) app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

// 창 제어 IPC
ipcMain.on("minimize-window", () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on("close-window", () => {
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
ipcMain.on("toggle-overlay", (event, fishPath, displayId) => {
  console.log("[toggle-overlay] Called with fishPath:", fishPath);
  console.log("[toggle-overlay] 선택된 displayId:", displayId);

  const displays = screen.getAllDisplays();
  // 선택한 displayId와 일치하는 디스플레이를 찾고, 없으면 기본(primary) 디스플레이 사용
  const targetDisplay =
    displays.find((display) => display.id === displayId) ||
    screen.getPrimaryDisplay();
  const { x, y, width, height } = targetDisplay.bounds;

  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
    if (mainWindow) mainWindow.setAlwaysOnTop(true);
  } else {
    if (!fishPath) {
      console.warn(
        "[toggle-overlay] No fishPath provided. Aborting overlay creation."
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
    // 전체 화면 모드로 전환
    overlayWindow.setFullScreen(true);

    overlayWindow.loadFile(path.join(__dirname, "overlay.html"));

    overlayWindow.webContents.on("did-finish-load", () => {
      // 오버레이 창을 'screen-saver' 우선순위로 고정
      overlayWindow.setAlwaysOnTop(true, "screen-saver", 0);
      overlayWindow.webContents.send("fish-data", fishPath);
      if (mainWindow) mainWindow.focus();
    });

    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    overlayWindow.on("closed", () => {
      overlayWindow = null;
      if (mainWindow) mainWindow.setAlwaysOnTop(true);
    });
  }
});

// 새 브라우저 창 생성 시에도 오버레이 우선순위 재적용 (필요에 따라)
app.on("browser-window-created", (event, newWindow) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setAlwaysOnTop(true, "screen-saver", 0);
  }
});

ipcMain.handle("show-alert", async (event, message) => {
  await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "AQoO",
    message: message,
    buttons: ["확인"],
    defaultId: 0,
  });
});

// ======================
// 업데이트 이벤트 핸들러 (IPC 메시지 전송 포함)
// ======================
autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info);
  createUpdateModal();
  if (updateWindow) {
    updateWindow.webContents.send("update-modal-message", {
      message: "새로운 업데이트가 감지되었습니다. 다운로드를 시작합니다.",
    });
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  log.info("Download progress:", progressObj);
  createUpdateModal();
  if (updateWindow) {
    updateWindow.webContents.send("update-modal-message", {
      message: `업데이트 다운로드 중... ${Math.round(progressObj.percent)}%`,
      progress: Math.round(progressObj.percent),
    });
  }
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded:", info);
  if (updateWindow) {
    updateWindow.webContents.send("update-modal-message", {
      message: "업데이트 다운로드가 완료되었습니다. 앱을 재시작합니다.",
    });
  }
  // 잠시 후 자동 재시작 (예: 3초 후)
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 3000);
});

autoUpdater.on("error", (err) => {
  log.error("Error in auto-updater:", err);
  createUpdateModal();
  if (updateWindow) {
    updateWindow.webContents.send("update-modal-message", {
      message: `업데이트 중 오류 발생: ${err.message}`,
    });
  }
});
