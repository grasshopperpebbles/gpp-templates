import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { isPortFree } from './ports';

describe('isPortFree', () => {
  it('is false while a server listens on the port and true after it closes', async () => {
    const server = createServer();
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('no port');
    expect(await isPortFree(address.port)).toBe(false);
    await new Promise<void>((res) => server.close(() => res()));
    expect(await isPortFree(address.port)).toBe(true);
  });
});
