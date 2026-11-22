// Runs before `electron .` (pnpm dev / start): names the dev Electron.app after package.json
// productName so the macOS menu bar shows the app's name instead of "Electron".
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { applyDevAppName } from './host/devAppName.js';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  productName?: string;
};

try {
  applyDevAppName(process.platform, pkg.productName, require.resolve('electron'));
} catch (error) {
  // Cosmetic only: never block the launch over the menu-bar name.
  console.warn(`Could not set the app name on the dev Electron.app: ${String(error)}`);
}
