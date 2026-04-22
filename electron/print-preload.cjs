// print-preload.cjs — Preload for the print preview window
// Exposes a single method so the preview page can trigger webContents.print() via IPC

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPrint', {
  print: () => ipcRenderer.send('do-print'),
  close: () => ipcRenderer.send('close-print-window'),
});
