import { describe, expect, it } from 'vitest';
import { cssVars } from './cssVars';

describe('cssVars', () => {
  it('returns a style object that preserves CSS custom properties', () => {
    const style = cssVars({ '--kanban-grid-template': '1fr 2fr', '--gap': 4 });
    expect(style).toEqual({ '--kanban-grid-template': '1fr 2fr', '--gap': 4 });
  });

  it('drops undefined values so React does not render them', () => {
    const style = cssVars({ '--keep': '1fr', '--drop': undefined });
    expect(style).toEqual({ '--keep': '1fr' });
  });

  it('can be spread alongside regular CSS properties', () => {
    const style = { color: 'red', ...cssVars({ '--accent': 'blue' }) };
    expect(style).toMatchObject({ color: 'red', '--accent': 'blue' });
  });
});
