import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');

describe('startup page', () => {
  const html = read('./startup.html');

  it("has the CSP meta default-src 'self' and no inline script or style", () => {
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'" />`);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [, attrs, body] of scripts) {
      expect(attrs).toMatch(/\bsrc="/);
      expect(body?.trim()).toBe('');
    }
    expect(html).not.toMatch(/<style\b/);
    expect(html).not.toMatch(/\son[a-z]+=/i);
    expect(html).not.toMatch(/\sstyle=/i);
  });

  it('uses the console colours and a Sapphire Retry button with white text', () => {
    const css = read('./startup.css').toLowerCase();
    for (const colour of ['#171b21', '#1e242c', '#ece6d8', '#9aa1a8', '#0f52ba', '#f5777b']) {
      expect(css).toContain(colour);
    }
    expect(css).toMatch(/\.retry\s*{[^}]*background:\s*var\(--sapphire\)[^}]*color:\s*#ffffff/);
  });

  it('shows the output tail in a monospace block', () => {
    expect(html).toContain('id="problem-tail"');
    expect(read('./startup.css')).toMatch(/\.problem-tail\s*{[^}]*ui-monospace/);
  });
});
