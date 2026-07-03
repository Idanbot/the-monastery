import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useThemeStyle } from '../../../hooks/useThemeStyle';
import { TimeSettingsSection } from '../TimeSettingsSection';
import type { RegisteredSectionProps } from './types';
export default function TimeRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings, isDarkMode } = useSettingsContext();
  const { effectiveClockTextColor, effectiveClockBackgroundColor } = useThemeStyle(settings, isDarkMode);
  return (
    <TimeSettingsSection
      {...props}
      settings={settings}
      setSettings={setSettings}
      effectiveClockTextColor={effectiveClockTextColor}
      effectiveClockBackgroundColor={effectiveClockBackgroundColor}
    />
  );
}
