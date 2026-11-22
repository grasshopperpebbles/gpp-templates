import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { killProcessGroup, startWebServer } from './webServer';

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitFor(check: () => boolean, ms = 5000): Promise<void> {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 25));
  }
}

// Real processes, no spies: the "next" here starts a grandchild, like next dev's workers
describe('startWebServer with real processes', () => {
  it('stop() ends the whole process group, grandchild included', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'real-next-'));
    mkdirSync(join(cwd, 'node_modules', '.bin'), { recursive: true });
    const script = join(cwd, 'node_modules', '.bin', 'next');
    writeFileSync(script, `#!/bin/sh\nsleep 300 &\necho $! > "${join(cwd, 'grandchild.pid')}"\nwait\n`);
    chmodSync(script, 0o755);

    const server = await startWebServer(
      { cwd, port: 3999, distDir: '.next-desktop', readyTimeoutMs: 10_000, stopGraceMs: 2_000, pollMs: 25 },
      {
        spawn,
        killGroup: killProcessGroup,
        // ready as soon as the script has started its grandchild
        fetch: (async () => {
          if (!existsSync(join(cwd, 'grandchild.pid'))) throw new Error('not yet');
          return { status: 200 };
        }) as unknown as typeof fetch,
      },
    );
    await waitFor(() => readFileSync(join(cwd, 'grandchild.pid'), 'utf8').trim() !== '');
    const grandchild = Number(readFileSync(join(cwd, 'grandchild.pid'), 'utf8').trim());
    expect(alive(grandchild)).toBe(true);
    expect(server.isRunning()).toBe(true);

    await server.stop();

    expect(server.isRunning()).toBe(false);
    await waitFor(() => !alive(grandchild));
  });
});
