import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
  localApiFailureText,
  localApiTreeKill,
  localApiUsesShell,
  onLocalApiExit,
  planLocalApi,
  readEnvValue,
  readOrCreateJwtSecret,
  rememberApiOutput,
} from './local-api.js';
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
let localApiChild: ChildProcess | undefined;
/** Set before the quit kill, so that child's exit is not reported as an API failure. */
let quitting = false;

/** API_PORT, else the port in VITE_API_BASE_URL, else 3001. */
function desktopApiPort(envText: string): string {
  const explicit = readEnvValue(envText, 'API_PORT');
  if (explicit) return explicit;
  const baseUrl = readEnvValue(envText, 'VITE_API_BASE_URL');
  if (!baseUrl) return '3001';
  try {
    return new URL(baseUrl).port || '3001';
  } catch {
    return '3001';
  }
}

/**
 * Starts the sibling API when `.env` sets GPP_LOCAL_API_DIR. A missing file, or a blank
 * value, leaves startup unchanged for the FastAPI and MySQL desktop apps.
 */
function startLocalApi(): void {
  const envPath = join(app.getAppPath(), '.env');
  if (!existsSync(envPath)) return;
  const envText = readFileSync(envPath, 'utf8');
  const localApiDir = readEnvValue(envText, 'GPP_LOCAL_API_DIR');
  const userData = app.getPath('userData');
  const plan = planLocalApi({
    packaged: app.isPackaged,
    localApiDir,
    desktopRoot: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    execPath: process.execPath,
    userData,
    apiPort: desktopApiPort(envText),
    jwtSecret: app.isPackaged && localApiDir?.trim() ? readOrCreateJwtSecret(userData) : undefined,
  });
  if (!plan) return;

  const usesShell = localApiUsesShell(process.platform, app.isPackaged);
  // A packaged app has no terminal. Keep the API's output for the failure dialog.
  const capture = app.isPackaged;
  let apiOutput: string[] = [];
  const child = spawn(plan.command, plan.args, {
    cwd: plan.cwd,
    env: { ...process.env, ...plan.env },
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: usesShell,
  });
  localApiChild = child;
  const takeOutput = (chunk: Buffer): void => {
    apiOutput = rememberApiOutput(apiOutput, chunk.toString());
    log.error(chunk.toString().trimEnd());
  };
  child.stdout?.on('data', takeOutput);
  child.stderr?.on('data', takeOutput);
  child.on('error', (error) => {
    log.error('Local API failed to start:', error);
    dialog.showErrorBox('API failed to start', localApiFailureText(null, apiOutput));
  });
  child.on('exit', (code) => {
    if (!onLocalApiExit(code, mainWindow !== null, quitting)) return;
    log.error(`Local API exited with code ${String(code)}`);
    dialog.showErrorBox('API failed to start', localApiFailureText(code, apiOutput));
  });
}

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

  startLocalApi();
  // Stay null until the window is actually shown, so a local API that exits during
  // startup still counts as exiting before the window opened.
  const opening = createMainWindow();
  opening.once('ready-to-show', () => {
    mainWindow = opening;
  });

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

app.on('before-quit', () => {
  // Windows kill() is TerminateProcess and the child exits 1. Mark the quit first so that
  // exit is not shown as "The local API exited." A non-zero exit while the app is in use still is.
  quitting = true;
  const child = localApiChild;
  if (!child) return;
  const tree = localApiTreeKill(process.platform, app.isPackaged, child.pid);
  if (tree) {
    // Dev on Windows: the child is cmd.exe. Kill pnpm and the API with it, or the port stays taken.
    spawn(tree.command, tree.args, { stdio: 'ignore', windowsHide: true });
    return;
  }
  child.kill();
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
