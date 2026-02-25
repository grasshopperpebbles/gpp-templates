# Chrome Extension (Manifest V3)

A Chrome browser extension built with Vite, TypeScript, and React.

## Features

- **Manifest V3** - Latest Chrome extension manifest version
- **Vite + CRXJS** - Fast development with HMR support
- **TypeScript** - Full type safety
- **React** - Modern UI for popup
- **Content Scripts** - DOM interaction on web pages
- **Background Service Worker** - Event-driven background processing

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This starts Vite in development mode with HMR. Load the extension in Chrome:

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

The extension will automatically reload when you make changes.

### Production Build

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Project Structure

```
src/
  background/
    index.ts          # Service worker (handles events, storage)
  content/
    index.ts          # Content script (runs on web pages)
  popup/
    index.html        # Popup HTML
    index.tsx         # Popup React entry
    App.tsx           # Popup component
public/
  icons/              # Extension icons
manifest.json         # Chrome extension manifest
vite.config.ts        # Vite configuration
```

## Chrome APIs Used

- `chrome.runtime` - Messaging between scripts
- `chrome.storage` - Persistent storage
- `chrome.tabs` - Tab management
- `chrome.scripting` - Script injection

## Customization

### Adding New Permissions

Edit `manifest.json` to add permissions:

```json
{
  "permissions": ["storage", "tabs", "scripting", "your-permission"]
}
```

### Restricting Host Permissions

Edit `manifest.json` to limit which sites the extension can access:

```json
{
  "host_permissions": ["https://specific-site.com/*"]
}
```

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

1. Build the extension: `npm run build`
2. Create a ZIP of the `dist` folder
3. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
