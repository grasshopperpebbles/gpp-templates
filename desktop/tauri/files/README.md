# {{PROJECT_SLUG}} desktop

A desktop application built with Tauri 2, React, and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 (see `.nvmrc`) and pnpm
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
# Install dependencies (esbuild's install script is allowed in package.json "pnpm.onlyBuiltDependencies")
pnpm install

# Run in development mode
pnpm tauri:dev

# Build for production (installers in src-tauri/target/release/bundle/)
pnpm tauri:build

# Debug build, faster, unoptimized (src-tauri/target/debug/bundle/)
pnpm tauri build --debug
```

### Check

```bash
pnpm type-check   # frontend and vite.config.ts
pnpm test         # Rust unit tests (cargo test)
pnpm lint:rust    # cargo clippy, warnings as errors
```

The first Rust build downloads and compiles Tauri's crates and takes several minutes; later builds are incremental.

The Vite dev server runs on port 1420 (Tauri's convention, not Vite's default 5173, which a SvelteKit web app in the same project uses). To change it, edit `server.port` in `vite.config.ts` and `build.devUrl` in `src-tauri/tauri.conf.json` together.

## Features

- **File Operations**: Read, write, and list files in the app data folder
- **CLI Commands**: Run allowlisted programs (`gpp` by default)
- **Secure Storage**: Store credentials in the system keychain, under the app's identifier
- **React + TypeScript**: Modern frontend with type safety
- **Tailwind CSS**: Utility-first styling

## Project Structure

```
├── src/                  # React frontend
│   ├── lib/tauri.ts      # Typed wrappers for the IPC commands
│   └── styles/           # CSS files
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── main.rs       # Entry point
│   │   └── lib.rs        # IPC commands (and their unit tests)
│   ├── capabilities/
│   │   └── default.json  # What the main window may call
│   ├── icons/            # App icons (placeholders: regenerate with `pnpm tauri icon <1024px png or svg>`)
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration (window, CSP, bundle)
└── package.json
```

## IPC Commands

The Rust backend exposes these commands:

| Command | Description |
|---------|-------------|
| `read_file` | Read a file in the app data folder |
| `write_file` | Write a file in the app data folder |
| `list_directory` | List a folder in the app data folder |
| `run_command` | Run a program from `ALLOWED_PROGRAMS` in `lib.rs` |
| `store_credential` | Store in keychain |
| `get_credential` | Retrieve from keychain |
| `delete_credential` | Delete from keychain |

File paths are relative to the app data folder; absolute paths and `..` are refused. To add a command, write it in `lib.rs` and register it in `generate_handler!`. Treat its arguments as untrusted: any script running in the window can call it.

For per-window control over app commands, list them in `build.rs` with `tauri_build::AppManifest::new().commands(&[...])` and grant `allow-<command-name>` in `capabilities/default.json`; once that list exists, every app command (including ones add-ons register) must be granted there or it is refused.

## Security

- Capabilities: the main window gets `core:default` only; no fs, shell or other plugins are installed. The app's own commands are callable from the bundled frontend, never from remote origins
- Content-Security-Policy in `tauri.conf.json` (`app.security.csp`; `devCsp` adds what Vite's dev server needs). To call an API from the frontend, add its origin to `connect-src`
- File commands confined to the app data folder; `run_command` only runs allowlisted programs
- Credentials stored in the system keychain, scoped to the app's identifier
