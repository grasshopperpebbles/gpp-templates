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
    expect(() => loadHostConfig(writeConfig({ web: baseWeb, api: { corsOrigin: 'a' } }), {})).toThrow(HostConfigError);
  });
});
