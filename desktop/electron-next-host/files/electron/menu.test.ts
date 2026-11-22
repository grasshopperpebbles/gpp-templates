import { describe, expect, it, vi } from 'vitest';
import { buildMenuTemplate } from './menu';

function labels(template: ReturnType<typeof buildMenuTemplate>): string[] {
  return template.flatMap((item) => {
    const sub = Array.isArray(item.submenu) ? item.submenu : [];
    return [item.label ?? '', ...sub.map((s) => s.label ?? '')];
  });
}

const actions = { openWebsite: vi.fn(), reloadPage: vi.fn(), showLogs: vi.fn() };

describe('buildMenuTemplate', () => {
  it('has Open website in browser, Reload page and Show logs', () => {
    const all = labels(buildMenuTemplate(actions, 'darwin', 'App'));
    expect(all).toEqual(expect.arrayContaining(['Open website in browser', 'Reload page', 'Show logs']));
  });

  it('wires each item to its action', () => {
    const template = buildMenuTemplate(actions, 'linux', 'App');
    const items = template.flatMap((i) => (Array.isArray(i.submenu) ? i.submenu : []));
    items.find((i) => i.label === 'Open website in browser')?.click?.(undefined as never, undefined, undefined as never);
    items.find((i) => i.label === 'Reload page')?.click?.(undefined as never, undefined, undefined as never);
    items.find((i) => i.label === 'Show logs')?.click?.(undefined as never, undefined, undefined as never);
    expect(actions.openWebsite).toHaveBeenCalledOnce();
    expect(actions.reloadPage).toHaveBeenCalledOnce();
    expect(actions.showLogs).toHaveBeenCalledOnce();
  });

  it('includes the standard edit, view and window roles', () => {
    const template = buildMenuTemplate(actions, 'darwin', 'App');
    const roles = template.flatMap((i) => [i.role, ...(Array.isArray(i.submenu) ? i.submenu.map((s) => s.role) : [])]);
    expect(roles).toEqual(expect.arrayContaining(['appMenu', 'editMenu', 'windowMenu', 'forceReload', 'toggleDevTools']));
  });

  it('has an app menu only on macOS', () => {
    expect(buildMenuTemplate(actions, 'darwin', 'App').some((i) => i.role === 'appMenu')).toBe(true);
    expect(buildMenuTemplate(actions, 'win32', 'App').some((i) => i.role === 'appMenu')).toBe(false);
  });
});
