// Sandboxed preloads run as CommonJS, so this file is .cts and builds to preload.cjs. A sandboxed
// preload can't import local files either, so the channel names repeat electron/ipc/channels.ts
// (channels.test.ts checks they match).
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { BootEventPayload, ElectronAPI } from './electron-api';

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

  // Startup page: boot progress from the main process, and the Retry / Continue anyway buttons
  host: {
    onStartup: (callback) => {
      const listener = (_event: IpcRendererEvent, payload: BootEventPayload) => callback(payload);
      ipcRenderer.on('host:startup', listener);
      return () => {
        ipcRenderer.removeListener('host:startup', listener);
      };
    },
    retry: () => ipcRenderer.invoke('host:retry'),
    continueAnyway: () => ipcRenderer.invoke('host:continue'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
