import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, insecureApiUrlWarning } from './csp';

const BASE = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:";

describe('buildContentSecurityPolicy', () => {
  it('keeps the base policy when no API URL is set', () => {
    expect(buildContentSecurityPolicy()).toBe(BASE);
    expect(buildContentSecurityPolicy('')).toBe(BASE);
    expect(buildContentSecurityPolicy('   ')).toBe(BASE);
  });

  it("adds the API origin (not its path) to connect-src", () => {
    expect(buildContentSecurityPolicy('http://localhost:8000/api/v1')).toBe(
      `${BASE}; connect-src 'self' http://localhost:8000`,
    );
    expect(buildContentSecurityPolicy('https://api.example.com/v1/')).toBe(
      `${BASE}; connect-src 'self' https://api.example.com`,
    );
  });

  it('rejects a relative or non-http URL', () => {
    expect(() => buildContentSecurityPolicy('/api/v1')).toThrow(/absolute URL/);
    expect(() => buildContentSecurityPolicy('file:///tmp/x')).toThrow(/http\(s\)/);
  });
});

describe('insecureApiUrlWarning', () => {
  it('says nothing for no URL, https, or plain http on this machine', () => {
    expect(insecureApiUrlWarning()).toBeUndefined();
    expect(insecureApiUrlWarning('')).toBeUndefined();
    expect(insecureApiUrlWarning('https://api.example.com/v1')).toBeUndefined();
    expect(insecureApiUrlWarning('http://localhost:8000/api/v1')).toBeUndefined();
    expect(insecureApiUrlWarning('http://127.0.0.1:8000')).toBeUndefined();
    expect(insecureApiUrlWarning('http://[::1]:8000')).toBeUndefined();
  });

  it('warns (without blocking) for plain http to another host', () => {
    const warning = insecureApiUrlWarning('http://api.example.com/v1');
    expect(warning).toMatch(/http:\/\/api\.example\.com/);
    expect(warning).toMatch(/https/);
    expect(buildContentSecurityPolicy('http://api.example.com/v1')).toBe(
      `${BASE}; connect-src 'self' http://api.example.com`,
    );
  });

  it('leaves invalid URLs to buildContentSecurityPolicy', () => {
    expect(insecureApiUrlWarning('/api/v1')).toBeUndefined();
  });
});
