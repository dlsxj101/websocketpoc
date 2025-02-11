import { app, BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: true, // 네이티브 타이틀바 제거 (커스텀 타이틀바 사용)
    alwaysOnTop: true, // 창이 다른 창 위에 항상 위치
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Next.js 앱 또는 원하는 URL 로드
  mainWindow.loadURL('https://i12e203.p.ssafy.io');
  // mainWindow.loadURL('http://localhost:3000');

  // 필요 시 디버그 창 열기
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // (옵션) 트레이 아이콘 설정
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: '앱 열기',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: '종료',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(trayMenu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
