import type { HostConfig } from './config.js';
import type { Stoppable } from './servers.js';
import type { WebServer, WebServerOptions } from './webServer.js';

/** The website is the web app's normal `next dev`, so it uses Next's default build folder. */
const WEBSITE_DIST_DIR = '.next';

export interface WebsiteDeps {
  web: HostConfig['web'];
  start: (opts: WebServerOptions) => Promise<WebServer>;
  isPortFree: (port: number) => Promise<boolean>;
  open: (url: string) => void;
  track: (handle: Stoppable) => void;
}

/**
 * Backs the menu item "Open website in browser": starts the website's Next server the first time
 * it is used, and again if that server has since exited (unless something already answers on that
 * port), then opens the system browser.
 */
export function createWebsiteLauncher(deps: WebsiteDeps) {
  const { web } = deps;
  const url = `http://localhost:${web.websitePort}`;
  let server: WebServer | null = null;
  let starting: Promise<void> | null = null;

  async function ensureStarted(): Promise<void> {
    // Busy port: assume the website is already up
    if (!(await deps.isPortFree(web.websitePort))) return;
    server = await deps.start({
      cwd: web.path,
      port: web.websitePort,
      distDir: WEBSITE_DIST_DIR,
      readyTimeoutMs: web.readyTimeoutMs,
      stopGraceMs: web.stopGraceMs,
      onStarting: deps.track,
    });
  }

  return {
    async openInBrowser(): Promise<void> {
      if (!server?.isRunning()) {
        starting ??= ensureStarted().finally(() => {
          starting = null; // a failure or a later exit lets the next click start again
        });
        await starting;
      }
      deps.open(url);
    },
  };
}
