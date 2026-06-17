import { describe, expect, it } from 'vitest';
import {
  getModalEffectStyle,
  getThemeStyle,
  themeContracts,
  visualThemeIds,
  visualThemeOptions
} from './themes';

const requiredStyleVariables = [
  '--motion-duration',
  '--theme-bg-color',
  '--theme-bg',
  '--theme-surface',
  '--theme-muted-surface',
  '--theme-text',
  '--theme-muted-text',
  '--theme-border',
  '--theme-accent',
  '--theme-accent-contrast',
  '--modal-surface-rgb',
  '--modal-border-rgb'
];

describe('theme contracts', () => {
  it('keeps theme option exports backed by contracts', () => {
    expect(visualThemeIds).toEqual(Object.keys(themeContracts));
    expect(visualThemeOptions.map((theme) => theme.id)).toEqual(visualThemeIds);
  });

  it('provides all required style variables for every theme', () => {
    for (const themeId of visualThemeIds) {
      const style = getThemeStyle(themeId, false, true);
      for (const variable of requiredStyleVariables) {
        expect(style, `${themeId} missing ${variable}`).toHaveProperty(variable);
        expect(String(style[variable])).not.toHaveLength(0);
      }
    }
  });

  it('uses dark default tokens and preserves custom terminal motion rules', () => {
    expect(getThemeStyle('default', true, true)['--theme-bg-color']).toBe('rgb(2 6 23)');
    expect(getThemeStyle('terminal', true, true)['--motion-duration']).toBe('0ms');
    expect(getThemeStyle('zen', false, false)['--motion-duration']).toBe('0ms');
  });

  it('maps modal transparency to reusable alpha and blur variables', () => {
    expect(getModalEffectStyle(0)['--modal-alpha']).toBe('0');
    expect(getModalEffectStyle(100)['--modal-alpha']).toBe('1');
    expect(getModalEffectStyle(100)['--modal-backdrop-blur']).toBe('32px');
    expect(getModalEffectStyle(100)['--modal-surface-blur']).toBe('32px');
  });
});
