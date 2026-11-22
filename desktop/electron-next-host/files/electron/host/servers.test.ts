import { describe, expect, it, vi } from 'vitest';
import { createServerRegistry } from './servers';

describe('createServerRegistry', () => {
  it('stopAll stops every tracked handle', async () => {
    const registry = createServerRegistry();
    const a = { stop: vi.fn().mockResolvedValue(undefined) };
    const b = { stop: vi.fn().mockResolvedValue(undefined) };
    registry.track(a);
    registry.track(b);
    await registry.stopAll();
    expect(a.stop).toHaveBeenCalledOnce();
    expect(b.stop).toHaveBeenCalledOnce();
  });

  it('a handle tracked after stopAll is stopped at once (quit during startup)', async () => {
    const registry = createServerRegistry();
    await registry.stopAll();
    const late = { stop: vi.fn().mockResolvedValue(undefined) };
    registry.track(late);
    expect(late.stop).toHaveBeenCalledOnce();
  });

  it('reports closed after stopAll', async () => {
    const registry = createServerRegistry();
    expect(registry.isClosed()).toBe(false);
    await registry.stopAll();
    expect(registry.isClosed()).toBe(true);
  });

  it('one failing stop does not keep the others from stopping', async () => {
    const registry = createServerRegistry();
    const bad = { stop: vi.fn().mockRejectedValue(new Error('x')) };
    const good = { stop: vi.fn().mockResolvedValue(undefined) };
    registry.track(bad);
    registry.track(good);
    await expect(registry.stopAll()).resolves.toBeUndefined();
    expect(good.stop).toHaveBeenCalled();
  });
});
