import { ipcMain } from 'electron';
import Store from 'electron-store';

// Initialize electron-store
const store = new Store({
  name: 'settings',
  defaults: {
    theme: 'light',
    fontSize: 14,
    autoSave: true,
  },
});

export function registerSettingsHandlers(): void {
  // Get all settings
  ipcMain.handle('settings:get', (_event, key?: string) => {
    if (key) {
      return store.get(key);
    }
    return store.store;
  });

  // Set a setting
  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    store.set(key, value);
    return { ok: true };
  });

  // Reset all settings
  ipcMain.handle('settings:reset', () => {
    store.clear();
    return { ok: true };
  });

  // Delete a setting
  ipcMain.handle('settings:delete', (_event, key: string) => {
    store.delete(key);
    return { ok: true };
  });
}
