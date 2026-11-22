import { describe, expect, it, vi } from 'vitest';
import type { BootEvent, BootResult } from './boot';
import { createSession } from './session';
import type { WebServer } from './webServer';

function makeServer(running = true): WebServer {
  return { url: 'http://localhost:3010', stop: vi.fn(async () => undefined), isRunning: () => running };
}

const ok = (server: WebServer): BootResult => ({ server, corsWarning: null });

function setup(results: Array<WebServer | BootResult | null>, events: BootEvent[] = [{ step: 'port' }]) {
  const queue = [...results];
  const runBoot = vi.fn(async (onEvent: (e: BootEvent) => void) => {
    for (const e of events) onEvent(e);
    const next = queue.shift() ?? null;
    return next && 'corsWarning' in next ? next : next ? ok(next) : null;
  });
  const send = vi.fn();
  const load = vi.fn();
  const session = createSession({ runBoot, send, load });
  return { runBoot, send, load, session };
}

describe('createSession', () => {
  it('start runs boot, forwards each event, and loads the server url on success', async () => {
    const server = makeServer();
    const { runBoot, send, load, session } = setup([server], [{ step: 'port' }, { step: 'ready' }]);
    await session.start();
    expect(runBoot).toHaveBeenCalledOnce();
    expect(send.mock.calls.map((c) => (c[0] as BootEvent).step)).toEqual(['port', 'ready']);
    expect(load).toHaveBeenCalledWith('http://localhost:3010');
  });

  it('does not load anything when boot stops on an error', async () => {
    const { load, session } = setup([null]);
    await session.start();
    expect(load).not.toHaveBeenCalled();
  });

  it('ignores start while a boot is already running', async () => {
    let release: (s: BootResult) => void = () => undefined;
    const runBoot = vi.fn(() => new Promise<BootResult | null>((resolve) => (release = resolve)));
    const session = createSession({ runBoot, send: vi.fn(), load: vi.fn() });
    const first = session.start();
    await session.start();
    expect(runBoot).toHaveBeenCalledOnce();
    release(ok(makeServer()));
    await first;
  });

  it('retry after a failed boot runs boot again', async () => {
    const { runBoot, session } = setup([null, makeServer()]);
    await session.start();
    await session.start();
    expect(runBoot).toHaveBeenCalledTimes(2);
  });

  it('replay re-sends the events of the current boot', async () => {
    const { send, session } = setup([null], [{ step: 'port' }, { step: 'port', error: 'busy' }]);
    await session.start();
    send.mockClear();
    session.replay();
    expect(send.mock.calls.map((c) => c[0])).toEqual([{ step: 'port' }, { step: 'port', error: 'busy' }]);
  });

  it('a new boot starts with a clean event list', async () => {
    const { send, session } = setup([null, null], [{ step: 'port' }]);
    await session.start();
    await session.start();
    send.mockClear();
    session.replay();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('show loads the running server without booting again', async () => {
    const { runBoot, load, session } = setup([makeServer()]);
    await session.start();
    load.mockClear();
    await session.show();
    expect(runBoot).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledWith('http://localhost:3010');
  });

  it('show boots again when there is no server or it has exited', async () => {
    const dead = makeServer(false);
    const { runBoot, session } = setup([dead, makeServer()]);
    await session.start();
    await session.show();
    expect(runBoot).toHaveBeenCalledTimes(2);
  });

  it('show does nothing extra while booting', async () => {
    let release: (s: BootResult | null) => void = () => undefined;
    const runBoot = vi.fn(() => new Promise<BootResult | null>((resolve) => (release = resolve)));
    const session = createSession({ runBoot, send: vi.fn(), load: vi.fn() });
    const first = session.start();
    await session.show();
    expect(runBoot).toHaveBeenCalledOnce();
    release(null);
    await first;
  });

  describe('CORS warning', () => {
    const warn = (server: WebServer): BootResult => ({ server, corsWarning: 'API says no' });
    const events: BootEvent[] = [{ step: 'cors' }, { step: 'cors', error: 'API says no' }];

    it('keeps the startup page up: the server is not loaded until the user continues', async () => {
      const server = makeServer();
      const { load, session } = setup([warn(server)], events);
      await session.start();
      expect(load).not.toHaveBeenCalled();
      session.continueAnyway();
      expect(load).toHaveBeenCalledWith('http://localhost:3010');
    });

    it('replays the warning to a page that loads late', async () => {
      const { send, session } = setup([warn(makeServer())], events);
      await session.start();
      send.mockClear();
      session.replay();
      expect(send.mock.calls.map((c) => c[0])).toEqual(events);
    });

    it('continueAnyway does nothing without a held server, and loads only once', async () => {
      const { load, session } = setup([makeServer(), warn(makeServer())], events);
      await session.start();
      load.mockClear();
      session.continueAnyway();
      expect(load).not.toHaveBeenCalled();
      await session.start();
      session.continueAnyway();
      session.continueAnyway();
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('retry stops the held server and boots again', async () => {
      const held = makeServer();
      const { runBoot, load, session } = setup([warn(held), makeServer()], events);
      await session.start();
      await session.start();
      expect(held.stop).toHaveBeenCalledOnce();
      expect(runBoot).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledOnce();
    });

    it('show with a held server neither loads it nor boots again', async () => {
      const { runBoot, load, session } = setup([warn(makeServer())], events);
      await session.start();
      await session.show();
      expect(load).not.toHaveBeenCalled();
      expect(runBoot).toHaveBeenCalledOnce();
    });
  });
});
