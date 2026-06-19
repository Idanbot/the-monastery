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
  main?: string;
  mainContrast?: string;
  secondary?: string;
  secondaryContrast?: string;
  glassTint?: string;
  glassHighlight?: string;
  glassEdge?: string;
  glassShadow?: string;
  glassBlur?: string;
  glassSaturation?: string;
  radiusControl?: string;
  radiusPanel?: string;
  motionEase?: string;
  fontMain?: string;
  fontSecondary?: string;
  fontUI?: string;
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
    materialVariants?: Array<'control' | 'panel' | 'sidebar' | 'modal' | 'widget'>;
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
    features: { glass: true, materialVariants: ['control', 'panel', 'sidebar', 'modal', 'widget'] },
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
        accent: '#007aff',
        accentContrast: '#ffffff',
        main: '#007aff',
        mainContrast: '#ffffff',
        secondary: '#af52de',
        secondaryContrast: '#ffffff',
        glassTint: 'rgb(255 255 255 / 0.58)',
        glassHighlight: 'rgb(255 255 255 / 0.92)',
        glassEdge: 'rgb(255 255 255 / 0.74)',
        glassShadow:
          '0 24px 72px rgb(84 105 138 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.78), inset 0 -1px 0 rgb(92 112 140 / 0.12)',
        glassBlur: '34px',
        glassSaturation: '1.8',
        radiusControl: '18px',
        radiusPanel: '28px',
        motionEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
        modalSurfaceRgb: '255 255 255',
        modalBorderRgb: '255 255 255',
        motionDuration: '90ms'
      }
    }
  },
  'obsidian-glass': {
    id: 'obsidian-glass',
    label: 'Obsidian Glass',
    preferredMode: 'dark',
    features: { glass: true, materialVariants: ['control', 'panel', 'sidebar', 'modal', 'widget'] },
    tokens: {
      light: {
        bgColor: '#000000',
        bg: `radial-gradient(circle at 14% 8%, rgb(30 35 60 / 0.7), transparent 30%),
radial-gradient(circle at 78% 0%, rgb(50 30 70 / 0.6), transparent 35%),
radial-gradient(circle at 100% 80%, rgb(20 40 60 / 0.5), transparent 40%),
linear-gradient(135deg, #050508 0%, #000000 42%, #080812 100%)`,
        surface: 'rgb(25 25 32 / 0.45)',
        mutedSurface: 'rgb(20 20 25 / 0.3)',
        text: '#f4f4f5',
        mutedText: '#9ca3af',
        border: 'rgb(255 255 255 / 0.14)',
        accent: '#0a84ff',
        accentContrast: '#ffffff',
        main: '#0a84ff',
        mainContrast: '#ffffff',
        secondary: '#bf5af2',
        secondaryContrast: '#ffffff',
        glassTint: 'rgb(15 15 20 / 0.65)',
        glassHighlight: 'rgb(255 255 255 / 0.12)',
        glassEdge: 'rgb(255 255 255 / 0.16)',
        glassShadow:
          '0 24px 72px rgb(0 0 0 / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 -1px 0 rgb(0 0 0 / 0.5)',
        glassBlur: '42px',
        glassSaturation: '2.0',
        radiusControl: '18px',
        radiusPanel: '28px',
        motionEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
        modalSurfaceRgb: '25 25 32',
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
  catppuccin: {
    id: 'catppuccin',
    label: 'Catppuccin Mocha',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#1e1e2e',
        bg: '#1e1e2e',
        surface: '#313244',
        mutedSurface: '#45475a',
        text: '#cdd6f4',
        mutedText: '#a6adc8',
        border: '#585b70',
        accent: '#cba6f7',
        accentContrast: '#11111b',
        modalSurfaceRgb: '49 50 68',
        modalBorderRgb: '88 91 112',
        motionDuration: '80ms'
      }
    }
  },
  gruvbox: {
    id: 'gruvbox',
    label: 'Gruvbox',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#282828',
        bg: '#282828',
        surface: '#3c3836',
        mutedSurface: '#504945',
        text: '#ebdbb2',
        mutedText: '#a89984',
        border: '#665c54',
        accent: '#fabd2f',
        accentContrast: '#282828',
        modalSurfaceRgb: '60 56 54',
        modalBorderRgb: '102 92 84',
        motionDuration: '80ms'
      }
    }
  },
  dracula: {
    id: 'dracula',
    label: 'Dracula',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#282a36',
        bg: '#282a36',
        surface: '#44475a',
        mutedSurface: '#383a59',
        text: '#f8f8f2',
        mutedText: '#6272a4',
        border: '#6272a4',
        accent: '#bd93f9',
        accentContrast: '#282a36',
        modalSurfaceRgb: '68 71 90',
        modalBorderRgb: '98 114 164',
        motionDuration: '80ms'
      }
    }
  },
  'github-light': {
    id: 'github-light',
    label: 'GitHub Light',
    preferredMode: 'light',
    tokens: {
      light: {
        bgColor: '#f6f8fa',
        bg: '#f6f8fa',
        surface: '#ffffff',
        mutedSurface: '#f6f8fa',
        text: '#24292f',
        mutedText: '#57606a',
        border: '#d0d7de',
        accent: '#0969da',
        accentContrast: '#ffffff',
        modalSurfaceRgb: '255 255 255',
        modalBorderRgb: '208 215 222',
        motionDuration: '80ms'
      }
    }
  },
  'github-dark': {
    id: 'github-dark',
    label: 'GitHub Dark',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#0d1117',
        bg: '#0d1117',
        surface: '#161b22',
        mutedSurface: '#21262d',
        text: '#c9d1d9',
        mutedText: '#8b949e',
        border: '#30363d',
        accent: '#58a6ff',
        accentContrast: '#0d1117',
        modalSurfaceRgb: '22 27 34',
        modalBorderRgb: '48 54 61',
        motionDuration: '80ms'
      }
    }
  },
  nord: {
    id: 'nord',
    label: 'Nord',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#2e3440',
        bg: '#2e3440',
        surface: '#3b4252',
        mutedSurface: '#434c5e',
        text: '#d8dee9',
        mutedText: '#e5e9f0',
        border: '#4c566a',
        accent: '#88c0d0',
        accentContrast: '#2e3440',
        modalSurfaceRgb: '59 66 82',
        modalBorderRgb: '76 86 106',
        motionDuration: '80ms'
      }
    }
  },
  solarized: {
    id: 'solarized',
    label: 'Solarized Dark',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#002b36', bg: '#002b36', surface: '#073642', mutedSurface: '#586e75', text: '#839496', mutedText: '#657b83', border: '#586e75', accent: '#2aa198', accentContrast: '#002b36', modalSurfaceRgb: '7 54 66', modalBorderRgb: '88 110 117', motionDuration: '80ms'
      }
    }
  },
  monokai: {
    id: 'monokai',
    label: 'Monokai',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#272822', bg: '#272822', surface: '#3e3d32', mutedSurface: '#49483e', text: '#f8f8f2', mutedText: '#75715e', border: '#49483e', accent: '#a6e22e', accentContrast: '#272822', modalSurfaceRgb: '62 61 50', modalBorderRgb: '73 72 62', motionDuration: '80ms'
      }
    }
  },
  ayu: {
    id: 'ayu',
    label: 'Ayu Mirage',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#1f2430', bg: '#1f2430', surface: '#232834', mutedSurface: '#282e3a', text: '#cbccc6', mutedText: '#5c6773', border: '#5c6773', accent: '#ffcc66', accentContrast: '#1f2430', modalSurfaceRgb: '35 40 52', modalBorderRgb: '92 103 115', motionDuration: '80ms'
      }
    }
  },
  'night-owl': {
    id: 'night-owl',
    label: 'Night Owl',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#011627', bg: '#011627', surface: '#0b2942', mutedSurface: '#113554', text: '#d6deeb', mutedText: '#5f7e97', border: '#5f7e97', accent: '#82aaff', accentContrast: '#011627', modalSurfaceRgb: '11 41 66', modalBorderRgb: '95 126 151', motionDuration: '80ms'
      }
    }
  },
  synthwave: {
    id: 'synthwave',
    label: 'Synthwave 84',
    preferredMode: 'dark',
    tokens: {
      light: {
        bgColor: '#2b213a', bg: '#2b213a', surface: '#241b2f', mutedSurface: '#262335', text: '#f92aad', mutedText: '#36f9f6', border: '#36f9f6', accent: '#fce566', accentContrast: '#2b213a', modalSurfaceRgb: '36 27 47', modalBorderRgb: '54 249 246', motionDuration: '80ms'
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

export type ThemeColorOverrides = Partial<Omit<ThemeTokens, 'fontMain' | 'fontSecondary' | 'fontUI'>> & {
  main?: string;
  secondary?: string;
  text?: string;
  fontMain?: string;
  fontSecondary?: string;
  fontUI?: string;
};

const usableColor = (value?: string) => {
  const color = typeof value === 'string' ? value.trim() : '';
  return color.length > 0 ? color : undefined;
};

const resolveThemeTokens = (tokens: ThemeTokens, colorOverrides: ThemeColorOverrides = {}) => {
  const main = usableColor(colorOverrides.main) || tokens.main || tokens.accent;
  const secondary = usableColor(colorOverrides.secondary) || tokens.secondary || tokens.mutedText;
  const text = usableColor(colorOverrides.text) || tokens.text;
  const fontMain = colorOverrides.fontMain?.trim() || undefined;
  const fontSecondary = colorOverrides.fontSecondary?.trim() || undefined;

  return {
    ...tokens,
    main,
    mainContrast: tokens.mainContrast || tokens.accentContrast,
    secondary,
    text,
    secondaryContrast: tokens.secondaryContrast || tokens.accentContrast,
    glassTint: tokens.glassTint || 'color-mix(in srgb, var(--theme-surface) 72%, transparent)',
    glassHighlight: tokens.glassHighlight || 'rgb(255 255 255 / 0.22)',
    glassEdge: tokens.glassEdge || tokens.border,
    glassShadow: tokens.glassShadow || '0 18px 48px rgb(15 23 42 / 0.16)',
    glassBlur: tokens.glassBlur || '18px',
    glassSaturation: tokens.glassSaturation || '1.24',
    radiusControl: tokens.radiusControl || '12px',
    radiusPanel: tokens.radiusPanel || '16px',
    motionEase: tokens.motionEase || 'cubic-bezier(0.22, 1, 0.36, 1)',
    fontMain:
      fontMain ||
      tokens.fontMain ||
      "Inter, ui-rounded, 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSecondary:
      fontSecondary ||
      tokens.fontSecondary ||
      fontMain ||
      tokens.fontMain ||
      "Inter, ui-rounded, 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };
};

export const getThemeStyle = (
  visualTheme: VisualTheme,
  isDarkMode: boolean,
  animationsEnabled = true,
  colorOverrides: ThemeColorOverrides = {}
): CSSProperties => {
  const tokens = resolveThemeTokens(getThemeContract(visualTheme, isDarkMode), colorOverrides);

  return {
    '--motion-duration': animationsEnabled ? tokens.motionDuration : '0ms',
    '--theme-bg-color': tokens.bgColor,
    '--theme-bg': tokens.bg,
    '--theme-surface': tokens.surface,
    '--theme-muted-surface': tokens.mutedSurface,
    '--theme-text': tokens.text,
    '--theme-muted-text': tokens.mutedText,
    '--theme-border': tokens.border,
    '--theme-accent': tokens.main,
    '--theme-accent-contrast': tokens.mainContrast,
    '--theme-main': tokens.main,
    '--theme-main-contrast': tokens.mainContrast,
    '--theme-secondary': tokens.secondary,
    '--theme-secondary-contrast': tokens.secondaryContrast,
    '--theme-glass-tint': tokens.glassTint,
    '--theme-glass-highlight': tokens.glassHighlight,
    '--theme-glass-edge': tokens.glassEdge,
    '--theme-glass-shadow': tokens.glassShadow,
    '--theme-glass-blur': tokens.glassBlur,
    '--theme-glass-saturation': tokens.glassSaturation,
    '--theme-radius-control': tokens.radiusControl,
    '--theme-radius-panel': tokens.radiusPanel,
    '--theme-motion-ease': tokens.motionEase,
    '--theme-font-main': colorOverrides?.fontMain || tokens.fontMain,
    '--theme-font-secondary': colorOverrides?.fontSecondary || tokens.fontSecondary,
    '--theme-font-ui': colorOverrides?.fontUI || tokens.fontUI || tokens.fontMain,
    '--modal-surface-rgb': tokens.modalSurfaceRgb,
    '--modal-border-rgb': tokens.modalBorderRgb
  } as CSSProperties;
};

export const getModalEffectStyle = (modalTransparency = 88, modalBlur = 29): CSSProperties => {
  const transparency = Math.max(0, Math.min(100, Number(modalTransparency) || 0));
  const blur = Math.max(0, Math.min(64, Number(modalBlur) || 0));
  const alpha = transparency / 100;

  return {
    '--modal-alpha': String(alpha),
    '--modal-surface-alpha': String(Math.max(alpha, 0.72)),
    '--modal-backdrop-blur': Math.round(blur) + 'px',
    '--modal-surface-blur': Math.round(blur) + 'px'
  } as CSSProperties;
};
