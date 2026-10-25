// Sandboxed preloads run as CommonJS, so this file is .cts and builds to preload.cjs. A sandboxed
// preload can't import local files either, so the channel names repeat electron/ipc/channels.ts
// (channels.test.ts checks they match).
import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../src/types/electron-api';

// Expose named calls only; the renderer never gets ipcRenderer itself
const api: ElectronAPI = {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name) => ipcRenderer.invoke('app:getPath', name),

  // Settings (using electron-store)
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset'),
    delete: (key) => ipcRenderer.invoke('settings:delete', key),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
