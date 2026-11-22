import { describe, expect, it } from 'vitest';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { externalHttpUrl, isAllowedPathName, isStartupUrl, isValidSettingsKey } from './validate';

describe('isStartupUrl', () => {
  const pages = resolve('/opt/app/electron/pages');

  it('accepts file URLs for files inside the pages folder', () => {
    expect(isStartupUrl(pathToFileURL(join(pages, 'startup.html')).href, pages)).toBe(true);
    expect(isStartupUrl(`${pathToFileURL(join(pages, 'startup.html')).href}?x=1#y`, pages)).toBe(true);
  });

  it('refuses files outside the pages folder, the folder itself, and other schemes', () => {
    expect(isStartupUrl(pathToFileURL(resolve('/opt/app/electron/main.js')).href, pages)).toBe(false);
    expect(isStartupUrl(pathToFileURL(resolve('/opt/app/electron/pages-evil/x.html')).href, pages)).toBe(false);
    expect(isStartupUrl(pathToFileURL(pages).href, pages)).toBe(false);
    expect(isStartupUrl('file:///opt/app/electron/pages/../main.js', pages)).toBe(false);
    expect(isStartupUrl('http://localhost:3010/startup.html', pages)).toBe(false);
    expect(isStartupUrl('app://bundle/startup.html', pages)).toBe(false);
  });

  it('refuses missing and malformed URLs', () => {
    expect(isStartupUrl(undefined, pages)).toBe(false);
    expect(isStartupUrl('not a url', pages)).toBe(false);
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
