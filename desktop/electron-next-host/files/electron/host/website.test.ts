import { describe, expect, it, vi } from 'vitest';
import type { HostConfig } from './config';
import type { WebServer, WebServerOptions } from './webServer';
import { createWebsiteLauncher } from './website';

const cfg: HostConfig['web'] = {
  path: '/app/web',
  port: 3010,
  portEnv: 'DESKTOP_WEB_PORT',
  websitePort: 3000,
  distDir: '.next-desktop',
  readyTimeoutMs: 120_000,
  stopGraceMs: 5_000,
  corsTimeoutMs: 5_000,
};

function setup(portFree = true) {
  const server: WebServer = { url: 'http://localhost:3000', stop: async () => undefined, isRunning: () => true };
  const start = vi.fn<(o: WebServerOptions) => Promise<WebServer>>().mockResolvedValue(server);
  const isPortFree = vi.fn().mockResolvedValue(portFree);
  const open = vi.fn();
  const track = vi.fn();
  const launcher = createWebsiteLauncher({ web: cfg, start, isPortFree, open, track });
  return { start, isPortFree, open, track, launcher };
}

describe('createWebsiteLauncher', () => {
  it('first use starts the website server on websitePort with the default dist dir, then opens it', async () => {
    const { start, open, launcher } = setup();
    await launcher.openInBrowser();
    expect(start).toHaveBeenCalledOnce();
    expect(start.mock.calls[0]?.[0]).toMatchObject({
      cwd: '/app/web',
      port: 3000,
      distDir: '.next',
      readyTimeoutMs: 120_000,
      stopGraceMs: 5_000,
    });
    expect(open).toHaveBeenCalledWith('http://localhost:3000');
  });

  it('starts only once; later uses just open the browser', async () => {
    const { start, open, launcher } = setup();
    await launcher.openInBrowser();
    await launcher.openInBrowser();
    expect(start).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('two quick clicks share one start', async () => {
    const { start, launcher } = setup();
    await Promise.all([launcher.openInBrowser(), launcher.openInBrowser()]);
    expect(start).toHaveBeenCalledOnce();
  });

  it('a busy port means the website is already up: no start, still opens', async () => {
    const { start, open, launcher } = setup(false);
    await launcher.openInBrowser();
    expect(start).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('http://localhost:3000');
  });

  it('a failed start is thrown, does not open, and the next use tries again', async () => {
    const { start, open, launcher } = setup();
    start.mockRejectedValueOnce(new Error('boom'));
    await expect(launcher.openInBrowser()).rejects.toThrow('boom');
    expect(open).not.toHaveBeenCalled();
    await launcher.openInBrowser();
    expect(start).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledOnce();
  });

  it('hands the starting process to track so quitting can stop it', async () => {
    const { start, track, launcher } = setup();
    const handle = { stop: async () => undefined };
    start.mockImplementationOnce(async (o) => {
      o.onStarting?.(handle);
      return { url: 'http://localhost:3000', stop: async () => undefined, isRunning: () => true };
    });
    await launcher.openInBrowser();
    expect(track).toHaveBeenCalledWith(handle);
  });
});
