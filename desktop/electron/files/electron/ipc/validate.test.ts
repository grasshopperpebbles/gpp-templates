import { describe, expect, it } from 'vitest';
import { join, resolve } from 'node:path';
import {
  APP_ORIGIN,
  externalHttpUrl,
  isAllowedPathName,
  isAppUrl,
  isValidSettingsKey,
  resolveAppFile,
} from './validate';

describe('isAppUrl', () => {
  it('accepts only the dev server origin in development', () => {
    expect(isAppUrl('http://localhost:5180/', 'http://localhost:5180')).toBe(true);
    expect(isAppUrl('http://localhost:5180/settings', 'http://localhost:5180')).toBe(true);
    expect(isAppUrl('https://example.com/', 'http://localhost:5180')).toBe(false);
    expect(isAppUrl('file:///app/dist/index.html', 'http://localhost:5180')).toBe(false);
    expect(isAppUrl('app://bundle/index.html', 'http://localhost:5180')).toBe(false);
  });

  it('accepts only app://bundle/ in production', () => {
    expect(APP_ORIGIN).toBe('app://bundle');
    expect(isAppUrl('app://bundle/index.html', undefined)).toBe(true);
    expect(isAppUrl('app://bundle/', undefined)).toBe(true);
    expect(isAppUrl('app://other/index.html', undefined)).toBe(false);
    expect(isAppUrl('file:///Applications/App.app/dist/index.html', undefined)).toBe(false);
    expect(isAppUrl('https://example.com/', undefined)).toBe(false);
    expect(isAppUrl(undefined, undefined)).toBe(false);
  });

  it('returns false for malformed URLs instead of throwing', () => {
    expect(isAppUrl('not a url', 'http://localhost:5180')).toBe(false);
    expect(isAppUrl('not a url', undefined)).toBe(false);
  });
});

describe('resolveAppFile', () => {
  const root = resolve('/opt/app/dist');

  it('maps app://bundle/ paths to files under the root', () => {
    expect(resolveAppFile(root, 'app://bundle/')).toBe(join(root, 'index.html'));
    expect(resolveAppFile(root, 'app://bundle/index.html')).toBe(join(root, 'index.html'));
    expect(resolveAppFile(root, 'app://bundle/assets/index-abc.js?v=1#x')).toBe(join(root, 'assets', 'index-abc.js'));
    expect(resolveAppFile(root, 'app://bundle/my%20file.txt')).toBe(join(root, 'my file.txt'));
  });

  it('refuses other schemes and hosts', () => {
    expect(resolveAppFile(root, 'file:///etc/passwd')).toBeNull();
    expect(resolveAppFile(root, 'app://other/index.html')).toBeNull();
    expect(resolveAppFile(root, 'not a url')).toBeNull();
  });

  it('refuses paths that escape the root', () => {
    expect(resolveAppFile(root, 'app://bundle/../../etc/passwd')).toBe(join(root, 'etc', 'passwd'));
    expect(resolveAppFile(root, 'app://bundle/%2e%2e/%2e%2e/etc/passwd')).toBe(join(root, 'etc', 'passwd'));
    expect(resolveAppFile(root, 'app://bundle/..%2f..%2fetc%2fpasswd')).toBeNull();
    expect(resolveAppFile(root, 'app://bundle/assets/..%2f..%2f..%2fsecret')).toBeNull();
    expect(resolveAppFile(root, 'app://bundle/a%00b')).toBeNull();
    expect(resolveAppFile(root, 'app://bundle/%E0%A4%A')).toBeNull();
  });
});

describe('externalHttpUrl', () => {
  it('passes http(s) links and refuses other schemes', () => {
    expect(externalHttpUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(externalHttpUrl('file:///etc/passwd')).toBeNull();
    expect(externalHttpUrl('javascript:alert(1)')).toBeNull();
    expect(externalHttpUrl('nope')).toBeNull();
  });
});

describe('isAllowedPathName', () => {
  it('allows listed user folders and rejects the rest', () => {
    expect(isAllowedPathName('documents')).toBe(true);
    expect(isAllowedPathName('userData')).toBe(false);
    expect(isAllowedPathName(42)).toBe(false);
  });
});

describe('isValidSettingsKey', () => {
  it('accepts dot paths and rejects empty or odd keys', () => {
    expect(isValidSettingsKey('theme')).toBe(true);
    expect(isValidSettingsKey('editor.fontSize')).toBe(true);
    expect(isValidSettingsKey('')).toBe(false);
    expect(isValidSettingsKey('a..b')).toBe(false);
    expect(isValidSettingsKey('__proto__.x')).toBe(false);
    expect(isValidSettingsKey('a.constructor')).toBe(false);
    expect(isValidSettingsKey(undefined)).toBe(false);
  });
});
