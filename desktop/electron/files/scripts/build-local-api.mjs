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

/**
 * Install and build the local API. Returns 0 when there is nothing to build or both commands
 * succeed. A non-zero or missing pnpm status is returned so the installer stops.
 */
export function buildLocalApi({ desktopDir, readFile, spawn }) {
  let envText = '';
  try {
    envText = readFile(path.join(desktopDir, '.env'));
  } catch {
    return 0;
  }
  const apiDir = localApiPath(desktopDir, envText);
  if (!apiDir) return 0;
  for (const args of [
    ['install'],
    ['build'],
  ]) {
    const result = spawn(args, apiDir);
    if (result.status !== 0) return result.status ?? 1;
  }
  return 0;
}

function main() {
  const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const code = buildLocalApi({
    desktopDir,
    readFile: (file) => fs.readFileSync(file, 'utf8'),
    spawn: (args, cwd) =>
      spawnSync('pnpm', args, {
        cwd,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      }),
  });
  if (code !== 0) process.exit(code);
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) main();
