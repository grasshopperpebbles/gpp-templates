# {{PROJECT_SLUG}} desktop

An Electron app that hosts your Next.js app in its own window. It starts the web app's dev server (and, if configured, its Docker Compose services), waits until the server answers, then loads it. There is no Vite renderer: the window shows the Next.js app from the sibling `web` folder.

## What it starts

- The Next.js app in `web.path`, on its own private port (`3010` by default), built into `web.distDir` (`.next-desktop`) so it never shares the website's `.next` folder. Run with `NEXT_DIST_DIR`, `PORT` and `NEXTAUTH_URL` set for that port.
- Optionally the Docker Compose services in `compose` (`services: []` means all). Quitting the app never stops Docker.
- The website's own server (port `websitePort`, `3000`) starts only from the menu item **Open website in browser**.

Quitting the app stops both Next servers. If the private port is busy the app refuses and names the port and the env var that changes it. It never picks another port.

## Quick Start

```bash
pnpm install   # downloads the Electron binary (allowed in package.json "pnpm.onlyBuiltDependencies")
pnpm dev       # compiles electron/ and starts the app
```

With npm instead of pnpm, the scripts still call `pnpm`, so install pnpm or edit them.

## host.config.json

Paths are relative to this folder.

| Field | Meaning |
| --- | --- |
| `web.path` | The Next.js app's folder. |
| `web.port` | Private port for the desktop's Next server. |
| `web.portEnv` | Env var that overrides `web.port` (for example `DESKTOP_WEB_PORT=3020 pnpm dev`). It must be an integer from 1 to 65535. |
| `web.websitePort` | Port of the website server started by "Open website in browser". |
| `web.distDir` | Build folder for the desktop's Next server (`NEXT_DIST_DIR`). The web app's `next.config` must read it. |
| `web.readyTimeoutMs` | How long to wait for the server to answer (default `120000`). |
| `web.stopGraceMs` | How long after SIGTERM before SIGKILL (default `5000`). |
| `compose` | `{ "file", "services" }`, or `null` for no Docker. |
| `api` | `{ "url", "corsOrigin" }` for the CORS preflight against your API, or `null`. |

## Open website in browser

The menu item starts the website's Next server on `web.websitePort` (if it isn't running) and opens it in your system browser.

## Links that point at :3000 need the website open

Emails, alerts and other links your backend builds usually point at the website's port (`3000`). The desktop window runs on its private port, so those links open in the system browser and only work while the website server is running. Use **Open website in browser** first.

## Security

Same defaults as the `electron` pack: sandbox, context isolation, no Node in the page, a narrow preload API, IPC sender and argument checks, a single running instance, and links to other origins open in the system browser instead of navigating the window.

## Check

```bash
pnpm type-check
pnpm lint
pnpm test         # vitest run
```

## Project structure

```
.
├── host.config.json         # what to start and where
├── electron/
│   ├── host/config.ts       # loads and validates host.config.json
│   ├── preload.cts          # Preload, built as CommonJS
│   ├── electron-api.d.ts    # window.electronAPI type
│   └── ipc/                 # channels, validation, settings handlers
├── tsconfig.json            # type-check (main process and tests)
├── tsconfig.electron.json   # build -> dist-electron/
└── package.json
```

## Distribution

```bash
pnpm dist         # current platform (also dist:mac, dist:win, dist:linux)
```

Output goes to `release/`. Auto-update is not included.
