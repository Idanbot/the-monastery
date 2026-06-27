import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../domain/tasks';
import { useThemeStyle } from './useThemeStyle';

describe('useThemeStyle', () => {
  it('resolves effective colours from the theme contract when no overrides are set', () => {
    const { result } = renderHook(() => useThemeStyle(defaultSettings, true));

    expect(result.current.themeStyle).toBeDefined();
    expect(result.current.modalEffectStyle).toBeDefined();
    expect(result.current.effectiveMainColor).toMatch(/^#?[0-9a-f]{6}$/i);
    expect(result.current.animationsEnabled).toBe(true);
  });

  it('honours explicit colorScheme overrides', () => {
    const settings = {
      ...defaultSettings,
      colorScheme: { main: '#ff0000', secondary: '#00ff00', text: '#0000ff' }
    };
    const { result } = renderHook(() => useThemeStyle(settings, false));

    expect(result.current.effectiveMainColor).toBe('#ff0000');
    expect(result.current.effectiveSecondaryColor).toBe('#00ff00');
    expect(result.current.effectiveTextColor).toBe('#0000ff');
  });

  it('falls back when overrides are invalid (non-hex)', () => {
    const settings = {
      ...defaultSettings,
      colorScheme: { main: 'not-a-color', secondary: '', text: '' }
    };
    const { result } = renderHook(() => useThemeStyle(settings, false));

    expect(result.current.effectiveMainColor).not.toBe('not-a-color');
  });

  it('disables motion duration for terminal themes', () => {
    const settings = { ...defaultSettings, visualTheme: 'terminal-white' as const };
    const { result } = renderHook(() => useThemeStyle(settings, false));

    expect(result.current.motionDuration).toBe(0);
  });
});
