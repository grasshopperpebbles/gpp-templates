import { DockerNotRunningError } from './compose.js';
import type { CorsResult } from './corsCheck.js';
import type { HostConfig } from './config.js';
import { WebServerExitedError, WebServerTimeoutError, type WebServer } from './webServer.js';

export type BootStep = 'docker' | 'port' | 'web' | 'cors' | 'ready';

/**
 * One progress report for the startup page. A step event means that step has begun (so the earlier
 * ones are done). With `error` the step failed and boot stopped, except for `cors`, where the error
 * is only a warning and boot goes on.
 */
export interface BootEvent {
  step: BootStep;
  error?: string;
  tail?: string[];
}

export interface BootDeps {
  composeUp: () => Promise<void>;
  isPortFree: (port: number) => Promise<boolean>;
  startWebServer: () => Promise<WebServer>;
  /** null when there is no API to check */
  checkCors: () => Promise<CorsResult> | null;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Starts Docker (if configured), checks the private port, starts the web server and runs the CORS
 * check, reporting each step. Returns the running server, or null when it stopped on an error (the
 * startup page then offers Retry). A CORS problem is a warning only.
 */
export async function boot(cfg: HostConfig, deps: BootDeps, onEvent: (e: BootEvent) => void): Promise<WebServer | null> {
  if (cfg.compose) {
    onEvent({ step: 'docker' });
    try {
      await deps.composeUp();
    } catch (error) {
      const text =
        error instanceof DockerNotRunningError ? "Docker isn't running. Start Docker Desktop, then click Retry." : message(error);
      onEvent({ step: 'docker', error: text });
      return null;
    }
  }

  onEvent({ step: 'port' });
  if (!(await deps.isPortFree(cfg.web.port))) {
    onEvent({
      step: 'port',
      error: `Port ${cfg.web.port} is in use. Stop whatever is on it, or set ${cfg.web.portEnv} in the project's .env to another port.`,
    });
    return null;
  }

  onEvent({ step: 'web' });
  let server: WebServer;
  try {
    server = await deps.startWebServer();
  } catch (error) {
    if (error instanceof WebServerExitedError) {
      onEvent({ step: 'web', error: 'The web app stopped before it was ready.', tail: error.tail });
    } else if (error instanceof WebServerTimeoutError) {
      onEvent({ step: 'web', error: `The web app did not answer within ${Math.round(cfg.web.readyTimeoutMs / 1000)} seconds.` });
    } else {
      onEvent({ step: 'web', error: message(error) });
    }
    return null;
  }

  const cors = deps.checkCors();
  if (cors) {
    onEvent({ step: 'cors' });
    const result = await cors;
    if (!result.ok) onEvent({ step: 'cors', error: result.message });
  }

  onEvent({ step: 'ready' });
  return server;
}
