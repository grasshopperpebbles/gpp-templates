# {{PROJECT_SLUG}} extension

A Chrome browser extension built with Vite, TypeScript, and React.

## Features

- **Manifest V3** - Latest Chrome extension manifest version
- **Vite + CRXJS** - Fast development with HMR support
- **TypeScript** - Full type safety
- **React** - Modern UI for popup
- **Content Scripts** - DOM interaction on web pages
- **Background Service Worker** - Event-driven background processing
- **Least privilege** - only the `storage` permission, no `host_permissions`, an explicit extension-pages CSP, and messages checked by type and sender (`src/shared/messages.ts`)

## Development

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- pnpm (npm works too: `npm install`, then `npm run <script>`)

### Setup

```bash
pnpm install   # esbuild's install script is allowed in package.json "pnpm.onlyBuiltDependencies"
```

### Development Mode

```bash
pnpm dev
```

This starts Vite in development mode with HMR on port 5190 (not Vite's default 5173, which a SvelteKit web app in the same project uses; change `server.port` and `server.hmr.port` in `vite.config.ts` together). Load the extension in Chrome:

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

The extension will automatically reload when you make changes.

### Production Build

```bash
pnpm build
```

This type-checks, then creates an optimized build in the `dist` folder.

### Check

```bash
pnpm typecheck   # src and vite.config.ts
pnpm test        # vitest (src/**/*.test.ts)
```

## Project Structure

```
src/
  background/
    index.ts          # Service worker (handles events, storage)
  content/
    index.ts          # Content script (runs on web pages)
  shared/
    messages.ts       # Message types and sender checks (unit tested)
  popup/
    index.html        # Popup HTML
    index.tsx         # Popup React entry
    App.tsx           # Popup component
public/
  icons/              # Extension icons (placeholders: replace icon-16/48/128.png)
manifest.json         # Chrome extension manifest
vite.config.ts        # Vite configuration
```

## Chrome APIs Used

- `chrome.runtime` - Messaging between scripts
- `chrome.storage` - Persistent storage (the only permission requested)
- `chrome.tabs.query` / `chrome.tabs.sendMessage` - Message the active tab's content script (no `tabs` permission needed; that permission only exposes tab URLs and titles)

## Customization

### Adding New Permissions

Edit `manifest.json` to add permissions, only the ones the code uses (each one can add an install warning):

```json
{
  "permissions": ["storage", "your-permission"]
}
```

### Restricting Sites

The content script runs on every http(s) page (`content_scripts[].matches`). Narrow it to the sites the extension needs:

```json
{
  "content_scripts": [{ "matches": ["https://specific-site.com/*"], "js": ["src/content/index.ts"] }]
}
```

Add `host_permissions` only when the service worker must `fetch` a site or inject scripts with `chrome.scripting`.

### Adding Message Types

Add the type to `ExtensionMessage` and `MESSAGE_TYPES` in `src/shared/messages.ts` (and to `PAGE_ONLY_TYPES` if a content script must not send it), then handle it in `src/background/index.ts`. Unknown messages are refused.

### Adding More Content Scripts

Edit `manifest.json`:

```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["src/content/custom-script.ts"]
    }
  ]
}
```

## Publishing

1. Build the extension: `pnpm build`
2. Create a ZIP of the `dist` folder
3. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
