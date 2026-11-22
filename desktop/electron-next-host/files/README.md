# {{PROJECT_SLUG}} desktop

An Electron app that hosts your Next.js app in its own window. It starts the web app's dev server (and, if configured, its Docker Compose services), waits until the server answers, then loads it. There is no Vite renderer: the window shows the Next.js app from the sibling `web` folder.

## What it starts

- The Next.js app in `web.path`, on its own private port (`3010` by default), built into `web.distDir` (`.next-desktop`) so it never shares the website's `.next` folder. Run with `NEXT_DIST_DIR`, `PORT` and `NEXTAUTH_URL` set for that port.
- Optionally the Docker Compose services in `compose` (`services: []` means all). Quitting the app never stops Docker.
- The website's own server (port `websitePort`, `3000`) starts only from the menu item **Open website in browser**.

## Startup

The window opens on a startup page that lists each step with its state: Docker services (only when `compose` is set), the port check, the web app, and the API CORS check (only when `api` is set). When a step fails the page says why and offers **Retry**:

- Docker isn't running: "Docker isn't running. Start Docker Desktop, then click Retry."
- Docker services don't become healthy within `compose.waitTimeoutMs` (the app runs `docker compose up -d --wait`): it names the unhealthy service.
- The port is busy on any local address (including a `next dev` on `::`): it names the port and `web.portEnv`.
- The web app exits before it answers: the last 20 lines of its output are shown in a monospace block.
- The web app doesn't answer within `web.readyTimeoutMs`: it says how long it waited.

When the API doesn't allow the desktop origin (`http://localhost:<web.port>`), the startup page stays up with the warning and two buttons: **Continue anyway** opens the app, **Retry** starts the boot again. Otherwise, when the server answers, the window loads `http://localhost:<web.port>`. Only that origin and the startup page can navigate the window; any other http(s) link opens in your system browser.

On macOS, closing the window leaves the app running and the dock icon reopens it. The server is started again only if it has stopped.

Quitting the app stops both Next servers (a server that is still starting too). If the private port is busy the app refuses and names the port and the env var that changes it. It never picks another port.

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
| `web.portEnv` | Env var that overrides `web.port`. It is read from the process env (`DESKTOP_WEB_PORT=3020 pnpm dev`) first, then from the project root's `.env`. It must be an integer from 1 to 65535. |
| `web.websitePort` | Port of the website server started by "Open website in browser". |
| `web.distDir` | Build folder for the desktop's Next server (`NEXT_DIST_DIR`). The web app's `next.config` must read it. |
| `web.readyTimeoutMs` | How long to wait for the server to answer (default `120000`). |
| `web.stopGraceMs` | How long after SIGTERM before SIGKILL (default `5000`). |
| `web.corsTimeoutMs` | How long the CORS preflight waits for the API (default `5000`). |
| `compose` | `{ "file", "services", "waitTimeoutMs" }`, or `null` for no Docker. `waitTimeoutMs` (default `120000`) bounds the health-check wait. |
| `api` | `{ "url" }` for the CORS preflight against your API, or `null`. The origin checked is always `http://localhost:<effective web.port>`. |
| `projectRoot` | Optional. Folder of the root `.env` (default: the folder of the compose file). |

## Open website in browser

**File > Open website in browser** starts the website's Next server on `web.websitePort` the first time (with the default `.next` build folder), then opens it in your system browser. If something already answers on that port it is assumed to be the website and is just opened. The server stays up until you quit.

## Menu

Standard app, edit and window menus, plus **Open website in browser**, **Reload page** (View) and **Show logs** (File; opens the electron-log file).

## Links that point at :3000 need the website open

Emails, alerts and other links your backend builds usually point at the website's port (`3000`). The desktop window runs on its private port, so those links open in the system browser and only work while the website server is running. Use **Open website in browser** first.

## Security

Same defaults as the `electron` pack: sandbox, context isolation, no Node in the page, a narrow preload API, IPC sender and argument checks, a single running instance, and links to other origins open in the system browser instead of navigating the window. App info and settings IPC answer only the hosted web app; `host:retry` answers only the startup page (a `file://` page inside `electron/pages`).

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
│   ├── main.ts              # window, menu, IPC and quit wiring
│   ├── menu.ts              # application menu template
│   ├── host/                # config, compose, ports, webServer, corsCheck, boot,
│   │                        # session, website, servers, navigation, quit, ipcGuard, dotenv (all unit-tested)
│   ├── pages/               # startup page (HTML, CSS, JS; CSP default-src 'self')
│   ├── preload.cts          # Preload, built as CommonJS
│   ├── electron-api.d.ts    # window.electronAPI type
│   └── ipc/                 # channels, validation, settings handlers
├── tsconfig.json            # type-check (main process and tests)
├── tsconfig.electron.json   # build -> dist-electron/
└── package.json
```

## Distribution

Packaged builds are not supported in V1. The app runs from a terminal with `pnpm dev` and starts the sibling web app's dev server, so there is nothing to package yet.
