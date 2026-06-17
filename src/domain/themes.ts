import type { CSSProperties } from 'react';
import type { VisualTheme } from './types';

type ThemeTokens = {
  bgColor: string;
  bg: string;
  surface: string;
  mutedSurface: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentContrast: string;
  modalSurfaceRgb: string;
  modalBorderRgb: string;
  motionDuration: string;
};

export type ThemeContract = {
  id: VisualTheme;
  label: string;
  preferredMode: 'light' | 'dark' | 'system';
  tokens: {
    light: ThemeTokens;
    dark?: ThemeTokens;
  };
  features?: {
    glass?: boolean;
    terminal?: boolean;
    minimalBorders?: boolean;
  };
};

const defaultLight: ThemeTokens = {
  bgColor: 'rgb(241 245 249)',
  bg: 'rgb(241 245 249)',
  surface: 'rgb(255 255 255)',
  mutedSurface: 'rgb(248 250 252)',
  text: 'rgb(30 41 59)',
  mutedText: 'rgb(100 116 139)',
  border: 'rgb(226 232 240)',
  accent: 'rgb(79 70 229)',
  accentContrast: 'rgb(255 255 255)',
  modalSurfaceRgb: '255 255 255',
  modalBorderRgb: '226 232 240',
  motionDuration: '80ms'
};

const defaultDark: ThemeTokens = {
  bgColor: 'rgb(2 6 23)',
  bg: 'rgb(2 6 23)',
  surface: 'rgb(15 23 42)',
  mutedSurface: 'rgb(30 41 59)',
  text: 'rgb(226 232 240)',
  mutedText: 'rgb(148 163 184)',
  border: 'rgb(51 65 85)',
  accent: 'rgb(129 140 248)',
  accentContrast: 'rgb(15 23 42)',
  modalSurfaceRgb: '15 23 42',
  modalBorderRgb: '51 65 85',
  motionDuration: '80ms'
};

export const themeContracts: Record<VisualTheme, ThemeContract> = {
  default: {
    id: 'default',
    label: 'Default',
    preferredMode: 'system',
    tokens: { light: defaultLight, dark: defaultDark }
  },
  zen: {
    id: 'zen',
    label: 'Zen',
    preferredMode: 'light',
    tokens: {
      light: {
        bgColor: '#eef1ea',
        bg: '#eef1ea',
        surface: '#fbfaf5',
        mutedSurface: '#f3f3ec',
        text: '#26312a',
        mutedText: '#6d756e',
        border: '#d9ddcf',
        accent: '#5e7c67',
        accentContrast: '#ffffff',
        modalSurfaceRgb: '251 250 245',
        modalBorderRgb: '217 221 207',
        motionDuration: '80ms'
      }
    }
  },
  'tokyo-night': {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#16161e',
        bg: '#16161e',
        surface: '#1f2335',
        mutedSurface: '#24283b',
        text: '#c0caf5',
        mutedText: '#7f89b5',
        border: '#3b4261',
        accent: '#7aa2f7',
        accentContrast: '#111827',
        modalSurfaceRgb: '31 35 53',
        modalBorderRgb: '59 66 97',
        motionDuration: '80ms'
      }
    }
  },
  'liquid-glass': {
    id: 'liquid-glass',
    label: 'Liquid Glass',
    preferredMode: 'light',
    features: { glass: true },
    tokens: {
      light: {
        bgColor: '#edf4ff',
        bg: `radial-gradient(circle at 14% 8%, rgb(255 255 255 / 0.92), transparent 24%),
radial-gradient(circle at 78% 0%, rgb(198 221 255 / 0.76), transparent 28%),
radial-gradient(circle at 100% 80%, rgb(244 215 255 / 0.52), transparent 32%),
linear-gradient(135deg, #f8fbff 0%, #edf4ff 42%, #ffffff 100%)`,
        surface: 'rgb(255 255 255 / 0.46)',
        mutedSurface: 'rgb(255 255 255 / 0.26)',
        text: '#152033',
        mutedText: '#66758e',
        border: 'rgb(255 255 255 / 0.78)',
        accent: '#6f88b7',
        accentContrast: '#ffffff',
        modalSurfaceRgb: '255 255 255',
        modalBorderRgb: '255 255 255',
        motionDuration: '90ms'
      }
    }
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    preferredMode: 'dark',
    features: { terminal: true },
    tokens: {
      light: {
        bgColor: '#000000',
        bg: '#000000',
        surface: '#020402',
        mutedSurface: '#030803',
        text: '#7cff8a',
        mutedText: '#45b556',
        border: '#0b2411',
        accent: '#7cff8a',
        accentContrast: '#000000',
        modalSurfaceRgb: '2 4 2',
        modalBorderRgb: '12 70 24',
        motionDuration: '0ms'
      }
    }
  },
  'terminal-clean': {
    id: 'terminal-clean',
    label: 'Terminal Clean',
    preferredMode: 'dark',
    features: { terminal: true, minimalBorders: true },
    tokens: {
      light: {
        bgColor: '#000000',
        bg: '#000000',
        surface: '#020402',
        mutedSurface: '#030803',
        text: '#7cff8a',
        mutedText: '#45b556',
        border: '#0b2411',
        accent: '#7cff8a',
        accentContrast: '#000000',
        modalSurfaceRgb: '2 4 2',
        modalBorderRgb: '12 70 24',
        motionDuration: '0ms'
      }
    }
  },
  'terminal-white': {
    id: 'terminal-white',
    label: 'Terminal White',
    preferredMode: 'dark',
    features: { terminal: true },
    tokens: {
      light: {
        bgColor: '#000000',
        bg: '#000000',
        surface: '#020202',
        mutedSurface: '#060606',
        text: '#ffffff',
        mutedText: '#b8b8b8',
        border: '#202020',
        accent: '#ffffff',
        accentContrast: '#000000',
        modalSurfaceRgb: '2 2 2',
        modalBorderRgb: '70 70 70',
        motionDuration: '0ms'
      }
    }
  },
  'terminal-clean-white': {
    id: 'terminal-clean-white',
    label: 'Terminal Clean White',
    preferredMode: 'dark',
    features: { terminal: true, minimalBorders: true },
    tokens: {
      light: {
        bgColor: '#000000',
        bg: '#000000',
        surface: '#020202',
        mutedSurface: '#060606',
        text: '#ffffff',
        mutedText: '#b8b8b8',
        border: '#202020',
        accent: '#ffffff',
        accentContrast: '#000000',
        modalSurfaceRgb: '2 2 2',
        modalBorderRgb: '70 70 70',
        motionDuration: '0ms'
      }
    }
  }
};

