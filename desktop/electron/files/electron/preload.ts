import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  
  // Settings (using electron-store)
  settings: {
    get: (key?: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset'),
    delete: (key: string) => ipcRenderer.invoke('settings:delete', key),
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      getPath: (name: string) => Promise<string>;
      settings: {
        get: (key?: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<{ ok: boolean }>;
        reset: () => Promise<{ ok: boolean }>;
        delete: (key: string) => Promise<{ ok: boolean }>;
      };
    };
  }
}
