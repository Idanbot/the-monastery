import type { VisualTheme } from './types';
import { themeContracts, visualThemeOptions } from './themes';

export type ThemeChoiceGroup = 'system' | 'light' | 'dark' | 'terminal';

export type ThemeChoiceOption = {
  value: string;
  label: string;
  theme: 'system' | 'light' | 'dark';
  group: ThemeChoiceGroup;
  visualTheme: VisualTheme;
};

export const getThemeChoiceGroup = (visualTheme: VisualTheme): ThemeChoiceGroup => {
  if (['zen', 'liquid-glass', 'github-light'].includes(visualTheme)) return 'light';
  if (['terminal', 'terminal-white'].includes(visualTheme)) return 'terminal';
  return 'dark';
};

export const themeChoiceOptions: ThemeChoiceOption[] = [
  {
    value: 'system:default',
    label: 'System Default',
    theme: 'system',
    group: 'system',
    visualTheme: 'default'
  },
  { value: 'light:default', label: 'Light', theme: 'light', group: 'light', visualTheme: 'default' },
  { value: 'dark:default', label: 'Dark', theme: 'dark', group: 'dark', visualTheme: 'default' },
  ...visualThemeOptions
    .filter((theme) => theme.id !== 'default')
    .map((theme) => {
      const group = getThemeChoiceGroup(theme.id);
      const themeMode: 'light' | 'dark' =
        themeContracts[theme.id]?.preferredMode === 'dark' ? 'dark' : 'light';
      return {
        value: `theme:${theme.id}`,
        label: theme.label,
        theme: themeMode,
        group,
        visualTheme: theme.id
      };
    })
];

export const resolveThemeGalleryTokens = (visualTheme: VisualTheme, group: ThemeChoiceGroup) => {
  const contract = themeContracts[visualTheme] || themeContracts.default;
  const lightTokens = contract.tokens.light;
  const darkTokens = contract.tokens.dark || contract.tokens.light;
  const tokens = group === 'dark' || group === 'terminal' ? darkTokens : lightTokens;
  const isSystem = group === 'system';

  return {
    swatchStart: isSystem ? lightTokens.bg : tokens.bg,
    swatchEnd: isSystem ? darkTokens.bg : tokens.accent,
    labelBackground: tokens.bgColor || tokens.bg,
    labelText: tokens.text,
    hasGlass: Boolean(contract.features?.glass)
  };
};
