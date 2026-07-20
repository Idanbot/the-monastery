import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useThemeStyle } from '../../hooks/useThemeStyle';
import { themedSurfaceClassName } from '../ui/themedSurfaceStyles';

type SettingsSelectOption = {
  id: string;
  label: string;
};

type SettingsSelectProps = {
  ariaLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SettingsSelectOption[];
  disabled?: boolean;
  className?: string;
};

/**
 * App-styled dropdown for preference surfaces. Native <select> popups are
 * platform-fragile inside the settings dialog, and Radix menus must render
 * above it: the dialog overlay is z-[100] and the surface z-[101], so the
 * content portal uses z-[130]. Anything lower opens the menu *behind* the
 * modal and reads as "the dropdown is not clickable".
 */
export function SettingsSelect({
  ariaLabel,
  value,
  onValueChange,
  options,
  disabled = false,
  className = ''
}: SettingsSelectProps) {
  const { settings, isDarkMode } = useSettingsContext();
  const {
    animationsEnabled,
    themeStyle: resolvedThemeStyle,
    modalEffectStyle
  } = useThemeStyle(settings, isDarkMode);

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        aria-label={ariaLabel}
        className={`ui-control ui-focus-ring flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className="min-w-0 truncate">
          <Select.Value />
        </span>
        <Select.Icon className="shrink-0 text-[var(--ui-text-secondary)]">
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          data-visual-theme={settings.visualTheme}
          data-animations-enabled={animationsEnabled ? 'true' : 'false'}
          style={{ ...resolvedThemeStyle, ...modalEffectStyle }}
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className={themedSurfaceClassName(
            'menu',
            `${isDarkMode ? 'dark' : ''} z-[130] max-h-72 w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-xl border border-slate-200 p-1 shadow-2xl dark:border-slate-700 dark:bg-slate-900`
          )}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.id}
                value={option.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="text-[var(--ui-info)]">
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
