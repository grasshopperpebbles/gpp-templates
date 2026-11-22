import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import log from 'electron-log/main';
import windowStateKeeper from 'electron-window-state';
import contextMenu from 'electron-context-menu';
import { boot } from './host/boot.js';
import { composeUp, execRun } from './host/compose.js';
import { loadHostConfig } from './host/config.js';
import { checkCors } from './host/corsCheck.js';
import { isPageUrl } from './host/navigation.js';
import { isPortFree } from './host/ports.js';
import { createServerRegistry } from './host/servers.js';
import { createSession } from './host/session.js';
import { createWebsiteLauncher } from './host/website.js';
import { killProcessGroup, startWebServer, type WebServerDeps } from './host/webServer.js';
import { CHANNELS } from './ipc/channels.js';
import { registerSettingsHandlers } from './ipc/settingsHandlers.js';
import { externalHttpUrl, isAllowedPathName, isStartupUrl } from './ipc/validate.js';
import { buildMenuTemplate } from './menu.js';

// This file is thin wiring; the logic lives in host/ and ipc/ where it has tests.

log.initialize();
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist-electron/main.js → the workspace root holds host.config.json; the pages ship as source
const appRoot = join(__dirname, '..');
const pagesDir = join(appRoot, 'electron', 'pages');
const startupFile = join(pagesDir, 'startup.html');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Applies to every window, so register it once
contextMenu({ showSaveImageAs: true, showCopyImage: true });

const servers = createServerRegistry();
const webDeps: WebServerDeps = { spawn, fetch: globalThis.fetch, killGroup: killProcessGroup };

function start(): void {
  const cfg = loadHostConfig(join(appRoot, 'host.config.json'), process.env);
  const { web } = cfg;
  const isHosted = (url: string | undefined) => isPageUrl(url, web.port);

  const session = createSession({
    runBoot: (onEvent) =>
      boot(
        cfg,
        {
          composeUp: () => (cfg.compose ? composeUp(cfg.compose, execRun) : Promise.resolve()),
          isPortFree,
          startWebServer: () =>
            startWebServer(
              {
                cwd: web.path,
                port: web.port,
                distDir: web.distDir,
                readyTimeoutMs: web.readyTimeoutMs,
                stopGraceMs: web.stopGraceMs,
                onStarting: (handle) => servers.track(handle),
              },
              webDeps,
            ),
          checkCors: () =>
            cfg.api ? checkCors(cfg.api.url, cfg.api.corsOrigin, globalThis.fetch, web.corsTimeoutMs) : null,
        },
        (event) => {
          log.info('boot', event.step, event.error ?? '');
          onEvent(event);
        },
      ),
    send: (event) => mainWindow?.webContents.send(CHANNELS.hostStartup, event),
    load: (url) => void mainWindow?.loadURL(url),
  });

  const website = createWebsiteLauncher({
    web,
    start: (opts) => startWebServer(opts, webDeps),
    isPortFree,
    open: (url) => void shell.openExternal(url),
    track: (handle) => servers.track(handle),
  });

  // IPC: app info and settings answer the hosted web app; retry answers only the startup page
  ipcMain.handle(CHANNELS.appGetVersion, (event) => {
    if (!isHosted(event.senderFrame?.url)) throw new Error('Untrusted sender');
    return app.getVersion();
  });
  ipcMain.handle(CHANNELS.appGetPath, (event, name: unknown) => {
    if (!isHosted(event.senderFrame?.url)) throw new Error('Untrusted sender');
    if (!isAllowedPathName(name)) throw new Error(`Path not available: ${String(name)}`);
    return app.getPath(name);
  });
  registerSettingsHandlers(isHosted);
  ipcMain.handle(CHANNELS.hostRetry, async (event) => {
    if (!isStartupUrl(event.senderFrame?.url, pagesDir)) throw new Error('Untrusted sender');
    await session.start();
  });

  function createMainWindow(): BrowserWindow {
    const state = windowStateKeeper({ defaultWidth: 1280, defaultHeight: 800 });
    const window = new BrowserWindow({
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      show: false,
      backgroundColor: '#171b21',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        // Sandboxed preloads must be CommonJS, hence .cjs (built from preload.cts)
        preload: join(__dirname, 'preload.cjs'),
      },
    });
    state.manage(window);
    window.once('ready-to-show', () => window.show());
    window.on('closed', () => {
      if (mainWindow === window) mainWindow = null;
    });

    // Links that open a new window go to the system browser; nothing else opens
    window.webContents.setWindowOpenHandler(({ url }) => {
      const external = externalHttpUrl(url);
      if (external) void shell.openExternal(external);
      return { action: 'deny' };
    });

    // The window stays on the startup page and the hosted app; other http(s) links open outside
    window.webContents.on('will-navigate', (event, url) => {
      if (isPageUrl(url, web.port) || isStartupUrl(url, pagesDir)) return;
      event.preventDefault();
      const external = externalHttpUrl(url);
      if (external) void shell.openExternal(external);
    });

    // A page that loads after boot began (first load, reload, reopened window) catches up
    window.webContents.on('did-finish-load', () => {
      if (isStartupUrl(window.webContents.getURL(), pagesDir)) session.replay();
    });

    void window.loadFile(startupFile);
    return window;
  }

  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      buildMenuTemplate(
        {
          openWebsite: () => {
            website.openInBrowser().catch((error: unknown) => {
              log.error('Open website failed:', error);
              dialog.showErrorBox('Could not start the website', error instanceof Error ? error.message : String(error));
            });
          },
          reloadPage: () => mainWindow?.webContents.reload(),
          showLogs: () => void shell.openPath(log.transports.file.getFile().path),
        },
        process.platform,
        app.name,
      ),
    ),
  );

  mainWindow = createMainWindow();
  void session.show();

  // macOS: closing the window leaves the app running; the dock icon reopens it
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      void session.show();
    }
  });
}

app
  .whenReady()
  .then(() => {
    log.info('App ready');
    start();
  })
  .catch((error: unknown) => {
    log.error('Failed to start:', error);
    dialog.showErrorBox('Could not start', error instanceof Error ? error.message : String(error));
    app.exit(1);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Quit: stop both Next servers (never Docker), then exit
let quitReady = false;
app.on('before-quit', (event) => {
  if (quitReady) return;
  event.preventDefault();
  if (servers.isClosed()) return;
  void servers.stopAll().finally(() => {
    quitReady = true;
    app.exit();
  });
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
