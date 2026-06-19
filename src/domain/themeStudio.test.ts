import { describe, expect, it } from 'vitest';
import { defaultSettings } from './tasks';
import { createThemeCss, createThemeRecipe, parseThemeRecipe } from './themeStudio';

describe('themeStudio', () => {
  it('exports a liquid glass recipe and css tokens', () => {
    const recipe = createThemeRecipe({
      ...defaultSettings,
      customThemeName: 'Ocean Glass',
      colorScheme: { main: '#007aff', secondary: '#34c759', text: '#111111' },
      modalTransparency: 35,
      modalBlur: 1
    });

    expect(recipe).toMatchObject({ base: 'liquid-glass', name: 'Ocean Glass' });
    expect(createThemeCss(recipe)).toContain('--theme-main: #007aff');
    expect(parseThemeRecipe(recipe)).toEqual(recipe);
  });

  it('rejects invalid custom theme recipes', () => {
    expect(() =>
      parseThemeRecipe({
        schemaVersion: 1,
        base: 'liquid-glass',
        name: 'Bad Glass',
        colors: { main: 'blue', secondary: '#34c759', text: '#111111' },
        modal: { transparency: 120, blur: 1 }
      })
    ).toThrow();
  });
});
