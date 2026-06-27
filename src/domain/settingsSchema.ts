import type { AppSettings } from './types';

type ScalarSettingKey = {
  [K in keyof AppSettings]: AppSettings[K] extends string | number | boolean ? K : never;
}[keyof AppSettings];

type SettingDefinition = {
  key: ScalarSettingKey;
  section: 'appearance' | 'time' | 'board' | 'sidebar';
  label: string;
  kind: 'toggle' | 'range' | 'select';
  defaultValue: string | number | boolean;
  options?: readonly string[];
  min?: number;
  max?: number;
};

export const settingDefinitions = [
  {
    key: 'animationsEnabled',
    section: 'appearance',
    label: 'Animations',
    kind: 'toggle',
    defaultValue: true
  },
  {
    key: 'modalTransparency',
    section: 'appearance',
    label: 'Modal transparency',
    kind: 'range',
    defaultValue: 35,
    min: 0,
    max: 100
  },
  {
    key: 'modalBlur',
    section: 'appearance',
    label: 'Modal blur',
    kind: 'range',
    defaultValue: 1,
    min: 0,
    max: 64
  },
  {
    key: 'textSize',
    section: 'appearance',
    label: 'Text size',
    kind: 'select',
    defaultValue: 'medium',
    options: ['small', 'medium', 'large']
  },
  {
    key: 'clockFormat',
    section: 'time',
    label: 'Clock format',
    kind: 'select',
    defaultValue: '24h',
    options: ['12h', '24h']
  },
  { key: 'showSeconds', section: 'time', label: 'Show seconds', kind: 'toggle', defaultValue: true },
  {
    key: 'clockDisplayMode',
    section: 'time',
    label: 'Clock display',
    kind: 'select',
    defaultValue: 'digital',
    options: ['digital', 'analog']
  },
  {
    key: 'layoutPreset',
    section: 'board',
    label: 'Board layout',
    kind: 'select',
    defaultValue: 'compact',
    options: ['compact', 'three-column', 'full']
  },
  {
    key: 'collapseTasks',
    section: 'board',
    label: 'Compact task cards',
    kind: 'toggle',
    defaultValue: false
  },
  {
    key: 'autoPromoteNextTask',
    section: 'board',
    label: 'Auto-start next backlog',
    kind: 'toggle',
    defaultValue: false
  },
  { key: 'resizeHandleVisible', section: 'board', label: 'Resize bars', kind: 'toggle', defaultValue: true },
  {
    key: 'resizeHandleThickness',
    section: 'board',
    label: 'Resize bar thickness',
    kind: 'range',
    defaultValue: 4,
    min: 1,
    max: 16
  },
  {
    key: 'resizeHandleLength',
    section: 'board',
    label: 'Resize bar length',
    kind: 'range',
    defaultValue: 48,
    min: 1,
    max: 160
  },
  {
    key: 'timelineHourLinesVisible',
    section: 'time',
    label: 'Hour lines',
    kind: 'toggle',
    defaultValue: true
  },
  {
    key: 'timelineNowLineVisible',
    section: 'time',
    label: 'Current time line',
    kind: 'toggle',
    defaultValue: true
  },
  { key: 'sidebarVisible', section: 'sidebar', label: 'Sidebar', kind: 'toggle', defaultValue: true }
] as const satisfies readonly SettingDefinition[];

type DefinedSettingKey = (typeof settingDefinitions)[number]['key'];
export const schemaSettingDefaults = Object.fromEntries(
  settingDefinitions.map((definition) => [definition.key, definition.defaultValue])
) as Pick<AppSettings, DefinedSettingKey>;

const definitionByKey = new Map(settingDefinitions.map((definition) => [definition.key, definition]));

export const getSettingDefinition = (key: DefinedSettingKey) => definitionByKey.get(key);

export const normalizeSchemaSettings = (saved: unknown): Partial<AppSettings> => {
  const source = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  return Object.fromEntries(
    settingDefinitions.map((definition) => {
      const raw = source[definition.key];
      if (definition.kind === 'toggle') {
        return [definition.key, raw === undefined ? definition.defaultValue : Boolean(raw)];
      }
      if (definition.kind === 'select') {
        return [
          definition.key,
          (definition.options as readonly string[] | undefined)?.includes(String(raw))
            ? raw
            : definition.defaultValue
        ];
      }
      const numeric = Number(raw);
      const fallback = Number(definition.defaultValue);
      return [
        definition.key,
        Math.min(
          definition.max ?? Infinity,
          Math.max(definition.min ?? -Infinity, Number.isFinite(numeric) ? numeric : fallback)
        )
      ];
    })
  ) as Partial<AppSettings>;
};
