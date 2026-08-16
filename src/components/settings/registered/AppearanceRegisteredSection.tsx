import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useProfileContext } from '../../../contexts/ProfileContext';
import { themeChoiceOptions } from '../../../domain/themeGallery';
import { createThemeRecipe, themeRecipeSchema } from '../../../domain/themeStudio';
import type { AppSettings } from '../../../domain/types';
import { useThemeStyle } from '../../../hooks/useThemeStyle';
import { SettingSection } from '../SettingSection';
import { SettingsSelect } from '../SettingsSelect';
import { ThemeGallery } from '../ThemeGallery';
import { VisualSystemPreview } from '../VisualSystemPreview';
import type { RegisteredSectionProps } from './types';

const textSizeOptions = [
  { id: 'small', label: 'Small text' },
  { id: 'medium', label: 'Medium text' },
  { id: 'large', label: 'Large text' }
] as const;

const mainFontOptions = [
  { id: '', label: 'Default Main Font' },
  {
    id: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Inter, sans-serif",
    label: 'Apple Inspired'
  },
  { id: "'FiraCode Nerd Font', 'Fira Code', monospace", label: 'Terminal Nerd Font' },
  { id: 'Inter, sans-serif', label: 'Inter' },
  { id: 'Roboto, sans-serif', label: 'Roboto' },
  { id: 'Outfit, sans-serif', label: 'Outfit' },
  { id: 'Poppins, sans-serif', label: 'Poppins' },
  { id: 'Lato, sans-serif', label: 'Lato' },
  { id: 'Merriweather, serif', label: 'Merriweather' },
  { id: "'Playfair Display', serif", label: 'Playfair Display' },
  { id: "'Space Grotesk', sans-serif", label: 'Space Grotesk' }
] as const;

const headingFontOptions = mainFontOptions.map((option) =>
  option.id === ''
    ? { ...option, label: 'Default Heading Font' }
    : option.label === 'Apple Inspired'
      ? {
          ...option,
          id: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Inter, sans-serif"
        }
      : option
);

const uiFontOptions = [
  { id: '', label: 'Default UI Font' },
  { id: "'FiraCode Nerd Font', 'Fira Code', ui-monospace, monospace", label: 'Terminal Nerd Font' },
  {
    id: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Inter, sans-serif",
    label: 'Apple Inspired'
  },
  ...mainFontOptions.filter((option) =>
    ['Inter', 'Roboto', 'Outfit', 'Poppins', 'Lato', 'Space Grotesk'].includes(option.label)
  )
];

const themePresets = [
  ['Calm', 'zen', 'light', '#5e7c67', '#9aa891', '#26312a'],
  ['Glass', 'liquid-glass', 'light', '#007aff', '#af52de', '#152033'],
  ['Mono', 'terminal-white', 'dark', '#ffffff', '#b8b8b8', '#ffffff']
] as const;

