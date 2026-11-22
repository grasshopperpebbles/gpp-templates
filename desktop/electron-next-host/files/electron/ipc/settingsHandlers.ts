import { ipcMain } from 'electron';
import Store from 'electron-store';
import { guarded } from '../host/ipcGuard.js';
import { CHANNELS } from './channels.js';
import { isValidSettingsKey } from './validate.js';

// Initialize electron-store
const store = new Store({
  name: 'settings',
  defaults: {
    theme: 'light',
    fontSize: 14,
    autoSave: true,
  },
});

/** `isTrustedUrl` says which pages may call these handlers (the hosted web app, not the startup page). */
export function registerSettingsHandlers(isTrustedUrl: (url: string | undefined) => boolean): void {
  const handle = <Args extends unknown[], R>(channel: string, fn: (...args: Args) => R) =>
    ipcMain.handle(channel, guarded(isTrustedUrl, (_event, ...args: Args) => fn(...args)));
  const checkKey = (key: unknown): string => {
    if (!isValidSettingsKey(key)) throw new Error(`Invalid settings key: ${String(key)}`);
    return key;
  };

  // Get one setting, or all of them when no key is given
  handle(CHANNELS.settingsGet, (key?: unknown) => {
    if (key === undefined) {
      return store.store;
    }
    return store.get(checkKey(key));
  });

  // Set a setting
  handle(CHANNELS.settingsSet, (key: unknown, value: unknown) => {
    store.set(checkKey(key), value);
    return { ok: true };
  });

  // Reset all settings
  handle(CHANNELS.settingsReset, () => {
    store.clear();
    return { ok: true };
  });

  // Delete a setting
  handle(CHANNELS.settingsDelete, (key: unknown) => {
    store.delete(checkKey(key) as never);
    return { ok: true };
  });
}
