import type { ChildProcess } from 'node:child_process';
import { join } from 'node:path';

const TAIL_LINES = 20;
const DEFAULT_POLL_MS = 500;

export interface WebServerOptions {
  cwd: string;
  port: number;
  distDir: string;
  extraEnv?: Record<string, string>;
  readyTimeoutMs: number;
  stopGraceMs: number;
  /** Readiness poll interval; defaults to 500 ms. */
  pollMs?: number;
  /**
   * Called right after the process is spawned, before it answers, with a handle that can stop it.
   * Lets a caller stop a server that is still starting (for example when the app quits).
   */
  onStarting?: (handle: { stop(): Promise<void> }) => void;
  /** Every complete line of the server's output, for as long as it runs (so runtime errors reach the log). */
  onLine?: (line: string) => void;
}

export interface WebServer {
  url: string;
  /** False once the process has exited. */
  isRunning(): boolean;
  stop(): Promise<void>;
}

export class WebServerExitedError extends Error {
  constructor(public tail: string[]) {
    super(`The web server exited before it answered.\n${tail.join('\n')}`);
    this.name = 'WebServerExitedError';
  }
}

export class WebServerTimeoutError extends Error {
  constructor(message = 'The web server did not answer in time.') {
    super(message);
    this.name = 'WebServerTimeoutError';
  }
}

export interface WebServerDeps {
  spawn: typeof import('node:child_process').spawn;
  fetch: typeof fetch;
  /** Called with the child's pid (positive); the real one signals the whole group via process.kill(-pid). */
  killGroup: (pid: number, signal: NodeJS.Signals) => void;
}

/** Production killGroup: the child is detached, so -pid addresses its process group. */
export function killProcessGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch {
    // group already gone
  }
}

export function webServerEnv(base: NodeJS.ProcessEnv, opts: WebServerOptions): NodeJS.ProcessEnv {
  return {
    ...base,
    ...opts.extraEnv,
    PORT: String(opts.port),
    NEXT_DIST_DIR: opts.distDir,
    NEXTAUTH_URL: `http://localhost:${opts.port}`,
  };
}

export function startWebServer(opts: WebServerOptions, deps: WebServerDeps): Promise<WebServer> {
  const url = `http://localhost:${opts.port}`;
  const child: ChildProcess = deps.spawn(
    join(opts.cwd, 'node_modules', '.bin', 'next'),
    ['dev', '-p', String(opts.port)],
    { cwd: opts.cwd, env: webServerEnv(process.env, opts), detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const pid = child.pid;

  const tail: string[] = [];
  const partial = new Map<string, string>();
  const feed = (name: string) => (chunk: Buffer | string) => {
    const parts = `${partial.get(name) ?? ''}${chunk.toString()}`.split('\n');
    partial.set(name, parts.pop() ?? '');
    for (const line of parts) {
      opts.onLine?.(line);
      tail.push(line);
      if (tail.length > TAIL_LINES) tail.shift();
    }
  };
  child.stdout?.on('data', feed('out'));
  child.stderr?.on('data', feed('err'));

  let exited = false;
  const exitWaiters: Array<() => void> = [];
  child.once('exit', () => {
    exited = true;
    for (const wake of exitWaiters) wake();
  });

  const stop = (): Promise<void> => {
    if (exited || pid === undefined) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const killTimer = setTimeout(() => {
        if (!exited) deps.killGroup(pid, 'SIGKILL');
        resolve();
      }, opts.stopGraceMs);
      exitWaiters.push(() => {
        clearTimeout(killTimer);
        resolve();
      });
      deps.killGroup(pid, 'SIGTERM');
    });
  };

  opts.onStarting?.({ stop });

  return new Promise<WebServer>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearInterval(poller);
      clearTimeout(deadline);
      fn();
    };
    const flush = () => {
      for (const rest of partial.values()) {
        if (rest !== '') tail.push(rest);
      }
      return tail.slice(-TAIL_LINES);
    };

    let polling = false;
    const poll = async () => {
      if (polling || settled) return;
      polling = true;
      try {
        const response = await deps.fetch(`${url}/`);
        if (response.status < 500) finish(() => resolve({ url, stop, isRunning: () => !exited }));
      } catch {
        // not listening yet
      } finally {
        polling = false;
      }
    };
    const poller = setInterval(() => void poll(), opts.pollMs ?? DEFAULT_POLL_MS);
    const deadline = setTimeout(() => {
      finish(() => {
        void stop();
        reject(new WebServerTimeoutError());
      });
    }, opts.readyTimeoutMs);

    child.once('exit', () => finish(() => reject(new WebServerExitedError(flush()))));
    child.once('error', (error) => finish(() => reject(error)));
  });
}
