# {{PROJECT_SLUG}} desktop

Electron desktop application template with React, TypeScript, Vite, and standard Electron utilities.

## Features

- **Electron** with React + TypeScript, ES modules in the main process
- **Vite** for the renderer (dev server with hot reload, relative-path production build)
- **electron-store** for persistent settings
- **electron-window-state** for window size/position persistence
- **electron-log** for logging (main process)
- **electron-builder** for packaging, **electron-updater** for auto-updates
- **electron-context-menu** for context menus
- **Security defaults**: sandbox, context isolation, no Node in the renderer, a narrow preload API, IPC sender and argument checks, external links in the system browser, no in-app navigation, and a production Content-Security-Policy

## Quick Start

```bash
pnpm install   # downloads the Electron binary (allowed in package.json "pnpm.onlyBuiltDependencies")
pnpm dev       # Vite on http://localhost:5173 + Electron
```

`pnpm dev` compiles the main process and preload once (`build:electron`) before starting Electron. After editing files under `electron/`, restart `pnpm dev`; renderer changes in `src/` hot-reload.

With npm instead of pnpm, use `npm install` and run the scripts with `npm run`; the scripts call `pnpm` internally, so install pnpm or edit them.

### Build and run

```bash
pnpm build           # renderer -> dist/
pnpm build:electron  # main + preload -> dist-electron/
pnpm start           # both, then run the built app
```

### Check

```bash
pnpm type-check   # renderer and main process
pnpm lint
pnpm test         # vitest (electron/**/*.test.ts, src/**/*.test.ts)
```

### Distribution

```bash
pnpm dist         # current platform
pnpm dist:mac     # macOS (DMG, ZIP)
pnpm dist:win     # Windows (NSIS, portable)
pnpm dist:linux   # Linux (AppImage, DEB)
```

Output goes to `release/`.

## Project Structure

```
.
├── electron/
│   ├── main.ts              # Main process (ESM)
│   ├── preload.cts          # Preload, built as CommonJS (sandboxed preloads can't be ESM)
│   └── ipc/
│       ├── channels.ts      # IPC channel names (repeated in preload.cts; a test checks they match)
│       ├── validate.ts      # Sender, URL and argument checks (pure, unit tested)
│       └── settingsHandlers.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── types/electron-api.d.ts  # window.electronAPI type, shared by preload and renderer
│   └── styles/
├── index.html               # Vite entry
├── vite.config.ts           # Renderer build, production CSP, vitest config
├── tsconfig.json            # Renderer
├── tsconfig.electron.json   # Main + preload -> dist-electron/
├── eslint.config.js
└── package.json             # scripts and electron-builder "build" config
```

## Using the preload API

```typescript
// Renderer (window.electronAPI is undefined when the page runs in a plain browser)
const version = await window.electronAPI?.getVersion();
await window.electronAPI?.settings.set('theme', 'dark');
const theme = await window.electronAPI?.settings.get('theme');
const docs = await window.electronAPI?.getPath('documents');
```

### Adding an IPC call

1. Add the channel name to `electron/ipc/channels.ts`.
2. Handle it in the main process. Check the sender first (`isAppUrl(event.senderFrame?.url, devServerUrl)`), then validate every argument: the renderer is untrusted input.
3. Expose it in `electron/preload.cts` with the same channel string, and add its type to `src/types/electron-api.d.ts`.
4. `pnpm test` fails if the preload and `channels.ts` disagree.

Never expose `ipcRenderer` itself, or a generic `invoke(channel, ...args)`, to the renderer.

## Logging

```typescript
// Main process
import log from 'electron-log/main';
log.info('App started');
```

Logs go to the console in dev and to the platform log folder (e.g. `~/Library/Logs/<app>/main.log`).

## Configuration

### App identity

`package.json` sets `name`, `build.appId` and `build.productName` from the gpp project name. Change `appId` to a reverse-DNS id you own before signing. `productName` also names the settings folder (`userData`), so changing it after release moves users' settings.

### Icons and signing

Put icons in `build/` (`icon.icns`, `icon.ico`, `icon.png`); electron-builder uses the default Electron icon otherwise. macOS notarization and Windows signing need certificates; see the electron-builder docs.

### Auto-updates

The updater runs only in a packaged app (`app.isPackaged`) and logs failures instead of crashing. It does nothing useful until you add a `publish` entry to `build` in `package.json` (GitHub releases, S3, or a generic server).

### Content-Security-Policy

`vite.config.ts` injects the CSP into the production `index.html`. Loading remote scripts, fonts or APIs needs the matching `script-src`, `font-src` or `connect-src` source added there. Dev runs without a CSP (Vite's hot reload needs inline scripts), so Electron prints an "Insecure Content-Security-Policy" warning in dev only.

## Resources

- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-builder](https://www.electron.build/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [Vite](https://vite.dev/)
