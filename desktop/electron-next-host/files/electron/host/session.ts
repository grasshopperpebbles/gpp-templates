import type { BootEvent } from './boot.js';
import type { WebServer } from './webServer.js';

export interface SessionDeps {
  runBoot: (onEvent: (e: BootEvent) => void) => Promise<WebServer | null>;
  /** Sends a progress event to the startup page. */
  send: (e: BootEvent) => void;
  /** Loads a URL in the window. */
  load: (url: string) => void;
}

/**
 * Owns the boot run for the window: one boot at a time, the events of the current boot (so a page
 * that loads late can be brought up to date), and the running server.
 */
export function createSession(deps: SessionDeps) {
  let server: WebServer | null = null;
  let booting = false;
  let events: BootEvent[] = [];

  async function start(): Promise<void> {
    if (booting) return;
    booting = true;
    server = null;
    events = [];
    try {
      const result = await deps.runBoot((e) => {
        events.push(e);
        deps.send(e);
      });
      server = result;
      if (result) deps.load(result.url);
    } finally {
      booting = false;
    }
  }

  return {
    start,
    /** Re-sends the current boot's events (the startup page just finished loading). */
    replay(): void {
      for (const e of events) deps.send(e);
    },
    /** A window was (re)opened: show the running server, or boot if there isn't one. */
    async show(): Promise<void> {
      if (booting) return;
      if (server?.isRunning()) {
        deps.load(server.url);
        return;
      }
      await start();
    },
  };
}
