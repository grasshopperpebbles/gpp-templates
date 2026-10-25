# Tauri Desktop App

A desktop application built with Tauri 2.0, React, and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

The Vite dev server runs on port 1420 (Tauri's convention, not Vite's default 5173, which a SvelteKit web app in the same project uses). To change it, edit `server.port` in `vite.config.ts` and `build.devUrl` in `src-tauri/tauri.conf.json` together.

## Features

- **File Operations**: Read, write, and list files/directories
- **Shell Commands**: Execute CLI commands (like GPP)
- **Secure Storage**: Store credentials in system keychain
- **React + TypeScript**: Modern frontend with type safety
- **Tailwind CSS**: Utility-first styling

## Project Structure

```
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── lib/              # Utilities and API wrappers
│   └── styles/           # CSS files
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── main.rs       # Entry point
│   │   └── lib.rs        # IPC commands
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
└── package.json
```

## IPC Commands

The Rust backend exposes these commands:

| Command | Description |
|---------|-------------|
| `read_file` | Read file contents |
| `write_file` | Write content to file |
| `list_directory` | List directory contents |
| `run_command` | Execute a CLI command |
| `store_credential` | Store in keychain |
| `get_credential` | Retrieve from keychain |
| `delete_credential` | Delete from keychain |

## Security

- Sandboxed by default
- Explicit permission grants in `tauri.conf.json`
- No arbitrary shell access (only through IPC)
- Credentials stored in system keychain
