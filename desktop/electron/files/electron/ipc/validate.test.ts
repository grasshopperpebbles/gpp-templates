import { describe, expect, it } from 'vitest';
import { externalHttpUrl, isAllowedPathName, isAppUrl, isValidSettingsKey } from './validate';

describe('isAppUrl', () => {
  it('accepts only the dev server origin in development', () => {
    expect(isAppUrl('http://localhost:5173/', 'http://localhost:5173')).toBe(true);
    expect(isAppUrl('http://localhost:5173/settings', 'http://localhost:5173')).toBe(true);
    expect(isAppUrl('https://example.com/', 'http://localhost:5173')).toBe(false);
    expect(isAppUrl('file:///app/dist/index.html', 'http://localhost:5173')).toBe(false);
  });

  it('accepts only bundled files in production', () => {
    expect(isAppUrl('file:///Applications/App.app/dist/index.html', undefined)).toBe(true);
    expect(isAppUrl('https://example.com/', undefined)).toBe(false);
    expect(isAppUrl(undefined, undefined)).toBe(false);
  });

  it('returns false for malformed URLs instead of throwing', () => {
    expect(isAppUrl('not a url', 'http://localhost:5173')).toBe(false);
    expect(isAppUrl('not a url', undefined)).toBe(false);
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
