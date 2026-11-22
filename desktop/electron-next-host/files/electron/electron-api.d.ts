/** A boot progress report (see electron/host/boot.ts BootEvent). */
export interface BootEventPayload {
  step: 'docker' | 'port' | 'web' | 'cors' | 'ready';
  error?: string;
  tail?: string[];
}

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
  /** Used by the startup page only; the main process ignores retry from any other page. */
  host: {
    onStartup: (callback: (event: BootEventPayload) => void) => () => void;
    retry: () => Promise<void>;
  };
}

declare global {
  interface Window {
    /** Undefined when the renderer runs in a plain browser tab. */
    electronAPI?: ElectronAPI;
  }
}
