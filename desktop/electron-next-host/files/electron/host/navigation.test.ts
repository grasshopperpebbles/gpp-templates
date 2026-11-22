import { describe, expect, it } from 'vitest';
import { isPageUrl } from './navigation';

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
