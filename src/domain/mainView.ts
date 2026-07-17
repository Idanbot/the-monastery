import type {
  MainViewArea,
  MainViewModule,
  MainViewModuleId,
  MainViewSlotContentId,
  MainViewSlotId,
  MainViewSlots
} from './types';

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

export const mainViewSlotDefinitions = [
  { id: 'topLeft', label: 'Top left' },
  { id: 'topRight', label: 'Top right' },
  { id: 'bottomLeft', label: 'Bottom left' },
  { id: 'bottomRight', label: 'Bottom right' }
] as const satisfies readonly { id: MainViewSlotId; label: string }[];

export const mainViewSlotContentDefinitions = [
  { id: 'focus', label: 'Monk mode' },
  { id: 'activity', label: 'Activity' },
  { id: 'calendar-media', label: 'Calendar + media' },
  { id: 'clock-timeline', label: 'Clock + timeline' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'media', label: 'Media' },
  { id: 'clock', label: 'Clock' },
  { id: 'timeline', label: 'Timeline' }
] as const satisfies readonly { id: MainViewSlotContentId; label: string }[];

export const defaultMainViewSlots: MainViewSlots = {
  topLeft: 'focus',
  topRight: 'activity',
  bottomLeft: 'calendar-media',
  bottomRight: 'clock-timeline'
};

const validSlotContentIds = new Set<MainViewSlotContentId>(
  mainViewSlotContentDefinitions.map((definition) => definition.id)
);

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

const legacySlots = (modules: MainViewModule[]): MainViewSlots => {
  const visible = normalizeMainViewModules(modules).filter((module) => module.visible);
  const center = visible.filter((module) => module.area === 'center');
  const right = visible.filter((module) => module.area === 'right');
  const rightIds = new Set(right.map((module) => module.id));
  const used = new Set<MainViewModuleId>();
  const take = (module: MainViewModule | undefined, fallback: MainViewSlotContentId) => {
    if (!module) return fallback;
    used.add(module.id);
    return module.id;
  };

  const topLeft = take(center[0], defaultMainViewSlots.topLeft);
  const topRight = take(center[1], defaultMainViewSlots.topRight);
  let bottomLeft: MainViewSlotContentId;
  if (rightIds.has('calendar') && rightIds.has('media')) {
    bottomLeft = 'calendar-media';
    used.add('calendar');
    used.add('media');
  } else {
    bottomLeft = take(
      right.find((module) => !used.has(module.id)),
      defaultMainViewSlots.bottomLeft
    );
  }

  const bottomRight = rightIds.has('clock')
    ? 'clock-timeline'
    : take(
        [...center, ...right].find((module) => !used.has(module.id)),
        defaultMainViewSlots.bottomRight
      );

  return { topLeft, topRight, bottomLeft, bottomRight };
};

export const normalizeMainViewSlots = (value: unknown, legacyModules?: unknown): MainViewSlots => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  const hasValidSlot = mainViewSlotDefinitions.some(({ id }) =>
    validSlotContentIds.has(source?.[id] as MainViewSlotContentId)
  );

  if (!hasValidSlot && Array.isArray(legacyModules)) return legacySlots(legacyModules as MainViewModule[]);

  return Object.fromEntries(
    mainViewSlotDefinitions.map(({ id }) => {
      const candidate = source?.[id] as MainViewSlotContentId;
      return [id, validSlotContentIds.has(candidate) ? candidate : defaultMainViewSlots[id]];
    })
  ) as MainViewSlots;
};

export const updateMainViewSlot = (
  slots: MainViewSlots,
  slot: MainViewSlotId,
  content: MainViewSlotContentId
): MainViewSlots => ({ ...slots, [slot]: content });
