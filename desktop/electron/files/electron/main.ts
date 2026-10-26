import { app, BrowserWindow, ipcMain, net, protocol, shell } from 'electron';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import log from 'electron-log/main';
import windowStateKeeper from 'electron-window-state';
import electronUpdater from 'electron-updater';
import contextMenu from 'electron-context-menu';
import { registerSettingsHandlers } from './ipc/settingsHandlers.js';
import { CHANNELS } from './ipc/channels.js';
import {
  APP_ORIGIN,
  APP_SCHEME,
  externalHttpUrl,
  isAllowedPathName,
  isAppUrl,
  resolveAppFile,
} from './ipc/validate.js';

// electron-updater is CommonJS; take autoUpdater off the default export
const { autoUpdater } = electronUpdater;

log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dev loads the Vite server; a packaged app always loads the built files
const devServerUrl = app.isPackaged ? undefined : process.env.VITE_DEV_SERVER_URL;
const rendererDir = join(__dirname, '..', 'dist');

// The built renderer is served from app://bundle/ instead of file://. A file:// page sends
// `Origin: null`, which an API could only allow by trusting every sandboxed or file page; app://
// pages send `Origin: app://bundle`. Standard + secure give the scheme a real origin, relative
// URLs, storage and a secure context; supportFetchAPI lets the page fetch() its own files.
// Must run before the app is ready.
protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/** Serves app://bundle/<path> from dist/, refusing anything outside it. */
function registerAppProtocol(): void {
  protocol.handle(APP_SCHEME, async (request) => {
    const file = resolveAppFile(rendererDir, request.url);
    if (!file) return new Response('Not found', { status: 404 });
    try {
      if (!(await stat(file)).isFile()) return new Response('Not found', { status: 404 });
    } catch {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });
}

let mainWindow: BrowserWindow | null = null;

// One running instance; a second launch focuses the existing window
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Applies to every window, so register it once
contextMenu({
  showSaveImageAs: true,
  showCopyImage: true,
});

function createMainWindow(): BrowserWindow {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  const window = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // Sandboxed preloads must be CommonJS, hence .cjs (built from preload.cts)
      preload: join(__dirname, 'preload.cjs'),
    },
  });

  mainWindowState.manage(window);
  window.once('ready-to-show', () => window.show());

  // Links that open a new window go to the system browser; nothing else opens
  window.webContents.setWindowOpenHandler(({ url }) => {
    const external = externalHttpUrl(url);
    if (external) void shell.openExternal(external);
    return { action: 'deny' };
  });

  // The app window never navigates away from the app
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url, devServerUrl)) {
      event.preventDefault();
    }
  });

  if (devServerUrl) {
    void window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
    log.info('Development mode: loading from dev server');
  } else {
    void window.loadURL(`${APP_ORIGIN}/index.html`);
    log.info(`Production mode: loading ${APP_ORIGIN}/ from dist`);
  }

  return window;
}

// IPC handlers only answer the app's own pages
ipcMain.handle(CHANNELS.appGetVersion, (event) => {
  if (!isAppUrl(event.senderFrame?.url, devServerUrl)) throw new Error('Untrusted sender');
  return app.getVersion();
});

ipcMain.handle(CHANNELS.appGetPath, (event, name: unknown) => {
  if (!isAppUrl(event.senderFrame?.url, devServerUrl)) throw new Error('Untrusted sender');
  if (!isAllowedPathName(name)) throw new Error(`Path not available: ${String(name)}`);
  return app.getPath(name);
});

app.whenReady().then(() => {
  log.info('App ready');

  if (!devServerUrl) registerAppProtocol();
  registerSettingsHandlers(devServerUrl);

  mainWindow = createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });

  // Auto-update only in a packaged build with a `publish` config (electron-builder then ships app-update.yml)
  if (app.isPackaged && existsSync(join(process.resourcesPath, 'app-update.yml'))) {
    autoUpdater.on('update-available', () => log.info('Update available'));
    autoUpdater.on('update-downloaded', () => log.info('Update downloaded'));
    autoUpdater.on('error', (error) => log.warn('Auto-update failed:', error));
    autoUpdater.checkForUpdatesAndNotify().catch((error) => log.warn('Auto-update check failed:', error));
  }
}).catch((error) => {
  log.error('Failed to start:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
