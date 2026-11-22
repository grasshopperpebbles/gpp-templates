import { describe, expect, it, vi } from 'vitest';
import type { BootEvent } from './boot';
import { createSession } from './session';
import type { WebServer } from './webServer';

function makeServer(running = true): WebServer {
  return { url: 'http://localhost:3010', stop: async () => undefined, isRunning: () => running };
}

function setup(results: Array<WebServer | null>, events: BootEvent[] = [{ step: 'port' }]) {
  const queue = [...results];
  const runBoot = vi.fn(async (onEvent: (e: BootEvent) => void) => {
    for (const e of events) onEvent(e);
    return queue.shift() ?? null;
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
    let release: (s: WebServer) => void = () => undefined;
    const runBoot = vi.fn(() => new Promise<WebServer | null>((resolve) => (release = resolve)));
    const session = createSession({ runBoot, send: vi.fn(), load: vi.fn() });
    const first = session.start();
    await session.start();
    expect(runBoot).toHaveBeenCalledOnce();
    release(makeServer());
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
    let release: (s: WebServer | null) => void = () => undefined;
    const runBoot = vi.fn(() => new Promise<WebServer | null>((resolve) => (release = resolve)));
    const session = createSession({ runBoot, send: vi.fn(), load: vi.fn() });
    const first = session.start();
    await session.show();
    expect(runBoot).toHaveBeenCalledOnce();
    release(null);
    await first;
  });
});
