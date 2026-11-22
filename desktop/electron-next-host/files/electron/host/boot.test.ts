import { describe, expect, it, vi } from 'vitest';
import { boot, type BootDeps, type BootEvent } from './boot';
import { DockerNotRunningError } from './compose';
import type { HostConfig } from './config';
import { WebServerExitedError, WebServerTimeoutError, type WebServer } from './webServer';

const cfg: HostConfig = {
  web: {
    path: '/app/web',
    port: 3010,
    portEnv: 'DESKTOP_WEB_PORT',
    websitePort: 3000,
    distDir: '.next-desktop',
    readyTimeoutMs: 120_000,
    stopGraceMs: 5_000,
    corsTimeoutMs: 5_000,
  },
  compose: { file: '/app/docker-compose.yml', services: [], waitTimeoutMs: 120_000 },
  api: { url: 'http://localhost:8000', corsOrigin: 'http://localhost:3010' },
  projectRoot: '/app',
};

const server: WebServer = { url: 'http://localhost:3010', stop: async () => undefined, isRunning: () => true };

function deps(overrides: Partial<BootDeps> = {}): BootDeps {
  return {
    composeUp: vi.fn().mockResolvedValue(undefined),
    isPortFree: vi.fn().mockResolvedValue(true),
    startWebServer: vi.fn().mockResolvedValue(server),
    checkCors: vi.fn().mockResolvedValue({ ok: true, message: 'fine' }),
    ...overrides,
  };
}

async function run(config: HostConfig, d: BootDeps) {
  const events: BootEvent[] = [];
  const result = await boot(config, d, (e) => events.push(e));
  return { events, result };
}

describe('boot', () => {
  it('runs docker → port → web → cors → ready in order', async () => {
    const { events, result } = await run(cfg, deps());
    expect(events.map((e) => e.step)).toEqual(['docker', 'port', 'web', 'cors', 'ready']);
    expect(events.some((e) => e.error)).toBe(false);
    expect(result).toEqual({ server, corsWarning: null });
  });

  it('checks the port the config names', async () => {
    const d = deps();
    await run(cfg, d);
    expect(d.isPortFree).toHaveBeenCalledWith(3010);
  });

  it('skips docker when compose is null', async () => {
    const d = deps();
    const { events, result } = await run({ ...cfg, compose: null }, d);
    expect(d.composeUp).not.toHaveBeenCalled();
    expect(events.map((e) => e.step)).toEqual(['port', 'web', 'cors', 'ready']);
    expect(result).toEqual({ server, corsWarning: null });
  });

  it('skips the CORS check when there is no api', async () => {
    const { events } = await run({ ...cfg, api: null }, deps({ checkCors: () => null }));
    expect(events.map((e) => e.step)).toEqual(['docker', 'port', 'web', 'ready']);
  });

  it("Docker not running: stops with the Docker message and returns null", async () => {
    const d = deps({ composeUp: vi.fn().mockRejectedValue(new DockerNotRunningError()) });
    const { events, result } = await run(cfg, d);
    expect(events.at(-1)).toEqual({
      step: 'docker',
      error: "Docker isn't running. Start Docker Desktop, then click Retry.",
    });
    expect(result).toBeNull();
    expect(d.isPortFree).not.toHaveBeenCalled();
  });

  it('another compose failure shows its message', async () => {
    const d = deps({ composeUp: vi.fn().mockRejectedValue(new Error('docker compose up failed (exit 1): bad file')) });
    const { events, result } = await run(cfg, d);
    expect(events.at(-1)).toEqual({ step: 'docker', error: 'docker compose up failed (exit 1): bad file' });
    expect(result).toBeNull();
  });

  it('port busy: names the port and the env var, returns null', async () => {
    const d = deps({ isPortFree: vi.fn().mockResolvedValue(false) });
    const { events, result } = await run(cfg, d);
    expect(events.at(-1)).toEqual({
      step: 'port',
      error: "Port 3010 is in use. Stop whatever is on it, or set DESKTOP_WEB_PORT in the project's .env to another port.",
    });
    expect(result).toBeNull();
    expect(d.startWebServer).not.toHaveBeenCalled();
  });

  it('web exits: reports it with the output tail and returns null', async () => {
    const tail = ['Error: Cannot find module next', 'at ...'];
    const d = deps({ startWebServer: vi.fn().mockRejectedValue(new WebServerExitedError(tail)) });
    const { events, result } = await run(cfg, d);
    expect(events.at(-1)).toEqual({ step: 'web', error: 'The web app stopped before it was ready.', tail });
    expect(result).toBeNull();
  });

  it('web timeout: says how long it waited', async () => {
    const d = deps({ startWebServer: vi.fn().mockRejectedValue(new WebServerTimeoutError()) });
    const { events, result } = await run({ ...cfg, web: { ...cfg.web, readyTimeoutMs: 90_000 } }, d);
    expect(events.at(-1)).toEqual({ step: 'web', error: 'The web app did not answer within 90 seconds.' });
    expect(result).toBeNull();
  });

  it('any other web failure shows its message', async () => {
    const d = deps({ startWebServer: vi.fn().mockRejectedValue(new Error('spawn next ENOENT')) });
    const { events } = await run(cfg, d);
    expect(events.at(-1)).toEqual({ step: 'web', error: 'spawn next ENOENT' });
  });

  it('CORS not ok: returns the running server with the warning and sends no ready event', async () => {
    const d = deps({ checkCors: vi.fn().mockResolvedValue({ ok: false, message: 'API says no' }) });
    const { events, result } = await run(cfg, d);
    expect(events.at(-1)).toEqual({ step: 'cors', error: 'API says no' });
    expect(events.some((e) => e.step === 'ready')).toBe(false);
    expect(result).toEqual({ server, corsWarning: 'API says no' });
  });
});
