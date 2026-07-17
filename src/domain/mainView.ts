import type { MainViewArea, MainViewModule, MainViewModuleId } from './types';

export const mainViewModuleDefinitions = [
  { id: 'focus', label: 'Monk mode', defaultArea: 'center' },
  { id: 'activity', label: 'Activity', defaultArea: 'center' },
  { id: 'calendar', label: 'Calendar', defaultArea: 'right' },
  { id: 'media', label: 'Media', defaultArea: 'right' },
  { id: 'clock', label: 'Clock', defaultArea: 'right' }
] as const satisfies readonly {
  id: MainViewModuleId;
  label: string;
  defaultArea: MainViewArea;
}[];

export const defaultMainViewModules: MainViewModule[] = mainViewModuleDefinitions.map((module) => ({
  id: module.id,
  area: module.defaultArea,
  visible: true
}));

const validIds = new Set<MainViewModuleId>(mainViewModuleDefinitions.map((module) => module.id));

export const normalizeMainViewModules = (value: unknown): MainViewModule[] => {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set<MainViewModuleId>();
  const normalized = source.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const raw = candidate as Record<string, unknown>;
    const id = raw.id as MainViewModuleId;
    if (!validIds.has(id) || seen.has(id)) return [];
    seen.add(id);
    const defaults = defaultMainViewModules.find((module) => module.id === id)!;
    return [
      {
        id,
        area: raw.area === 'center' || raw.area === 'right' ? raw.area : defaults.area,
        visible: raw.visible === undefined ? defaults.visible : Boolean(raw.visible)
      } satisfies MainViewModule
    ];
  });

  defaultMainViewModules.forEach((module) => {
    if (!seen.has(module.id)) normalized.push({ ...module });
  });
  return normalized;
};

export const updateMainViewModule = (
  modules: MainViewModule[],
  id: MainViewModuleId,
  updates: Partial<Pick<MainViewModule, 'area' | 'visible'>>
) => modules.map((module) => (module.id === id ? { ...module, ...updates } : module));

export const moveMainViewModule = (
  modules: MainViewModule[],
  id: MainViewModuleId,
  direction: 'up' | 'down'
) => {
  const index = modules.findIndex((module) => module.id === id);
  if (index < 0) return modules;
  const areaIndexes = modules.flatMap((module, moduleIndex) =>
    module.area === modules[index].area ? [moduleIndex] : []
  );
  const position = areaIndexes.indexOf(index);
  const targetIndex = areaIndexes[direction === 'up' ? position - 1 : position + 1];
  if (targetIndex === undefined) return modules;
  const next = [...modules];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
};
