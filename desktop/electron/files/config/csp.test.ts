import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from './csp';

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