export default function AppearanceRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings, isDarkMode } = useSettingsContext();
  const { exportThemeRecipe } = useProfileContext();
  const { effectiveMainColor, effectiveSecondaryColor, effectiveTextColor } = useThemeStyle(
    settings,
    isDarkMode
  );
  const themeRecipeForm = useForm({
    resolver: zodResolver(themeRecipeSchema),
    values: createThemeRecipe(settings),
    mode: 'onChange'
  });
  const patchSettings = (partial: Partial<AppSettings>) =>
    setSettings((previous) => ({ ...previous, ...partial }));
  const updateSetting = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const updateColor = (key: 'main' | 'secondary' | 'text', value: string) =>
    setSettings((previous) => ({
      ...previous,
      colorScheme: { ...previous.colorScheme, [key]: value }
    }));
  const themeNameField = themeRecipeForm.register('name', {
    onChange: (event) => updateSetting('customThemeName', event.target.value)
  });
  const themeChoice =
    settings.visualTheme === 'default'
      ? `${settings.theme}:${settings.visualTheme}`
      : `theme:${settings.visualTheme}`;
  const normalizedThemeChoice = themeChoiceOptions.some((option) => option.value === themeChoice)
    ? themeChoice
    : 'system:default';
  const setThemeChoice = (value: string) => {
    const option = themeChoiceOptions.find((item) => item.value === value) || themeChoiceOptions[0];
    patchSettings({
      theme: option.theme,
      visualTheme: option.visualTheme,
      colorScheme: { main: '', secondary: '', text: '' },
      fontMain: '',
      fontSecondary: '',
      clockTextColor: '',
      clockBackgroundColor: ''
    });
  };

  return (
    <SettingSection id="appearance" title="Appearance" {...props}>
      <ThemeGallery
        options={themeChoiceOptions}
        normalizedThemeChoice={normalizedThemeChoice}
        setThemeChoice={setThemeChoice}
      />
      <VisualSystemPreview />
      <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Typography</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ['Base text size', 'Base text size', settings.textSize, textSizeOptions, 'textSize'],
          ['Main Text Font', 'Main text font', settings.fontMain || '', mainFontOptions, 'fontMain'],
          [
            'Secondary / Headers Font',
            'Secondary and headers font',
            settings.fontSecondary || '',
            headingFontOptions,
            'fontSecondary'
          ],
          ['UI & Monospace Elements', 'UI and monospace font', settings.fontUI || '', uiFontOptions, 'fontUI']
        ].map(([label, ariaLabel, value, options, key]) => (
          <div key={String(key)} className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-xs font-semibold">{label as string}</span>
            <SettingsSelect
              ariaLabel={ariaLabel as string}
              value={value as string}
              onValueChange={(nextValue) => updateSetting(key as keyof AppSettings, nextValue as never)}
              options={options as Array<{ id: string; label: string }>}
            />
          </div>
        ))}
      </div>
      <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Colors</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Main color', 'main', effectiveMainColor],
          ['Secondary color', 'secondary', effectiveSecondaryColor],
          ['Text color', 'text', effectiveTextColor]
        ].map(([label, key, value]) => (
          <label key={key} className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span>{label}</span>
            <input
              type="color"
              value={value}
              onChange={(event) => updateColor(key as 'main' | 'secondary' | 'text', event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Theme Studio</div>
          <button
            type="button"
            onClick={exportThemeRecipe}
            className="ui-secondary-button px-2 py-1.5 text-xs"
          >
            Export
          </button>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>Recipe name</span>
          <input aria-label="Custom theme name" {...themeNameField} className="ui-input px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {themePresets.map(([label, visualTheme, theme, main, secondary, text]) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                patchSettings({
                  visualTheme,
                  theme,
                  colorScheme: { main, secondary, text },
                  fontMain: '',
                  fontSecondary: '',
                  clockTextColor: '',
                  clockBackgroundColor: ''
                })
              }
              className="ui-secondary-button px-2 py-2 text-xs"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-3 text-[color:var(--theme-text)]">
          <div className="mb-2 text-xs font-semibold text-[color:var(--theme-muted-text)]">Preview</div>
          <div className="rounded-md bg-[color:var(--theme-muted-surface)] px-3 py-2 text-sm">
            Cards, clock, and modals inherit these three colors.
          </div>
          <button
            type="button"
            className="mt-2 rounded-md bg-[color:var(--theme-main)] px-3 py-1.5 text-xs font-semibold text-[color:var(--theme-main-contrast)]"
          >
            Action
          </button>
        </div>
      </div>
      {[
        ['Modal transparency', 'modalTransparency', 0, 100, '%'],
        ['Modal blur', 'modalBlur', 0, 64, 'px']
      ].map(([label, key, min, max, suffix]) => (
        <label key={String(key)} className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span className="flex items-center justify-between">
            <span>{label}</span>
            <span className="font-mono text-xs text-slate-500">
              {settings[key as 'modalTransparency' | 'modalBlur']}
              {suffix}
            </span>
          </span>
          <input
            type="range"
            min={min as number}
            max={max as number}
            value={settings[key as 'modalTransparency' | 'modalBlur']}
            onChange={(event) =>
              updateSetting(
                key as 'modalTransparency' | 'modalBlur',
                Math.max(min as number, Math.min(max as number, Number(event.target.value)))
              )
            }
            className="accent-indigo-600"
          />
        </label>
      ))}
      {[
        ['Monk Mode', 'monkMode'],
        ['Animations', 'animationsEnabled']
      ].map(([label, key]) => (
        <label
          key={key}
          className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300"
        >
          <span>{label}</span>
          <input
            type="checkbox"
            checked={Boolean(settings[key as 'monkMode' | 'animationsEnabled'])}
            onChange={(event) => updateSetting(key as 'monkMode' | 'animationsEnabled', event.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>
      ))}
    </SettingSection>
  );
}
