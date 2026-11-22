import { createServer, type Server } from 'node:net';
import { describe, expect, it } from 'vitest';
import { isPortFree } from './ports';

/** Listens on a free port on `host` (undefined = the default dual-stack host). Null when the machine can't. */
async function occupy(host: string | undefined, port = 0): Promise<{ server: Server; port: number } | null> {
  const server = createServer();
  const ok = await new Promise<boolean>((resolve) => {
    server.once('error', () => resolve(false));
    if (host === undefined) server.listen(port, () => resolve(true));
    else server.listen(port, host, () => resolve(true));
  });
  if (!ok) return null;
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('no port');
  return { server, port: address.port };
}

const close = (server: Server) => new Promise<void>((res) => server.close(() => res()));

describe('isPortFree', () => {
  for (const host of [undefined, '::', '0.0.0.0', '127.0.0.1', '::1']) {
    const label = host ?? 'the default host';
    it(`is false while a server listens on ${label} and true after it closes`, async (ctx) => {
      const held = await occupy(host);
      if (!held) return ctx.skip(); // no such address on this machine
      expect(await isPortFree(held.port)).toBe(false);
      await close(held.server);
      expect(await isPortFree(held.port)).toBe(true);
    });
  }
});
