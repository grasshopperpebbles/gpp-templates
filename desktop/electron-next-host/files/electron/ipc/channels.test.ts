import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CHANNELS } from './channels';

describe('IPC channels', () => {
  it('the preload uses exactly the channels the main process handles', () => {
    const preload = readFileSync(fileURLToPath(new URL('../preload.cts', import.meta.url)), 'utf8');
    const used = [...preload.matchAll(/ipcRenderer\.invoke\('([^']+)'/g)].map((m) => m[1]).sort();
    expect(used).toEqual(Object.values(CHANNELS).sort());
  });
});
