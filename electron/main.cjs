const { app, BrowserWindow, ipcMain, screen, dialog, shell } = require('electron'); // Core Electron modules for app lifecycle, window creation, and IPC
const path = require('path');                                  // Node path module for resolving file paths cross-platform
const fs = require('fs');                                      // Node fs module for writing temp print files
const os = require('os');                                      // Node os module for temp directory path
const log = require('electron-log');                           // Persistent file logger — writes to AppData/Roaming/StockFlow/logs/main.log
const { autoUpdater } = require('electron-updater');           // Auto-update — checks GitHub Releases for new versions
const { initDatabase } = require('./database/init.cjs');       // Our custom function to initialize SQLite and create tables
const { registerAllHandlers } = require('./database/ipc-handlers.cjs'); // Registers all IPC handlers for CRUD operations

// ── Logging setup ──────────────────────────────────────────────────────
// Route all console output through electron-log so errors are visible in
// production builds (packaged .exe) where DevTools is not open.
// Log file location: %AppData%\Roaming\StockFlow\logs\main.log
log.transports.file.level = 'info';
console.log  = log.info.bind(log);
console.error = log.error.bind(log);
console.warn  = log.warn.bind(log);
log.info('[StockFlow] ── App process starting ──');

// ── IPC log channels — lets the renderer (React) write to the same file ─
ipcMain.on('log:error', (_e, msg, ...args) => log.error('[renderer]', msg, ...args));
ipcMain.on('log:warn',  (_e, msg, ...args) => log.warn('[renderer]',  msg, ...args));
ipcMain.on('log:info',  (_e, msg, ...args) => log.info('[renderer]',  msg, ...args));

// ── Hardware ID generation ───────────────────────────────────────────
// Produces a deterministic ID from MAC address + CPU model, hashed with
// SHA-256 and formatted as XXXX-XXXX-XXXX-XXXX (16 hex chars, uppercase).
// The same PC will always produce the same ID.
const crypto = require('crypto');

