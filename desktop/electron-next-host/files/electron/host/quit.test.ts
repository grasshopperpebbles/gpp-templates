import { describe, expect, it, vi } from 'vitest';
import { createQuitHandler } from './quit';

function setup(closed = false) {
  let release: () => void = () => undefined;
  const servers = {
    isClosed: vi.fn(() => closed),
    stopAll: vi.fn(() => new Promise<void>((resolve) => (release = resolve))),
  };
  const exit = vi.fn();
  const handler = createQuitHandler({ servers, exit });
  return { servers, exit, handler, release: () => release() };
}

describe('createQuitHandler', () => {
  it('holds the quit, stops the servers, then exits', async () => {
    const { servers, exit, handler, release } = setup();
    const event = { preventDefault: vi.fn() };
    handler(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(servers.stopAll).toHaveBeenCalledOnce();
    expect(exit).not.toHaveBeenCalled();
    release();
    await new Promise((r) => setTimeout(r));
    expect(exit).toHaveBeenCalledOnce();
  });

  it('lets the quit that follows the exit through', async () => {
    const { handler, release } = setup();
    handler({ preventDefault: vi.fn() });
    release();
    await new Promise((r) => setTimeout(r));
    const second = { preventDefault: vi.fn() };
    handler(second);
    expect(second.preventDefault).not.toHaveBeenCalled();
  });

  it('does not stop twice when the servers are already closed', () => {
    const { servers, exit, handler } = setup(true);
    handler({ preventDefault: vi.fn() });
    expect(servers.stopAll).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
  });
});
