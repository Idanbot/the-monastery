import { z } from 'zod';
import type { AppSettings } from './types';

export type ThemeRecipe = {
  schemaVersion: 1;
  base: 'liquid-glass';
  name: string;
  colors: { main: string; secondary: string; text: string };
  modal: { transparency: number; blur: number };
};

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const themeRecipeSchema = z.object({
  schemaVersion: z.literal(1),
  base: z.literal('liquid-glass'),
  name: z.string().trim().min(1).max(80),
  colors: z.object({
    main: hexColorSchema,
    secondary: hexColorSchema,
    text: hexColorSchema
  }),
  modal: z.object({
    transparency: z.number().min(0).max(80),
    blur: z.number().min(0).max(40)
  })
});

export const createThemeRecipe = (settings: AppSettings): ThemeRecipe => ({
  schemaVersion: 1,
  base: 'liquid-glass',
  name: settings.customThemeName?.trim() || 'Custom Liquid Glass',
  colors: {
    main: settings.colorScheme?.main || '#007aff',
    secondary: settings.colorScheme?.secondary || '#af52de',
    text: settings.colorScheme?.text || '#152033'
  },
  modal: {
    transparency: settings.modalTransparency,
    blur: settings.modalBlur
  }
});

export const parseThemeRecipe = (value: unknown): ThemeRecipe => themeRecipeSchema.parse(value);

export const createThemeCss = (recipe: ThemeRecipe) => {
  const parsed = parseThemeRecipe(recipe);

  return [
    ':root {',
    '  --theme-main: ' + parsed.colors.main + ';',
    '  --theme-secondary: ' + parsed.colors.secondary + ';',
    '  --theme-text: ' + parsed.colors.text + ';',
    '  --modal-alpha: ' + (parsed.modal.transparency / 100).toFixed(2) + ';',
    '  --modal-backdrop-blur: ' + parsed.modal.blur + 'px;',
    '}'
  ].join('\n');
};
