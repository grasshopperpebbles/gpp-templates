/**
 * Hands VITE_API_BASE_URL to the Electron main process (added by `gpp add stripe`).
 *
 * The main process is compiled by tsc and has no .env loader, so it cannot read VITE_API_BASE_URL
 * itself. This Vite plugin writes the value Vite resolved (the same one the renderer inlines and
 * config/csp.ts adds to connect-src) to dist-electron/build-config.json whenever Vite starts:
 * `pnpm dev` and `pnpm build` (which `pnpm dist` runs) both write it. electron-builder packages
 * dist-electron/, and electron/ipc/stripeHandlers.ts reads the file at startup.
 *
 * Only VITE_API_BASE_URL is written: never put a secret in a VITE_ variable, the renderer ships it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export const MAIN_BUILD_CONFIG_FILE = 'build-config.json';

export function mainProcessConfig(): Plugin {
  return {
    name: 'electron-main-build-config',
    configResolved(config) {
      // Vitest loads vite.config.ts too; tests must not rewrite the app's build output
      if (process.env.VITEST) return;
      const apiBaseUrl = String(config.env.VITE_API_BASE_URL ?? '').trim();
      const outDir = join(config.root, 'dist-electron');
      mkdirSync(outDir, { recursive: true });
      // Written even when unset, so a stale URL from an earlier build never lingers
      writeFileSync(
        join(outDir, MAIN_BUILD_CONFIG_FILE),
        `${JSON.stringify(apiBaseUrl ? { apiBaseUrl } : {}, null, 2)}\n`,
      );
    },
  };
}
