import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import type { HostConfig } from './config.js';

export type Run = (
  cmd: string,
  args: string[],
  opts: { cwd: string },
) => Promise<{ code: number; stdout: string; stderr: string }>;

export class DockerNotRunningError extends Error {
  constructor(message = "Docker isn't running.") {
    super(message);
    this.name = 'DockerNotRunningError';
  }
}

/** `docker compose -f <file> up -d [services]`. Services [] starts everything in the file. */
export async function composeUp(compose: NonNullable<HostConfig['compose']>, run: Run): Promise<void> {
  const args = ['compose', '-f', compose.file, 'up', '-d', ...compose.services];
  const result = await run('docker', args, { cwd: dirname(compose.file) });
  if (result.code === 0) return;
  if (/Cannot connect to the Docker daemon/i.test(result.stderr)) throw new DockerNotRunningError();
  throw new Error(`docker compose up failed (exit ${result.code}): ${result.stderr.trim()}`);
}

/** The real `Run`: resolves with the exit code instead of rejecting on a non-zero exit. */
export const execRun: Run = (cmd, args, opts) =>
  new Promise((resolve) => {
    execFile(cmd, args, { cwd: opts.cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (!error) return resolve({ code: 0, stdout, stderr });
      const code = typeof error.code === 'number' ? error.code : 127;
      resolve({ code, stdout, stderr: stderr || error.message });
    });
  });
