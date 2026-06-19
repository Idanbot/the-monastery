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
  '--modal-border-rgb',
  '--theme-main',
  '--theme-main-contrast',
  '--theme-secondary',
  '--theme-secondary-contrast',
  '--theme-glass-tint',
  '--theme-glass-highlight',
  '--theme-glass-edge',
  '--theme-glass-shadow',
  '--theme-glass-blur',
  '--theme-glass-saturation',
  '--theme-radius-control',
  '--theme-radius-panel',
  '--theme-motion-ease',
  '--theme-font-ui'
];

describe('theme contracts', () => {
  it('keeps theme option exports backed by contracts without clean terminal variants', () => {
    expect(visualThemeIds).toEqual(Object.keys(themeContracts));
    expect(visualThemeOptions.map((theme) => theme.id)).toEqual(visualThemeIds);
    expect(visualThemeIds).not.toContain('terminal-clean');
    expect(visualThemeIds).not.toContain('terminal-clean-white');
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

  it('allows main and secondary color overrides without changing material tokens', () => {
    const style = getThemeStyle('liquid-glass', false, true, { main: '#ff2d55', secondary: '#34c759' });

    expect(style['--theme-main']).toBe('#ff2d55');
    expect(style['--theme-accent']).toBe('#ff2d55');
    expect(style['--theme-secondary']).toBe('#34c759');
    expect(style['--theme-glass-tint']).toBe('rgb(255 255 255 / 0.58)');
  });

  it.each(visualThemeIds)('applies color overrides consistently for %s', (themeId) => {
    const style = getThemeStyle(themeId, false, true, {
      main: '#ff2d55',
      secondary: '#34c759',
      text: '#2c2c2e'
    });

    expect(style['--theme-main']).toBe('#ff2d55');
    expect(style['--theme-accent']).toBe('#ff2d55');
    expect(style['--theme-secondary']).toBe('#34c759');
    expect(style['--theme-text']).toBe('#2c2c2e');
  });

  it('marks Liquid Glass as a material-rich theme contract', () => {
    expect(themeContracts['liquid-glass'].features).toMatchObject({
      glass: true,
      materialVariants: ['control', 'panel', 'sidebar', 'modal', 'widget']
    });
  });

  it('maps modal transparency and blur to independent reusable variables', () => {
    expect(getModalEffectStyle(0, 48)['--modal-alpha']).toBe('0');
    expect(getModalEffectStyle(100, 0)['--modal-alpha']).toBe('1');
    expect(getModalEffectStyle(100, 0)['--modal-backdrop-blur']).toBe('0px');
    expect(getModalEffectStyle(100, 48)['--modal-backdrop-blur']).toBe('48px');
    expect(getModalEffectStyle(100, 48)['--modal-surface-blur']).toBe('48px');
    expect(getModalEffectStyle(35, 1)['--modal-alpha']).toBe('0.35');
    expect(getModalEffectStyle(35, 1)['--modal-surface-alpha']).toBe('0.72');
  });
});
