import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const prismaCli = path.join(directory, 'node_modules', 'prisma', 'build', 'index.js');

const child = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  cwd: directory,
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  stdio: 'inherit',
});

if (child.status !== 0) {
  if (child.error) console.error(child.error);
  process.exit(child.status === null ? 1 : child.status);
}

await import('./dist/server.js');
