import { ipcMain } from 'electron';
import Store from 'electron-store';
import { CHANNELS } from './channels.js';
import { isAppUrl, isValidSettingsKey } from './validate.js';

// Initialize electron-store
const store = new Store({
  name: 'settings',
  defaults: {
    theme: 'light',
    fontSize: 14,
    autoSave: true,
  },
});

export function registerSettingsHandlers(devServerUrl: string | undefined): void {
  const checkSender = (url: string | undefined) => {
    if (!isAppUrl(url, devServerUrl)) throw new Error('Untrusted sender');
  };
  const checkKey = (key: unknown): string => {
    if (!isValidSettingsKey(key)) throw new Error(`Invalid settings key: ${String(key)}`);
    return key;
  };

  // Get one setting, or all of them when no key is given
  ipcMain.handle(CHANNELS.settingsGet, (event, key?: unknown) => {
    checkSender(event.senderFrame?.url);
    if (key === undefined) {
      return store.store;
    }
    return store.get(checkKey(key));
  });

  // Set a setting
  ipcMain.handle(CHANNELS.settingsSet, (event, key: unknown, value: unknown) => {
    checkSender(event.senderFrame?.url);
    store.set(checkKey(key), value);
    return { ok: true };
  });

  // Reset all settings
  ipcMain.handle(CHANNELS.settingsReset, (event) => {
    checkSender(event.senderFrame?.url);
    store.clear();
    return { ok: true };
  });

  // Delete a setting
  ipcMain.handle(CHANNELS.settingsDelete, (event, key: unknown) => {
    checkSender(event.senderFrame?.url);
    store.delete(checkKey(key) as never);
    return { ok: true };
  });
}
