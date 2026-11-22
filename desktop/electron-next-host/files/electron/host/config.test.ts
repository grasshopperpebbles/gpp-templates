import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HostConfigError, loadHostConfig } from './config';

const baseWeb = { path: '../web', port: 3010, portEnv: 'X_PORT', websitePort: 3000, distDir: '.next-desktop' };

function writeConfig(config: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'host-config-'));
  const workspace = join(dir, 'desktop');
  mkdirSync(workspace);
  const file = join(workspace, 'host.config.json');
  writeFileSync(file, JSON.stringify(config));
  return file;
}

describe('loadHostConfig', () => {
  it("resolves web.path and compose.file against the config file's folder", () => {
    const file = writeConfig({ web: baseWeb, compose: { file: '../docker-compose.yml', services: ['db'] }, api: null });
    const config = loadHostConfig(file, {});
    const workspace = join(file, '..');
    expect(config.web.path).toBe(join(workspace, '..', 'web'));
    expect(config.compose?.file).toBe(join(workspace, '..', 'docker-compose.yml'));
    expect(config.compose?.services).toEqual(['db']);
  });

  it('env[portEnv] overrides web.port', () => {
    const file = writeConfig({ web: baseWeb, compose: null, api: null });
    expect(loadHostConfig(file, { X_PORT: '3020' }).web.port).toBe(3020);
    expect(loadHostConfig(file, {}).web.port).toBe(3010);
  });

  it('rejects a non-integer port override', () => {
    const file = writeConfig({ web: baseWeb, compose: null, api: null });
    expect(() => loadHostConfig(file, { X_PORT: 'abc' })).toThrow(HostConfigError);
    expect(() => loadHostConfig(file, { X_PORT: 'abc' })).toThrow(/X_PORT/);
    expect(() => loadHostConfig(file, { X_PORT: '70000' })).toThrow(/X_PORT/);
  });

  it('fills defaults', () => {
    const file = writeConfig({ web: baseWeb, compose: null, api: null });
    const { web } = loadHostConfig(file, {});
    expect(web.readyTimeoutMs).toBe(120000);
    expect(web.stopGraceMs).toBe(5000);
    expect(web.corsTimeoutMs).toBe(5000);
  });

  it('keeps explicit timeouts and a null compose/api', () => {
    const file = writeConfig({ web: { ...baseWeb, readyTimeoutMs: 1000, stopGraceMs: 10, corsTimeoutMs: 250 } });
    const config = loadHostConfig(file, {});
    expect(config.web.readyTimeoutMs).toBe(1000);
    expect(config.web.stopGraceMs).toBe(10);
    expect(config.web.corsTimeoutMs).toBe(250);
    expect(config.compose).toBeNull();
    expect(config.api).toBeNull();
  });

  it('rejects a missing web block', () => {
    const file = writeConfig({ compose: null, api: null });
    expect(() => loadHostConfig(file, {})).toThrow(HostConfigError);
  });

  it('rejects a file that is not valid JSON or is missing', () => {
    const file = writeConfig({});
    writeFileSync(file, '{nope');
    expect(() => loadHostConfig(file, {})).toThrow(HostConfigError);
    expect(() => loadHostConfig(join(file, '..', 'missing.json'), {})).toThrow(HostConfigError);
  });

  it('rejects an invalid port in the file and an api block without a url', () => {
    expect(() => loadHostConfig(writeConfig({ web: { ...baseWeb, port: 'x' } }), {})).toThrow(HostConfigError);
    expect(() => loadHostConfig(writeConfig({ web: baseWeb, api: {} }), {})).toThrow(HostConfigError);
  });

  it('api.corsOrigin follows the effective web port', () => {
    const file = writeConfig({ web: baseWeb, api: { url: 'http://localhost:8880' } });
    expect(loadHostConfig(file, {}).api?.corsOrigin).toBe('http://localhost:3010');
    expect(loadHostConfig(file, { X_PORT: '3020' }).api?.corsOrigin).toBe('http://localhost:3020');
  });

  it('reads the port override from the project root .env when the process env has none', () => {
    const file = writeConfig({ web: baseWeb, compose: { file: '../docker-compose.yml' }, api: null });
    const root = join(file, '..', '..');
    const seen: string[] = [];
    const read = (f: string) => {
      seen.push(f);
      return { X_PORT: '3030' };
    };
    expect(loadHostConfig(file, {}, read).web.port).toBe(3030);
    expect(seen).toEqual([join(root, '.env')]);
  });

  it('the process env wins over the .env file', () => {
    const file = writeConfig({ web: baseWeb, compose: { file: '../docker-compose.yml' } });
    expect(loadHostConfig(file, { X_PORT: '3020' }, () => ({ X_PORT: '3030' })).web.port).toBe(3020);
  });

  it('uses projectRoot for the .env when given, and reads a real .env file', () => {
    const file = writeConfig({ web: baseWeb, projectRoot: '../root' });
    const root = join(file, '..', '..', 'root');
    mkdirSync(root);
    writeFileSync(join(root, '.env'), 'X_PORT=3040\n');
    expect(loadHostConfig(file, {}).web.port).toBe(3040);
  });

  it('rejects a bad port in the .env file', () => {
    const file = writeConfig({ web: baseWeb, compose: { file: '../c.yml' } });
    expect(() => loadHostConfig(file, {}, () => ({ X_PORT: 'zzz' }))).toThrow(/X_PORT/);
  });

  it('reads no .env when there is neither projectRoot nor compose', () => {
    const file = writeConfig({ web: baseWeb });
    expect(loadHostConfig(file, {}, () => { throw new Error('should not read'); }).web.port).toBe(3010);
  });

  it('compose.waitTimeoutMs defaults to 120000 and must be positive', () => {
    const ok = writeConfig({ web: baseWeb, compose: { file: '../c.yml' } });
    expect(loadHostConfig(ok, {}, () => ({})).compose?.waitTimeoutMs).toBe(120000);
    const set = writeConfig({ web: baseWeb, compose: { file: '../c.yml', waitTimeoutMs: 9000 } });
    expect(loadHostConfig(set, {}, () => ({})).compose?.waitTimeoutMs).toBe(9000);
    const bad = writeConfig({ web: baseWeb, compose: { file: '../c.yml', waitTimeoutMs: 0 } });
    expect(() => loadHostConfig(bad, {}, () => ({}))).toThrow(/waitTimeoutMs/);
  });

  it('rejects zero timeouts (an instant timeout or SIGKILL is never intended)', () => {
    for (const key of ['readyTimeoutMs', 'stopGraceMs', 'corsTimeoutMs']) {
      const file = writeConfig({ web: { ...baseWeb, [key]: 0 } });
      expect(() => loadHostConfig(file, {}, () => ({}))).toThrow(new RegExp(key));
    }
  });
});
