import { describe, expect, it, vi } from 'vitest';
import { guarded } from './ipcGuard';

describe('guarded', () => {
  it('runs the handler with its arguments when the sender is allowed', () => {
    const handler = vi.fn((_e: unknown, a: number) => a * 2);
    const run = guarded((url) => url === 'http://localhost:3010/', handler);
    expect(run({ senderFrame: { url: 'http://localhost:3010/' } }, 4)).toBe(8);
  });

  it('throws Untrusted sender, without calling the handler, for any other or missing frame', () => {
    const handler = vi.fn();
    const run = guarded((url) => url === 'http://localhost:3010/', handler);
    expect(() => run({ senderFrame: { url: 'https://evil.example/' } })).toThrow('Untrusted sender');
    expect(() => run({ senderFrame: null })).toThrow('Untrusted sender');
    expect(() => run({})).toThrow('Untrusted sender');
    expect(handler).not.toHaveBeenCalled();
  });
});
