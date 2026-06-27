import type { AppSettings } from '../../domain/types';
import { getSettingDefinition, normalizeSchemaSettings } from '../../domain/settingsSchema';

type Props = {
  settingKey:
    | 'layoutPreset'
    | 'collapseTasks'
    | 'autoPromoteNextTask'
    | 'resizeHandleVisible'
    | 'resizeHandleThickness'
    | 'resizeHandleLength';
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: unknown) => void;
  optionLabels?: Record<string, string>;
};

export function SchemaSettingField({ settingKey, settings, updateSetting, optionLabels = {} }: Props) {
  const definition = getSettingDefinition(settingKey)!;
  const value = settings[settingKey];
  const update = (raw: unknown) =>
    updateSetting(settingKey, normalizeSchemaSettings({ [settingKey]: raw })[settingKey]);

  if (definition.kind === 'toggle') {
    return (
      <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
        <span>{definition.label}</span>
        <input
          aria-label={definition.label}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => update(event.target.checked)}
          className="h-4 w-4 accent-indigo-600"
        />
      </label>
    );
  }

  if (definition.kind === 'select') {
    return (
      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
        <span>{definition.label}</span>
        <select
          aria-label={definition.label}
          value={String(value)}
          onChange={(event) => update(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800"
        >
          {definition.options?.map((option) => (
            <option key={option} value={option}>
              {optionLabels[option] || option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span>{definition.label.replace('Resize bar ', '')}</span>
      <input
        aria-label={definition.label}
        type="number"
        min={definition.min}
        max={definition.max}
        value={Number(value)}
        onChange={(event) => update(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800"
      />
    </label>
  );
}
