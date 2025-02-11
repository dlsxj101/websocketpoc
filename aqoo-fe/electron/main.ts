import { app, BrowserWindow, Tray, Menu } from 'electron';
import path from 'path';

// CommonJS 모듈 방식에서는 __dirname과 __filename이 이미 전역 변수로 제공됩니다.
// 만약 TypeScript에서 에러가 발생한다면 아래처럼 선언해 줄 수 있습니다.
// declare const __dirname: string;
// declare const __filename: string;

let mainWindow: BrowserWindow | null = null;
let tray: Tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,  
      contextIsolation: true,
    }
  });

  mainWindow.loadURL('https://i12e203.p.ssafy.io');
}

app.whenReady().then(() => {
  createWindow();

  tray = new Tray(path.join(__dirname, 'icon.png'));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: '앱 열기',
      click: () => {
        if (mainWindow) mainWindow.show();
      }
    },
    {
      label: '종료',
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(trayMenu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
