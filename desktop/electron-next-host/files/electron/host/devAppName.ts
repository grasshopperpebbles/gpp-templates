import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * macOS takes the menu-bar app name from the running bundle's Info.plist, not from app.name.
 * This host runs from the dev Electron binary (node_modules/electron/dist/Electron.app), so
 * without this the menu bar says "Electron". The binary is the project's own download, so the
 * change stays inside this project and a reinstall simply resets it (the next launch redoes it).
 */

export type Run = (file: string, args: string[]) => string;

const run: Run = (file, args) => execFileSync(file, args, { encoding: 'utf8' });

/** Info.plist of the dev Electron.app, from the path `require.resolve('electron')` returns. */
export function infoPlistPath(electronEntry: string): string {
  return path.join(path.dirname(electronEntry), 'dist', 'Electron.app', 'Contents', 'Info.plist');
}

const KEYS = ['CFBundleName', 'CFBundleDisplayName'] as const;

/** Sets both bundle name keys to `name`. Returns true when it changed anything. */
export function setBundleName(plist: string, name: string, exec: Run = run): boolean {
  let changed = false;
  for (const key of KEYS) {
    let current: string | null;
    try {
      current = exec('plutil', ['-extract', key, 'raw', plist]).trim();
    } catch {
      current = null; // key missing: plutil -replace adds it
    }
    if (current === name) continue;
    exec('plutil', ['-replace', key, '-string', name, plist]);
    changed = true;
  }
  return changed;
}

/** Runs only on macOS; elsewhere the window and taskbar already use productName. */
export function applyDevAppName(
  platform: NodeJS.Platform,
  productName: string | undefined,
  electronEntry: string,
  exec: Run = run,
): 'skipped' | 'unchanged' | 'set' {
  if (platform !== 'darwin' || !productName) return 'skipped';
  return setBundleName(infoPlistPath(electronEntry), productName, exec) ? 'set' : 'unchanged';
}
