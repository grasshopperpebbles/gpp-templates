import { describe, expect, it, vi } from 'vitest';
import { composeUp, DockerNotRunningError, execRun, type Run } from './compose';

const ok = { code: 0, stdout: '', stderr: '' };

describe('composeUp', () => {
  it('runs docker compose -f <file> up -d with the named services', async () => {
    const run = vi.fn<Run>().mockResolvedValue(ok);
    await composeUp({ file: '/x/docker-compose.yml', services: ['a', 'b'] }, run);
    expect(run).toHaveBeenCalledWith('docker', ['compose', '-f', '/x/docker-compose.yml', 'up', '-d', 'a', 'b'], {
      cwd: '/x',
    });
  });

  it('adds no service args when services is empty', async () => {
    const run = vi.fn<Run>().mockResolvedValue(ok);
    await composeUp({ file: '/x/c.yml', services: [] }, run);
    expect(run.mock.calls[0]?.[1]).toEqual(['compose', '-f', '/x/c.yml', 'up', '-d']);
  });

  it('throws DockerNotRunningError when the daemon is unreachable', async () => {
    const run = vi.fn<Run>().mockResolvedValue({
      code: 1,
      stdout: '',
      stderr: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock.',
    });
    await expect(composeUp({ file: '/x/c.yml', services: [] }, run)).rejects.toBeInstanceOf(DockerNotRunningError);
  });

  it('throws an Error with stderr for any other non-zero exit', async () => {
    const run = vi.fn<Run>().mockResolvedValue({ code: 2, stdout: '', stderr: 'no such service: zzz' });
    const error = await composeUp({ file: '/x/c.yml', services: ['zzz'] }, run).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(DockerNotRunningError);
    expect((error as Error).message).toContain('no such service: zzz');
  });
});

describe('execRun', () => {
  it('resolves with the exit code and output of a failing command', async () => {
    const result = await execRun(process.execPath, ['-e', "console.error('boom'); process.exit(3)"], { cwd: process.cwd() });
    expect(result.code).toBe(3);
    expect(result.stderr).toContain('boom');
  });

  it('resolves code 0 for a command that works', async () => {
    const result = await execRun(process.execPath, ['-e', "console.log('hi')"], { cwd: process.cwd() });
    expect(result).toMatchObject({ code: 0, stdout: 'hi\n' });
  });

  it('resolves a non-zero code when the command does not exist', async () => {
    const result = await execRun('definitely-not-a-command-xyz', [], { cwd: process.cwd() });
    expect(result.code).not.toBe(0);
  });
});
