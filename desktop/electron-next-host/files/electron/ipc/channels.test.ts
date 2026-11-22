import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CHANNELS } from './channels';

const preload = readFileSync(fileURLToPath(new URL('../preload.cts', import.meta.url)), 'utf8');

describe('IPC channels', () => {
  it('the preload invokes exactly the request channels the main process handles', () => {
    const used = [...preload.matchAll(/ipcRenderer\.invoke\('([^']+)'/g)].map((m) => m[1]).sort();
    const { hostStartup, ...requests } = CHANNELS;
    expect(hostStartup).toBe('host:startup');
    expect(used).toEqual(Object.values(requests).sort());
  });

  it('the preload listens on the startup channel', () => {
    expect(preload).toContain(`ipcRenderer.on('${CHANNELS.hostStartup}'`);
  });
});
