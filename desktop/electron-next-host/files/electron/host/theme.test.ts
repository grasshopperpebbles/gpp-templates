import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_KEYS } from './theme';

describe('theme', () => {
  it('has a #rrggbb default for every key', () => {
    expect(Object.keys(DEFAULT_THEME).sort()).toEqual([...THEME_KEYS].sort());
    for (const key of THEME_KEYS) expect(DEFAULT_THEME[key]).toMatch(/^#[0-9a-f]{6}$/);
  });
});
