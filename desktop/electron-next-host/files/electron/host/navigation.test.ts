import { describe, expect, it } from 'vitest';
import { isPageUrl, navigationAction, windowOpenTarget } from './navigation';

describe('isPageUrl', () => {
  it('is true for http://localhost:<port>/…', () => {
    expect(isPageUrl('http://localhost:3010/gifts', 3010)).toBe(true);
    expect(isPageUrl('http://localhost:3010', 3010)).toBe(true);
    expect(isPageUrl('http://localhost:3010/a?b=1#c', 3010)).toBe(true);
  });

  it('is false for another port, host, scheme, or a missing or malformed URL', () => {
    expect(isPageUrl('http://localhost:3000/', 3010)).toBe(false);
    expect(isPageUrl('http://127.0.0.1:3010/', 3010)).toBe(false);
    expect(isPageUrl('https://localhost:3010/', 3010)).toBe(false);
    expect(isPageUrl('http://localhost:3010.evil.com/', 3010)).toBe(false);
    expect(isPageUrl('http://localhost@evil.com:3010/', 3010)).toBe(false);
    expect(isPageUrl('file:///x', 3010)).toBe(false);
    expect(isPageUrl(undefined, 3010)).toBe(false);
    expect(isPageUrl('not a url', 3010)).toBe(false);
  });
});

describe('navigationAction', () => {
  const pagesDir = '/app/electron/pages';

  it('allows the hosted app and the startup page', () => {
    expect(navigationAction('http://localhost:3010/login', 3010, pagesDir)).toBe('allow');
    expect(navigationAction('file:///app/electron/pages/startup.html', 3010, pagesDir)).toBe('allow');
  });

  it('sends other http(s) origins to the system browser, including the website port and redirects', () => {
    expect(navigationAction('https://checkout.example.com/pay?x=1', 3010, pagesDir)).toEqual({
      external: 'https://checkout.example.com/pay?x=1',
    });
    expect(navigationAction('http://localhost:3000/', 3010, pagesDir)).toEqual({ external: 'http://localhost:3000/' });
  });

  it('drops everything that is not http(s) or an allowed page', () => {
    expect(navigationAction('file:///etc/passwd', 3010, pagesDir)).toBe('block');
    expect(navigationAction('javascript:alert(1)', 3010, pagesDir)).toBe('block');
    expect(navigationAction('myapp://x', 3010, pagesDir)).toBe('block');
    expect(navigationAction('not a url', 3010, pagesDir)).toBe('block');
  });
});

describe('windowOpenTarget', () => {
  it('returns http(s) URLs and null for anything else', () => {
    expect(windowOpenTarget('https://a.example/x')).toBe('https://a.example/x');
    expect(windowOpenTarget('file:///x')).toBeNull();
  });
});
