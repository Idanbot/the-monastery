import { useSettingsContext } from '../../../contexts/SettingsContext';
import { SettingSection } from '../SettingSection';
import type { RegisteredSectionProps } from './types';
const widgets = [
  ['now', 'Now task'],
  ['clock', 'Clock'],
  ['media', 'Focus media'],
  ['agenda', 'Timeline']
] as const;
export default function SidebarRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  return (
    <SettingSection id="sidebar" title="Sidebar" {...props}>
      <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
        <span>Right container</span>
        <input
          type="checkbox"
          checked={settings.sidebarVisible !== false}
          onChange={(event) =>
            setSettings((previous) => ({ ...previous, sidebarVisible: event.target.checked }))
          }
          className="h-4 w-4 accent-indigo-600"
        />
      </label>
      {widgets.map(([widget, label]) => (
        <label
          key={widget}
          className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300"
        >
          <span>{label}</span>
          <input
            type="checkbox"
            checked={settings.sidebarWidgets.includes(widget)}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                sidebarWidgets: event.target.checked
                  ? Array.from(new Set([...previous.sidebarWidgets, widget]))
                  : previous.sidebarWidgets.filter((item) => item !== widget)
              }))
            }
            className="h-4 w-4 accent-indigo-600"
          />
        </label>
      ))}
    </SettingSection>
  );
}
