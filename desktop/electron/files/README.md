# Electron Desktop App

Electron desktop application template with React, TypeScript, Vite, and standard Electron utilities.

## Features

- **Electron** with React + TypeScript
- **Vite** for fast development and building
- **electron-store** for persistent settings storage
- **electron-window-state** for window size/position persistence
- **electron-log** for structured logging
- **electron-builder** for packaging/distribution
- **electron-updater** for auto-updates
- **electron-context-menu** for context menus
- **Security best practices** (sandbox, context isolation)

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

This will:
1. Start Vite dev server on port 5173
2. Launch Electron with hot reload

### Building

```bash
# Build renderer (React app)
pnpm build

# Build Electron main process
pnpm build:electron

# Build everything
pnpm build:all
```

### Distribution

```bash
# Build for current platform
pnpm dist

# Build for specific platforms
pnpm dist:mac    # macOS (DMG, ZIP)
pnpm dist:win    # Windows (NSIS, Portable)
pnpm dist:linux  # Linux (AppImage, DEB)
```

## Project Structure

```
.
├── electron/
│   ├── main.ts           # Main Electron process
│   ├── preload.ts        # Preload script (context bridge)
│   └── ipc/
│       └── settingsHandlers.ts  # IPC handlers example
├── src/
│   ├── App.tsx           # Main React component
│   ├── main.tsx          # React entry point
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── styles/           # CSS/Tailwind styles
├── public/               # Static assets
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config (renderer)
├── tsconfig.electron.json # TypeScript config (main process)
└── package.json
```

## Standard Dependencies

### Runtime Dependencies
- `electron-updater` - Auto-update functionality
- `electron-store` - Persistent settings storage
- `electron-window-state` - Window state persistence
- `electron-log` - Structured logging
- `electron-context-menu` - Context menu support

### Development Dependencies
- `electron` - Electron framework
- `electron-builder` - Packaging and distribution
- `electron-debug` - Enhanced debugging tools
- `electron-rebuild` - Rebuild native modules
- `vite` - Build tool
- `react` + `typescript` - UI framework

## Usage Examples

### Using electron-store (Settings)

```typescript
// In renderer (via IPC)
const settings = await window.electronAPI.invoke('settings:get');
await window.electronAPI.invoke('settings:set', 'theme', 'dark');
```

### Using electron-log

```typescript
// In main process
import log from 'electron-log';
log.info('App started');
log.error('Error occurred', error);
```

### Window State

Window state is automatically managed by `electron-window-state`. The window will remember its size and position.

### Auto-Updates

Auto-updates are configured in `electron/main.ts`. In production, the app will check for updates automatically.

## Configuration

### electron-builder

Edit `package.json` `build` section to customize:
- App ID
- Product name
- Icons
- Target platforms
- Code signing

### Auto-Updater

Configure update server in `electron/main.ts`:
- Set `autoUpdater.setFeedURL()` for custom update server
- Handle update events (update-available, update-downloaded, etc.)

## Security

This template follows Electron security best practices:
- ✅ Context isolation enabled
- ✅ Sandbox enabled
- ✅ Node integration disabled
- ✅ Preload script for safe IPC

## Next Steps

1. **Add IPC handlers** in `electron/ipc/` for your app's functionality
2. **Update preload.ts** to expose your IPC methods
3. **Customize electron-builder** config in `package.json`
4. **Set up update server** for auto-updates (if needed)
5. **Add your app logic** in `src/` components

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [electron-store Documentation](https://github.com/sindresorhus/electron-store)
- [Vite Documentation](https://vitejs.dev/)
