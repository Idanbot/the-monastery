import { useMemo } from 'react';
import type { AppSettings } from '../domain/types';
import { getModalEffectStyle, getThemeContract, getThemeStyle } from '../domain/themes';

const hexColor = (value: string | undefined, fallback: string) =>
  /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;

/**
 * Single source for resolved theme tokens + modal effect style + effective
 * custom colours. Replaces the duplicated resolution that previously lived in
 * both `App` (app shell) and `SettingsModal` (modal surface).
 */
export function useThemeStyle(settings: AppSettings, isDarkMode: boolean) {
  return useMemo(() => {
    const animationsEnabled = settings.animationsEnabled !== false;
    const terminalTheme = settings.visualTheme.startsWith('terminal');
    const motionDuration = animationsEnabled && !terminalTheme ? 0.08 : 0;
    const motionEase = (
      settings.visualTheme === 'liquid-glass' ? ([0.22, 1, 0.36, 1] as const) : 'easeOut'
    ) as 'easeOut' | readonly [number, number, number, number];
    const themeTokens = getThemeContract(settings.visualTheme, isDarkMode);
    const themeStyle = getThemeStyle(settings.visualTheme, isDarkMode, animationsEnabled, {
      ...settings.colorScheme,
      fontMain: settings.fontMain,
      fontSecondary: settings.fontSecondary,
      fontUI: settings.fontUI
    });
    const modalEffectStyle = getModalEffectStyle(settings.modalTransparency, settings.modalBlur);

    return {
      animationsEnabled,
      motionDuration,
      motionEase,
      themeTokens,
      themeStyle,
      modalEffectStyle,
      effectiveMainColor: hexColor(
        settings.colorScheme?.main || themeTokens.main || themeTokens.accent,
        '#007aff'
      ),
      effectiveSecondaryColor: hexColor(
        settings.colorScheme?.secondary || themeTokens.secondary || themeTokens.mutedText,
        '#af52de'
      ),
      effectiveTextColor: hexColor(settings.colorScheme?.text || themeTokens.text, '#152033'),
      effectiveClockTextColor: hexColor(
        settings.clockTextColor || settings.colorScheme?.text || themeTokens.text,
        '#152033'
      ),
      effectiveClockBackgroundColor: hexColor(settings.clockBackgroundColor || themeTokens.bgColor, '#ffffff')
    };
  }, [
    settings.animationsEnabled,
    settings.visualTheme,
    settings.modalTransparency,
    settings.modalBlur,
    settings.colorScheme,
    settings.fontMain,
    settings.fontSecondary,
    settings.fontUI,
    settings.clockTextColor,
    settings.clockBackgroundColor,
    isDarkMode
  ]);
}
