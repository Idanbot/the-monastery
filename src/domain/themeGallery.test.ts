import { describe, expect, it } from 'vitest';
import { getThemeChoiceGroup, resolveThemeGalleryTokens, themeChoiceOptions } from './themeGallery';

const parseHex = (value: string) => {
  const hex = value.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
};

const parseRgb = (value: string) => {
  if (value.startsWith('#')) return parseHex(value);
  const match = value.match(/rgba?\((\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
};

const luminance = ([r, g, b]: number[]) => {
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrast = (a: string, b: string) => {
  const light = Math.max(luminance(parseRgb(a)), luminance(parseRgb(b)));
  const dark = Math.min(luminance(parseRgb(a)), luminance(parseRgb(b)));
  return (light + 0.05) / (dark + 0.05);
};

describe('theme gallery helpers', () => {
  it('classifies Nord as a dark theme choice', () => {
    expect(getThemeChoiceGroup('nord')).toBe('dark');
    expect(themeChoiceOptions.find((option) => option.visualTheme === 'nord')).toMatchObject({
      group: 'dark',
      theme: 'dark'
    });
  });

  it('uses each theme background and text tokens for readable labels', () => {
    for (const option of themeChoiceOptions) {
      const tokens = resolveThemeGalleryTokens(option.visualTheme, option.group);
      expect(tokens.labelBackground).toBeTruthy();
      expect(tokens.labelText).toBeTruthy();
      expect(contrast(tokens.labelText, tokens.labelBackground)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
