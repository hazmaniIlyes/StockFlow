const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron'); // Core Electron modules for app lifecycle, window creation, and IPC
const path = require('path');                                  // Node path module for resolving file paths cross-platform
const fs = require('fs');                                      // Node fs module for writing temp print files
const os = require('os');                                      // Node os module for temp directory path
const { initDatabase } = require('./database/init.cjs');       // Our custom function to initialize SQLite and create tables
const { registerAllHandlers } = require('./database/ipc-handlers.cjs'); // Registers all IPC handlers for CRUD operations

// ======================================================================

// Determine if we are in development mode by checking the NODE_ENV environment variable
// app.isPackaged cannot be read at module load time (Electron hasn't initialized yet at that point),
// so we use NODE_ENV which is reliably set to 'production' by electron-builder and undefined/development during dev
const isDev = process.env.NODE_ENV !== 'production'; // true during dev, false in the packaged .exe

let mainWindow = null; // Reference to the main BrowserWindow instance

function createWindow() {
  // Create the browser window with security settings for desktop app
  mainWindow = new BrowserWindow({
    width: 1400,                          // Default window width in pixels
    height: 900,                          // Default window height in pixels
    minWidth: 1024,                       // Minimum width to prevent UI breakage
    minHeight: 700,                       // Minimum height to prevent UI breakage
    show: false,                          // Hide until ready-to-show to avoid blank window flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // Path to preload script that exposes IPC to renderer
      contextIsolation: true,             // Security: isolate renderer context from Node.js
      nodeIntegration: false,             // Security: don't expose Node.js APIs directly to renderer
    },
  });

  // Show the window maximized once the renderer has finished its first paint
  // Also apply a zoom factor based on the screen height so all content fits without clipping
  mainWindow.once('ready-to-show', () => {
    const { height } = screen.getPrimaryDisplay().workAreaSize; // Get usable screen height (excludes taskbar)
    const zoom = Math.min(1.0, height / 900); // 900px is the design baseline; clamp to 1.0 so we never zoom in
    mainWindow.webContents.setZoomFactor(zoom);
    mainWindow.maximize();
    mainWindow.show();
  });

  if (isDev) {
    // In development, load from Vite dev server URL
    mainWindow.loadURL('http://localhost:3039'); // Port matches vite.config.ts server.port
    //mainWindow.webContents.openDevTools();       // Open DevTools automatically in dev mode
  } else {
    // In production, load the built index.html from the dist folder
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Clean up reference when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null; // Allow garbage collection of the window object
  });
}

// ======================================================================
// App lifecycle events
// ======================================================================

// ── Save-as-PDF handler — renders HTML silently and saves to a user-chosen file ──
ipcMain.handle('save-pdf', async (_event, htmlContent, suggestedName) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Save as PDF',
    defaultPath: (suggestedName || 'export') + '.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return { success: false, canceled: true };

  const tmpFile = path.join(os.tmpdir(), `stockflow-pdf-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, htmlContent, 'utf-8');

  const pdfWin = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  await pdfWin.loadFile(tmpFile);

  try {
    const pdfData = await pdfWin.webContents.printToPDF({ printBackground: true });
    fs.writeFileSync(filePath, pdfData);
    pdfWin.close();
    try { fs.unlinkSync(tmpFile); } catch {}
    return { success: true };
  } catch (err) {
    pdfWin.close();
    try { fs.unlinkSync(tmpFile); } catch {}
    return { success: false, error: String(err) };
  }
});

// ── Print handler — loads HTML in a hidden window and opens the system print dialog ──
ipcMain.handle('print-html', async (_event, htmlContent) => {
  const tmpFile = path.join(os.tmpdir(), `stockflow-print-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, htmlContent, 'utf-8');

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  await printWin.loadFile(tmpFile);

  return new Promise((resolve) => {
    printWin.webContents.print({ silent: false, printBackground: true }, (success) => {
      printWin.close();
      try { fs.unlinkSync(tmpFile); } catch {}
      resolve(success);
    });
  });
});

app.whenReady().then(() => {
  // Initialize SQLite database — creates the .db file and all tables on first launch
  const db = initDatabase();

  // Register all IPC handlers so the renderer can perform CRUD operations via preload bridge
  registerAllHandlers(ipcMain, db);

  // Create the main application window
  createWindow();

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(); // Standard macOS behavior — re-create the window
    }
  });
});

// Quit when all windows are closed (except on macOS where apps stay in dock)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit(); // On Windows/Linux, quit the app when all windows close
  }
});
