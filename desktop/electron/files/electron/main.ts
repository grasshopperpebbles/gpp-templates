import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import log from 'electron-log';
import windowStateKeeper from 'electron-window-state';
import { autoUpdater } from 'electron-updater';
import contextMenu from 'electron-context-menu';
import { registerSettingsHandlers } from './ipc/settingsHandlers';

// Configure electron-log
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Configure auto-updater (only in production)
if (process.env.NODE_ENV === 'production') {
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => {
    log.info('Update available');
  });
  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
  });
}

function createMainWindow(): BrowserWindow {
  // Load window state
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  const window = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  // Let windowStateKeeper manage window state
  mainWindowState.manage(window);

  // Enable context menu
  contextMenu({
    showSaveImageAs: true,
    showCopyImage: true,
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (process.env.NODE_ENV === 'development' && devServerUrl) {
    window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
    log.info('Development mode: Loading from dev server');
  } else {
    window.loadFile(join(__dirname, '..', 'dist', 'index.html'));
    log.info('Production mode: Loading from dist');
  }

  return window;
}

// IPC Handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPath', (_event, name: string) => {
  return app.getPath(name as any);
});

app.whenReady().then(() => {
  log.info('App ready');
  
  // Register IPC handlers
  registerSettingsHandlers();
  
  mainWindow = createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
