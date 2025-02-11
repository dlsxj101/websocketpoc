"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/preload.ts
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => electron_1.ipcRenderer.send('minimize'),
    maximize: () => electron_1.ipcRenderer.send('maximize'),
    close: () => electron_1.ipcRenderer.send('close'),
});
