import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  startWebServer,
  WebServerExitedError,
  WebServerTimeoutError,
  webServerEnv,
  type WebServerOptions,
} from './webServer';

const opts: WebServerOptions = {
  cwd: '/app/web',
  port: 3010,
  distDir: '.next-desktop',
  readyTimeoutMs: 10_000,
  stopGraceMs: 2_000,
};

class FakeChild extends EventEmitter {
  pid = 4242;
  stdout = new PassThrough();
  stderr = new PassThrough();
  exitCode: number | null = null;
  exit(code: number): void {
    this.exitCode = code;
    this.emit('exit', code, null);
  }
}

function setup(fetchImpl: (url: string) => Promise<{ status: number }>) {
  const child = new FakeChild();
  const spawn = vi.fn().mockReturnValue(child);
  const fetchFn = vi.fn(fetchImpl);
  const killGroup = vi.fn();
  const deps = {
    spawn: spawn as unknown as typeof import('node:child_process').spawn,
    fetch: fetchFn as unknown as typeof fetch,
    killGroup,
  };
  return { child, spawn, fetchFn, killGroup, deps };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('webServerEnv', () => {
  it('sets PORT, NEXT_DIST_DIR, NEXTAUTH_URL=http://localhost:<port> and keeps base vars', () => {
    const env = webServerEnv({ FOO: 'bar', PORT: '3000' }, { ...opts, extraEnv: { EXTRA: '1' } });
    expect(env).toMatchObject({
      FOO: 'bar',
      EXTRA: '1',
      PORT: '3010',
      NEXT_DIST_DIR: '.next-desktop',
      NEXTAUTH_URL: 'http://localhost:3010',
    });
  });
});

describe('startWebServer', () => {
  it('spawns <cwd>/node_modules/.bin/next dev -p <port> detached', async () => {
    const { spawn, deps } = setup(async () => ({ status: 200 }));
    const pending = startWebServer(opts, deps);
    await vi.advanceTimersByTimeAsync(500);
    await pending;
    const [bin, args, options] = spawn.mock.calls[0] as [string, string[], Record<string, unknown>];
    expect(bin).toBe('/app/web/node_modules/.bin/next');
    expect(args).toEqual(['dev', '-p', '3010']);
    expect(options).toMatchObject({ cwd: '/app/web', detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    expect((options.env as NodeJS.ProcessEnv).NEXTAUTH_URL).toBe('http://localhost:3010');
  });

  it('resolves once GET http://localhost:<port>/ answers any status < 500', async () => {
    let calls = 0;
    const { fetchFn, deps } = setup(async () => {
      calls += 1;
      if (calls === 1) throw new Error('ECONNREFUSED');
      if (calls === 2) return { status: 503 };
      return { status: 404 };
    });
    const server = await (async () => {
      const pending = startWebServer(opts, deps);
      await vi.advanceTimersByTimeAsync(2_000);
      return pending;
    })();
    expect(fetchFn.mock.calls[0]?.[0]).toBe('http://localhost:3010/');
    expect(calls).toBe(3);
    expect(server.url).toBe('http://localhost:3010');
  });

  it('rejects with WebServerExitedError carrying the last 20 output lines when the process exits first', async () => {
    const { child, deps } = setup(async () => {
      throw new Error('ECONNREFUSED');
    });
    const pending = startWebServer(opts, deps);
    const caught = pending.catch((e: unknown) => e);
    const lines = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`);
    child.stdout.write(`${lines.slice(0, 15).join('\n')}\n`);
    child.stderr.write(`${lines.slice(15).join('\n')}\n`);
    await vi.advanceTimersByTimeAsync(0);
    child.exit(1);
    const error = await caught;
    expect(error).toBeInstanceOf(WebServerExitedError);
    const tail = (error as WebServerExitedError).tail;
    expect(tail).toHaveLength(20);
    expect(tail[19]).toBe('line 25');
    expect(tail[0]).toBe('line 6');
  });

  it('rejects with WebServerTimeoutError after readyTimeoutMs and stops the process', async () => {
    const { deps, killGroup } = setup(async () => {
      throw new Error('ECONNREFUSED');
    });
    const caught = startWebServer(opts, deps).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await caught).toBeInstanceOf(WebServerTimeoutError);
    expect(killGroup).toHaveBeenCalledWith(4242, 'SIGTERM');
  });

  it("stop() sends SIGTERM to the process group, then SIGKILL after stopGraceMs if it hasn't exited", async () => {
    const { deps, killGroup } = setup(async () => ({ status: 200 }));
    const pending = startWebServer(opts, deps);
    await vi.advanceTimersByTimeAsync(500);
    const server = await pending;
    const stopped = server.stop();
    expect(killGroup).toHaveBeenCalledTimes(1);
    expect(killGroup).toHaveBeenLastCalledWith(4242, 'SIGTERM');
    await vi.advanceTimersByTimeAsync(1_999);
    expect(killGroup).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(killGroup).toHaveBeenLastCalledWith(4242, 'SIGKILL');
    await stopped;
  });

  it('stop() resolves without SIGKILL when the process exits on SIGTERM', async () => {
    const { child, deps, killGroup } = setup(async () => ({ status: 200 }));
    const pending = startWebServer(opts, deps);
    await vi.advanceTimersByTimeAsync(500);
    const server = await pending;
    const stopped = server.stop();
    child.exit(0);
    await stopped;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(killGroup).toHaveBeenCalledTimes(1);
  });
});

describe('startWebServer handles', () => {
  it('calls onStarting with a handle that stops the process before it is ready', async () => {
    const { child, killGroup, deps } = setup(() => Promise.reject(new Error('down')));
    let handle: { stop(): Promise<void> } | undefined;
    const started = startWebServer({ ...opts, onStarting: (h) => (handle = h) }, deps);
    started.catch(() => undefined);
    expect(handle).toBeDefined();
    const stopped = handle!.stop();
    expect(killGroup).toHaveBeenCalledWith(4242, 'SIGTERM');
    child.exit(0);
    await stopped;
    await expect(started).rejects.toBeInstanceOf(WebServerExitedError);
  });

  it('isRunning is true when ready and false after the process exits', async () => {
    const { child, deps } = setup(() => Promise.resolve({ status: 200 }));
    const started = startWebServer(opts, deps);
    await vi.advanceTimersByTimeAsync(500);
    const server = await started;
    expect(server.isRunning()).toBe(true);
    child.exit(1);
    expect(server.isRunning()).toBe(false);
  });

  it('passes every output line to onLine, also after the server is ready', async () => {
    const { child, deps } = setup(() => Promise.resolve({ status: 200 }));
    const lines: string[] = [];
    const started = startWebServer({ ...opts, onLine: (l) => lines.push(l) }, deps);
    child.stdout.write('starting\npart');
    await vi.advanceTimersByTimeAsync(500);
    await started;
    child.stdout.write('ial\nruntime error: boom\n');
    await vi.advanceTimersByTimeAsync(0);
    expect(lines).toEqual(['starting', 'partial', 'runtime error: boom']);
  });
});
