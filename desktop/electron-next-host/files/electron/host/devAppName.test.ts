import { describe, expect, it, vi } from 'vitest';
import { applyDevAppName, infoPlistPath, setBundleName } from './devAppName';

const PLIST = '/p/node_modules/electron/dist/Electron.app/Contents/Info.plist';

/** Fake plutil over an in-memory plist. */
function fakePlutil(initial: Record<string, string>) {
  const keys = { ...initial };
  const exec = vi.fn((_file: string, args: string[]) => {
    if (args[0] === '-extract') {
      if (!(args[1] in keys)) throw new Error('No value at that key path');
      return `${keys[args[1]]}\n`;
    }
    if (args[0] === '-replace') keys[args[1]] = args[3];
    return '';
  });
  return { keys, exec };
}

describe('infoPlistPath', () => {
  it('points at the dev Electron.app next to the electron package entry', () => {
    expect(infoPlistPath('/p/node_modules/electron/index.js')).toBe(PLIST);
  });
});

describe('setBundleName', () => {
  it('sets CFBundleName and CFBundleDisplayName when they still say Electron', () => {
    const { keys, exec } = fakePlutil({ CFBundleName: 'Electron', CFBundleDisplayName: 'Electron' });
    expect(setBundleName(PLIST, 'myapp', exec)).toBe(true);
    expect(keys).toEqual({ CFBundleName: 'myapp', CFBundleDisplayName: 'myapp' });
    expect(exec).toHaveBeenCalledWith('plutil', ['-replace', 'CFBundleName', '-string', 'myapp', PLIST]);
  });

  it('writes nothing when the names already match', () => {
    const { exec } = fakePlutil({ CFBundleName: 'myapp', CFBundleDisplayName: 'myapp' });
    expect(setBundleName(PLIST, 'myapp', exec)).toBe(false);
    expect(exec.mock.calls.some(([, args]) => args[0] === '-replace')).toBe(false);
  });

  it('adds a missing key', () => {
    const { keys, exec } = fakePlutil({ CFBundleName: 'Electron' });
    setBundleName(PLIST, 'myapp', exec);
    expect(keys.CFBundleDisplayName).toBe('myapp');
  });
});

describe('applyDevAppName', () => {
  it('only acts on macOS', () => {
    const exec = vi.fn();
    expect(applyDevAppName('linux', 'myapp', '/p/node_modules/electron/index.js', exec)).toBe('skipped');
    expect(applyDevAppName('win32', 'myapp', '/p/node_modules/electron/index.js', exec)).toBe('skipped');
    expect(exec).not.toHaveBeenCalled();
  });

  it('skips when package.json has no productName', () => {
    const exec = vi.fn();
    expect(applyDevAppName('darwin', undefined, '/p/node_modules/electron/index.js', exec)).toBe('skipped');
    expect(exec).not.toHaveBeenCalled();
  });

  it('reports set, then unchanged on the next launch', () => {
    const { exec } = fakePlutil({ CFBundleName: 'Electron', CFBundleDisplayName: 'Electron' });
    expect(applyDevAppName('darwin', 'myapp', '/p/node_modules/electron/index.js', exec)).toBe('set');
    expect(applyDevAppName('darwin', 'myapp', '/p/node_modules/electron/index.js', exec)).toBe('unchanged');
  });
});
