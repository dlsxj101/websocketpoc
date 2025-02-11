"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
let tray;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    // mainWindow.loadURL('https://i12e203.p.ssafy.io');
    mainWindow.loadURL('http://localhost:3000');
    // 필요 시 디버그 창 열기
    mainWindow.webContents.openDevTools();
}
electron_1.app.whenReady().then(() => {
    createWindow();
    // (옵션) 트레이 아이콘 설정
    tray = new electron_1.Tray(path_1.default.join(__dirname, 'icon.png'));
    const trayMenu = electron_1.Menu.buildFromTemplate([
        {
            label: '앱 열기',
            click: () => {
                mainWindow?.show();
            },
        },
        {
            label: '종료',
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setContextMenu(trayMenu);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
