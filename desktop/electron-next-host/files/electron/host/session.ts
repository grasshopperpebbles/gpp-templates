import type { BootEvent, BootResult } from './boot.js';
import type { WebServer } from './webServer.js';

export interface SessionDeps {
  runBoot: (onEvent: (e: BootEvent) => void) => Promise<BootResult | null>;
  /** Sends a progress event to the startup page. */
  send: (e: BootEvent) => void;
  /** Loads a URL in the window. */
  load: (url: string) => void;
}

/**
 * Owns the boot run for the window: one boot at a time, the events of the current boot (so a page
 * that loads late can be brought up to date), and the running server. A server that started with a
 * CORS warning is held: the startup page stays up with the warning until the user continues
 * (`continueAnyway`) or retries.
 */
export function createSession(deps: SessionDeps) {
  let server: WebServer | null = null;
  let held = false;
  let booting = false;
  let events: BootEvent[] = [];

  async function start(): Promise<void> {
    if (booting) return;
    booting = true;
    try {
      // Retry from a CORS warning: the held server goes, the boot starts clean
      const previous = server;
      server = null;
      held = false;
      if (previous) await previous.stop().catch(() => undefined);
      events = [];
      const result = await deps.runBoot((e) => {
        events.push(e);
        deps.send(e);
      });
      server = result?.server ?? null;
      if (result) {
        if (result.corsWarning === null) deps.load(result.server.url);
        else held = true;
      }
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
    /** The user chose to open the app despite the CORS warning. */
    continueAnyway(): void {
      if (!held || !server) return;
      held = false;
      deps.load(server.url);
    },
    /** A window was (re)opened: show the running server, or boot if there isn't one. */
    async show(): Promise<void> {
      if (booting) return;
      if (server?.isRunning()) {
        // Held for a CORS warning: the startup page replays it instead
        if (!held) deps.load(server.url);
        return;
      }
      await start();
    },
  };
}
