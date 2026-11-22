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

/** The service a failed `up --wait` names ("container x is unhealthy"), when stderr says. */
function unhealthyService(stderr: string): string | null {
  return /container\s+(\S+)\s+is unhealthy/i.exec(stderr)?.[1] ?? /dependency failed to start:\s*(.+)/i.exec(stderr)?.[1]?.trim() ?? null;
}

/**
 * `docker compose -f <file> up -d --wait --wait-timeout <s> [services]`. Services [] starts everything
 * in the file. `--wait` returns once every service with a health check is healthy, so the web app
 * isn't started (or the API checked) while the API is still coming up.
 */
export async function composeUp(compose: NonNullable<HostConfig['compose']>, run: Run): Promise<void> {
  const seconds = Math.max(1, Math.ceil(compose.waitTimeoutMs / 1000));
  const args = ['compose', '-f', compose.file, 'up', '-d', '--wait', '--wait-timeout', String(seconds), ...compose.services];
  const result = await run('docker', args, { cwd: dirname(compose.file) });
  if (result.code === 0) return;
  if (/Cannot connect to the Docker daemon/i.test(result.stderr)) throw new DockerNotRunningError();
  if (/unhealthy|timed out|timeout|failed to start/i.test(result.stderr)) {
    const service = unhealthyService(result.stderr);
    throw new Error(
      `${service ? `Docker service ${service}` : 'A Docker service'} didn't become healthy within ${seconds} seconds. ` +
        `Check it with docker compose logs.\n${result.stderr.trim()}`,
    );
  }
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
