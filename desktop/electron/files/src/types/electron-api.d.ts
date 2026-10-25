/** The API the preload script exposes on `window.electronAPI` (see electron/preload.cts). */
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  /** Only the names in electron/ipc/validate.ts ALLOWED_PATH_NAMES are answered. */
  getPath: (name: 'documents' | 'downloads' | 'desktop' | 'pictures' | 'music' | 'videos') => Promise<string>;
  settings: {
    get: (key?: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<{ ok: boolean }>;
    reset: () => Promise<{ ok: boolean }>;
    delete: (key: string) => Promise<{ ok: boolean }>;
  };
}

declare global {
  interface Window {
    /** Undefined when the renderer runs in a plain browser (e.g. `vite` alone). */
    electronAPI?: ElectronAPI;
  }
}
