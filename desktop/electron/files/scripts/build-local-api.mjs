/**
 * Before electron-builder runs, build the API named by GPP_LOCAL_API_DIR.
 * With no such variable this does nothing, so the Docker desktop recipes are unchanged.
 * The packaged app starts resources/api/dist/server.js, and dist/ is not in git.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute API directory from a desktop .env, or undefined when the app has no local API. */
export function localApiPath(desktopDir, envText) {
  let rel = '';
  for (const line of String(envText).split(/\r?\n/)) {
    const m = /^\s*GPP_LOCAL_API_DIR\s*=\s*(.*?)\s*$/.exec(line);
    if (m) rel = (m[1] ?? '').replace(/^(['"])(.*)\1$/, '$2');
  }
  if (!rel.trim()) return undefined;
  return path.resolve(desktopDir, rel.trim());
}

function main() {
  const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  let envText = '';
  try {
    envText = fs.readFileSync(path.join(desktopDir, '.env'), 'utf8');
  } catch {
    return;
  }
  const apiDir = localApiPath(desktopDir, envText);
  if (!apiDir) return;
  for (const args of [
    ['install'],
    ['build'],
  ]) {
    const result = spawnSync('pnpm', args, {
      cwd: apiDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) main();