export const visualThemeOptions: Array<{ id: VisualTheme; label: string }> = Object.values(
  themeContracts
).map(({ id, label }) => ({ id, label }));

export const visualThemeIds = visualThemeOptions.map((theme) => theme.id);

export const getThemeContract = (visualTheme: VisualTheme, isDarkMode: boolean) => {
  const contract = themeContracts[visualTheme] || themeContracts.default;
  return isDarkMode && contract.tokens.dark ? contract.tokens.dark : contract.tokens.light;
};

export const getThemeStyle = (
  visualTheme: VisualTheme,
  isDarkMode: boolean,
  animationsEnabled = true
): CSSProperties =>
  ({
    '--motion-duration': animationsEnabled ? getThemeContract(visualTheme, isDarkMode).motionDuration : '0ms',
    '--theme-bg-color': getThemeContract(visualTheme, isDarkMode).bgColor,
    '--theme-bg': getThemeContract(visualTheme, isDarkMode).bg,
    '--theme-surface': getThemeContract(visualTheme, isDarkMode).surface,
    '--theme-muted-surface': getThemeContract(visualTheme, isDarkMode).mutedSurface,
    '--theme-text': getThemeContract(visualTheme, isDarkMode).text,
    '--theme-muted-text': getThemeContract(visualTheme, isDarkMode).mutedText,
    '--theme-border': getThemeContract(visualTheme, isDarkMode).border,
    '--theme-accent': getThemeContract(visualTheme, isDarkMode).accent,
    '--theme-accent-contrast': getThemeContract(visualTheme, isDarkMode).accentContrast,
    '--modal-surface-rgb': getThemeContract(visualTheme, isDarkMode).modalSurfaceRgb,
    '--modal-border-rgb': getThemeContract(visualTheme, isDarkMode).modalBorderRgb
  }) as CSSProperties;

export const getModalEffectStyle = (modalTransparency = 88): CSSProperties => {
  const transparency = Math.max(0, Math.min(100, Number(modalTransparency) || 0));
  const alpha = transparency / 100;

  return {
    '--modal-alpha': `${alpha}`,
    '--modal-backdrop-blur': `${Math.round(8 + alpha * 24)}px`,
    '--modal-surface-blur': `${Math.round(10 + alpha * 22)}px`
  } as CSSProperties;
};