function generateHardwareId() {
  // 1. Get a stable (non-internal) MAC address
  const nets = os.networkInterfaces();
  let mac = '';
  for (const name of Object.keys(nets).sort()) {        // Sort for determinism
    for (const iface of nets[name]) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        mac = iface.mac;
        break;
      }
    }
    if (mac) break;
  }

  // 2. Get CPU model string
  const cpuModel = os.cpus()[0]?.model || 'unknown-cpu';

  // 3. Combine and hash
  const raw = `${mac}|${cpuModel}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  // 4. Take first 16 chars → format as XXXX-XXXX-XXXX-XXXX
  const id = hash.substring(0, 16).toUpperCase();
  return `${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}`;
}

ipcMain.handle('app:getHardwareId', () => {
  const hwid = generateHardwareId();
  log.info('[StockFlow] Hardware ID generated:', hwid);
  return hwid;
});

// ── Activation code verification ─────────────────────────────────────
// Uses HMAC-SHA256 with a shared secret to verify that the activation
// code matches the hardware ID.  On success the activation is persisted
// to a JSON file in AppData so it survives localStorage clears.
const HMAC_SECRET = 'b3f2a1e4d7c6b9a08f5e2d1c4b7a0e3f6d9c2b5a8e1f4d7c0b3a6e9f2d5c8b1';

function verifyActivationCode(hardwareId, code) {
  const hex = crypto.createHmac('sha256', HMAC_SECRET)
    .update(hardwareId.trim().toUpperCase())
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
  const expected = `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}`;
  return expected === code.trim().toUpperCase();
}

function getActivationFilePath() {
  return path.join(app.getPath('userData'), 'activation.json');
}

// Called when user clicks "Activer" — verifies code, writes file on success
ipcMain.handle('app:verifyActivation', (_event, hardwareId, code) => {
  const valid = verifyActivationCode(hardwareId, code);
  if (valid) {
    const filePath = getActivationFilePath();
    const data = JSON.stringify({
      hardwareId: hardwareId.trim().toUpperCase(),
      activatedAt: new Date().toISOString(),
    });
    fs.writeFileSync(filePath, data, 'utf-8');
    log.info('[StockFlow] Activation successful for HWID:', hardwareId);
    return { success: true };
  }
  log.warn('[StockFlow] Activation failed — invalid code for HWID:', hardwareId);
  return { success: false };
});

// Called on every app launch — checks if activation file exists and HWID matches
ipcMain.handle('app:checkActivation', () => {
  try {
    const filePath = getActivationFilePath();
    if (!fs.existsSync(filePath)) return { activated: false };

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const currentHwid = generateHardwareId();

    if (data.hardwareId === currentHwid) {
      return { activated: true };
    }
    // HWID mismatch — activation file belongs to a different machine
    log.warn('[StockFlow] Activation HWID mismatch. File:', data.hardwareId, 'Current:', currentHwid);
    return { activated: false };
  } catch (err) {
    log.error('[StockFlow] Error checking activation file:', err);
    return { activated: false };
  }
});

// Called by the "Reset" button in Settings — deletes the activation file
ipcMain.handle('app:resetActivation', () => {
  try {
    const filePath = getActivationFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log.info('[StockFlow] Activation file deleted — app will require re-activation');
    }
    return { success: true };
  } catch (err) {
    log.error('[StockFlow] Failed to delete activation file:', err);
    return { success: false };
  }
});

// ── Open logs folder in File Explorer ────────────────────────────────
// Registered at module level but only *called* after app is ready (user click),
// so app.getPath('userData') is safe here.
ipcMain.handle('app:openLogsFolder', () => {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logsDir, { recursive: true }); // Ensure folder exists before opening
  shell.openPath(logsDir); // Opens the logs folder in File Explorer
});

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

// ── List available printers ──────────────────────────────────────────
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map((p) => ({
    name: p.name,
    displayName: p.displayName || p.name,
    isDefault: p.isDefault,
  }));
});

// ── Silent print to a specific named printer ─────────────────────────
ipcMain.handle('print-html-silent', async (_event, htmlContent, printerName) => {
  const tmpFile = path.join(os.tmpdir(), `stockflow-print-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, htmlContent, 'utf-8');

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  await printWin.loadFile(tmpFile);

  return new Promise((resolve) => {
    printWin.webContents.print(
      { silent: true, printBackground: true, deviceName: printerName },
      (success) => {
        printWin.close();
        try { fs.unlinkSync(tmpFile); } catch {}
        resolve(success);
      }
    );
  });
});

app.whenReady().then(() => {
  // Initialize SQLite database — creates the .db file and all tables on first launch
  const db = initDatabase();

  // Register all IPC handlers so the renderer can perform CRUD operations via preload bridge
  registerAllHandlers(ipcMain, db);

  // Create the main application window
  createWindow();

  // ── Auto-update ────────────────────────────────────────────────────────
  // Only runs in production (packaged .exe) — skipped entirely during dev.
  // All errors are caught so a broken update server or no internet connection
  // never prevents the app from opening normally.
  if (!isDev) {
    try {
      // When an update has been fully downloaded, prompt the user in French
      autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Mise à jour disponible',
          message: 'Une mise à jour est disponible. L\'application va redémarrer pour installer la mise à jour.',
          buttons: ['OK'],
          defaultId: 0,
        }).then(() => {
          autoUpdater.quitAndInstall(); // Quit and apply the downloaded update
        });
      });

      // Silently check for updates — if none found or no internet, nothing happens
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        // Network errors / no release found — log quietly, do not surface to user
        log.warn('[AutoUpdate] Check skipped (no internet or no release found):', err.message);
      });
    } catch (err) {
      log.error('[AutoUpdate] Unexpected error during update setup:', err);
    }
  }

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
