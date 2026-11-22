import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, type HostTheme } from '../host/theme';

// startup.css variable for each host.config.json theme key (startup.js sets them from the query)
const CSS_VARS: Record<string, keyof HostTheme> = {
  '--background': 'background',
  '--panel': 'panel',
  '--text': 'text',
  '--muted': 'muted',
  '--accent': 'accent',
  '--accent-text': 'accentText',
  '--error': 'error',
};

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

  it('defaults to the console colours; Retry uses the accent fill and accent text', () => {
    const css = read('./startup.css').toLowerCase();
    for (const [name, colour] of Object.entries(CSS_VARS)) {
      expect(css).toContain(`${name}: ${DEFAULT_THEME[colour]}`);
    }
    expect(css).toMatch(/\.retry\s*{[^}]*background:\s*var\(--accent\)[^}]*color:\s*var\(--accent-text\)/);
  });

  it('shows the output tail in a monospace block', () => {
    expect(html).toContain('id="problem-tail"');
    expect(read('./startup.css')).toMatch(/\.problem-tail\s*{[^}]*ui-monospace/);
  });
});

describe('startup page script', () => {
  type El = {
    hidden: boolean;
    textContent: string;
    className: string;
    dataset: Record<string, string>;
    children: El[];
    listeners: Record<string, () => void>;
    append(...kids: El[]): void;
    addEventListener(type: string, fn: () => void): void;
    querySelector(sel: string): El | null;
    remove(): void;
    parent?: El;
  };
  const el = (): El => ({
    hidden: false,
    textContent: '',
    className: '',
    dataset: {},
    children: [],
    listeners: {},
    append(...kids) {
      for (const k of kids) {
        k.parent = this;
        this.children.push(k);
      }
    },
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
    querySelector(sel) {
      return this.children.find((c) => `.${c.className}` === sel) ?? null;
    },
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    },
  });

  function load(search = '') {
    const ids = ['steps', 'title', 'problem', 'problem-text', 'problem-tail', 'retry', 'continue'];
    const els = Object.fromEntries(ids.map((id) => [id, el()]));
    let onStartup: (e: unknown) => void = () => undefined;
    const calls: string[] = [];
    const vars: Record<string, string> = {};
    const window = {
      location: { search },
      electronAPI: {
        host: {
          onStartup: (cb: (e: unknown) => void) => (onStartup = cb),
          retry: () => calls.push('retry'),
          continueAnyway: () => calls.push('continue'),
        },
      },
    };
    const document = {
      getElementById: (id: string) => els[id],
      createElement: () => el(),
      documentElement: { style: { setProperty: (name: string, value: string) => (vars[name] = value) } },
    };
    new Function('document', 'window', read('./startup.js'))(document, window);
    return { els, send: onStartup, calls, vars };
  }

  it('a CORS warning keeps the page up with the message, Continue anyway and Retry', () => {
    const { els, send, calls } = load();
    send({ step: 'web' });
    send({ step: 'cors', error: "The API at http://localhost:8880 doesn't allow http://localhost:3010." });
    expect(els['problem']?.hidden).toBe(false);
    expect(els['problem-text']?.textContent).toContain("doesn't allow http://localhost:3010");
    expect(els['continue']?.hidden).toBe(false);
    els['continue']?.listeners['click']?.();
    expect(calls).toEqual(['continue']);
    expect(els['problem']?.hidden).toBe(true);
  });

  it('a failed step hides Continue anyway', () => {
    const { els, send } = load();
    send({ step: 'cors', error: 'warn' });
    send({ step: 'port', error: 'Port 3010 is in use.' });
    expect(els['continue']?.hidden).toBe(true);
    expect(els['problem-text']?.textContent).toContain('Port 3010');
  });

  it('tells the user website-port links need Open website in browser', () => {
    expect(read('./startup.html')).toContain('Open website in browser');
  });

  it('sets the theme colours from the page query and ignores anything that is not #rrggbb', () => {
    const { vars } = load('?background=%23081a3a&accentText=%230047ab&panel=red&other=%23000000');
    expect(vars).toEqual({ '--background': '#081a3a', '--accent-text': '#0047ab' });
  });

  it('every theme key maps to a startup.css variable', () => {
    expect(Object.values(CSS_VARS).sort()).toEqual(Object.keys(DEFAULT_THEME).sort());
  });
});
