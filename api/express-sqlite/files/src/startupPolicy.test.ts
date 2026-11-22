import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { bindHost, corsOrigin } from './startupPolicy.js';

const source = (name: string): string => readFileSync(join(dirname(fileURLToPath(import.meta.url)), name), 'utf8');

describe('bindHost', () => {
  it('binds the packaged HOST and leaves development unset', () => {
    expect(bindHost('127.0.0.1')).toBe('127.0.0.1');
    expect(bindHost(undefined)).toBeUndefined();
    expect(bindHost('  ')).toBeUndefined();
  });

  it('is what the server passes to listen', () => {
    const server = source('server.ts');
    expect(server).toContain('bindHost(process.env.HOST)');
    expect(server).toMatch(/HOST \? app\.listen\(PORT, HOST/);
  });
});

describe('corsOrigin', () => {
  it('allows every origin outside production', () => {
    expect(corsOrigin('development', undefined)).toBe('*');
    expect(corsOrigin(undefined, 'app://bundle')).toBe('*');
  });

  it('uses the production list and never falls open when it is missing', () => {
    expect(corsOrigin('production', 'app://bundle')).toEqual(['app://bundle']);
    expect(corsOrigin('production', 'http://localhost:5180, app://bundle')).toEqual([
      'http://localhost:5180',
      'app://bundle',
    ]);
    expect(corsOrigin('production', undefined)).toEqual([]);
    expect(corsOrigin('production', '  ,  ')).toEqual([]);
  });

  it('is what the app passes to CORS', () => {
    expect(source('app.ts')).toContain('corsOrigin(process.env.NODE_ENV, process.env.CORS_ORIGINS)');
  });
});
