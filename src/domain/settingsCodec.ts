import { isActivityPetId } from '../../shared/activityPets';
import type { AppSettings, TaskStatus } from './types';
import {
  defaultMainViewModules,
  defaultMainViewSlots,
  normalizeMainViewModules,
  normalizeMainViewSlots
} from './mainView';
import { generateId } from './ids';
import { normalizeSchemaSettings, schemaSettingDefaults } from './settingsSchema';
import { normalizeStringArray } from './taskCodec';
import { defaultBoardColumnOrder, normalizeBoardColumnOrder, validStatuses } from './taskStatus';
import { visualThemeIds } from './themes';

export const defaultWebhookProviderSettings = {
  discord: { enabled: true, template: '**{title}**\n{body}' },
  slack: { enabled: true, template: '*{title}*\n{body}' },
  telegram: { enabled: true, template: '{title}\n{body}' }
};

export const defaultSettings: AppSettings = {
  ...schemaSettingDefaults,
  theme: 'system',
  visualTheme: 'liquid-glass',
  colorScheme: { main: '#4f46e5', secondary: '#64748b', text: '#1e293b' },
  fontMain: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Inter, system-ui, sans-serif",
  fontSecondary:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Inter, system-ui, sans-serif",
  fontUI: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  customThemeName: 'Custom Liquid Glass',
  monkMode: false,
  dailyGoal: '',
  shutdownChecklist: { review: false, plan: false, clear: false },
  sidebarWidgets: ['now', 'clock', 'media', 'agenda'],
  mainViewSlots: defaultMainViewSlots,
  mainViewColumnSplit: 50,
  mainViewRowSplit: 50,
  collapsedMainViewSlots: [],
  activityPetId: 'aurelius',
  activityPetVisible: true,
  activityFlameAnimationEnabled: true,
  mainViewModules: defaultMainViewModules,
  focusMediaUrl: 'https://youtu.be/4e839orj52w',
  sidebarWidth: 320,
  clockHeight: 160,
  clockTextScale: 1,
  clockBackgroundVisible: true,
  clockTextColor: '',
  clockBackgroundColor: '',
  roles: [],
  tagGoals: [],
  tagInventory: [],
  tagAliases: {},
  projects: [],
  webhookProviderSettings: defaultWebhookProviderSettings,
  mobileFocusMode: false,
  collapsedBoardLanes: [],
  resizeHandleColor: '#94a3b8',
  columnWidths: { backlog: 25, inProgress: 25, done: 25, rejected: 25 },
  compactColumnWidths: { left: 50, right: 50 },
  compactHeights: { backlog: 50, inProgress: 50, done: 50, rejected: 50 },
  boardColumnOrder: defaultBoardColumnOrder
};

const normalizeTagInventory = (value) => {
  const tags = normalizeStringArray(value);
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const normalizeTagAliases = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([alias, target]) => [alias.trim(), typeof target === 'string' ? target.trim() : ''])
      .filter(([alias, target]) => alias && target && alias.toLowerCase() !== target.toLowerCase())
  );
};

const normalizeThemeColor = (value) => {
  const color = typeof value === 'string' ? value.trim() : '';
  return color.length > 0 ? color : '';
};

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
};

const normalizeGoalCadence = (value) => ({
  dailyTargetHours: Math.max(0, Number(value?.dailyTargetHours) || 0),
  weeklyTargetHours: Math.max(0, Number(value?.weeklyTargetHours) || 0),
  monthlyTargetHours: Math.max(0, Number(value?.monthlyTargetHours) || 0)
});

const normalizeRoles = (roles) => {
  const source = Array.isArray(roles) ? roles : defaultSettings.roles;
  return source.map((role) => ({
    id: typeof role.id === 'string' ? role.id : generateId(),
    name: typeof role.name === 'string' ? role.name : 'Role',
    tags: normalizeStringArray(role.tags),
    ...normalizeGoalCadence(role)
  }));
};

const normalizeWebhookProviderSettings = (saved) =>
  Object.fromEntries(
    Object.entries(defaultWebhookProviderSettings).map(([provider, defaults]) => [
      provider,
      {
        enabled:
          saved?.[provider]?.enabled === undefined ? defaults.enabled : Boolean(saved[provider].enabled),
        template:
          typeof saved?.[provider]?.template === 'string' && saved[provider].template.trim()
            ? saved[provider].template.slice(0, 4000)
            : defaults.template
      }
    ])
  );

const normalizeProjects = (projects) => {
  if (!Array.isArray(projects)) return [];
  return projects
    .filter((project) => typeof project?.name === 'string' && project.name.trim())
    .map((project) => ({
      id: typeof project.id === 'string' && project.id ? project.id : generateId(),
      name: project.name.trim(),
      description: typeof project.description === 'string' ? project.description.trim() : '',
      status: ['active', 'paused', 'completed'].includes(project.status) ? project.status : 'active',
      tags: normalizeStringArray(project.tags),
      taskIds: normalizeStringArray(project.taskIds),
      milestones: Array.isArray(project.milestones)
        ? project.milestones
            .filter((milestone) => typeof milestone?.title === 'string' && milestone.title.trim())
            .map((milestone) => ({
              id: typeof milestone.id === 'string' && milestone.id ? milestone.id : generateId(),
              title: milestone.title.trim(),
              completed: Boolean(milestone.completed)
            }))
        : []
    }));
};

const normalizeTagGoals = (tagGoals) => {
  const source = Array.isArray(tagGoals) ? tagGoals : defaultSettings.tagGoals;
  return source
    .filter((goal) => typeof goal?.tag === 'string' && goal.tag.trim())
    .map((goal) => ({
      id: typeof goal.id === 'string' ? goal.id : generateId(),
      tag: goal.tag.trim(),
      ...normalizeGoalCadence(goal)
    }));
};

export const mergeSettings = (saved) => ({
  ...defaultSettings,
  ...(saved || {}),
  theme: ['system', 'light', 'dark'].includes(saved?.theme) ? saved.theme : defaultSettings.theme,
  visualTheme: visualThemeIds.includes(saved?.visualTheme) ? saved.visualTheme : defaultSettings.visualTheme,
  colorScheme: {
    main: normalizeThemeColor(saved?.colorScheme?.main),
    secondary: normalizeThemeColor(saved?.colorScheme?.secondary),
    text: normalizeThemeColor(saved?.colorScheme?.text)
  },
  fontMain:
    typeof saved?.fontMain === 'string'
      ? saved.fontMain
      : typeof saved?.fontFamily === 'string'
        ? saved.fontFamily
        : defaultSettings.fontMain,
  fontSecondary:
    typeof saved?.fontSecondary === 'string'
      ? saved.fontSecondary
      : typeof saved?.fontFamily === 'string'
        ? saved.fontFamily
        : defaultSettings.fontSecondary,
  customThemeName:
    typeof saved?.customThemeName === 'string' ? saved.customThemeName : defaultSettings.customThemeName,
  monkMode: Boolean(saved?.monkMode),
  dailyGoal: typeof saved?.dailyGoal === 'string' ? saved.dailyGoal : defaultSettings.dailyGoal,
  shutdownChecklist: {
    ...defaultSettings.shutdownChecklist,
    ...(saved?.shutdownChecklist && typeof saved.shutdownChecklist === 'object'
      ? saved.shutdownChecklist
      : {})
  },
  mainViewSlots: normalizeMainViewSlots(saved?.mainViewSlots, saved?.mainViewModules),
  mainViewColumnSplit: clampNumber(saved?.mainViewColumnSplit, 20, 80, 50),
  mainViewRowSplit: clampNumber(saved?.mainViewRowSplit, 20, 80, 50),
  collapsedMainViewSlots: Array.from(
    new Set(
      normalizeStringArray(saved?.collapsedMainViewSlots).filter((slot) =>
        ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(slot)
      )
    )
  ) as AppSettings['collapsedMainViewSlots'],
  activityPetId: isActivityPetId(saved?.activityPetId) ? saved.activityPetId : defaultSettings.activityPetId,
  activityPetVisible:
    saved?.activityPetVisible === undefined
      ? defaultSettings.activityPetVisible
      : Boolean(saved.activityPetVisible),
  activityFlameAnimationEnabled:
    saved?.activityFlameAnimationEnabled === undefined
      ? defaultSettings.activityFlameAnimationEnabled
      : Boolean(saved.activityFlameAnimationEnabled),
  activityClearedBefore:
    typeof saved?.activityClearedBefore === 'string' ? saved.activityClearedBefore : undefined,
  mainViewModules: normalizeMainViewModules(saved?.mainViewModules),
  animationsEnabled:
    saved?.animationsEnabled === undefined
      ? defaultSettings.animationsEnabled
      : Boolean(saved.animationsEnabled),
  sidebarVisible:
    saved?.sidebarVisible === undefined ? defaultSettings.sidebarVisible : Boolean(saved.sidebarVisible),
  focusMediaUrl:
    typeof saved?.focusMediaUrl === 'string' && saved.focusMediaUrl.trim()
      ? saved.focusMediaUrl.trim().slice(0, 2048)
      : defaultSettings.focusMediaUrl,
  sidebarWidth: Math.min(560, Math.max(240, Number(saved?.sidebarWidth) || defaultSettings.sidebarWidth)),
  clockHeight: Math.min(360, Math.max(96, Number(saved?.clockHeight) || defaultSettings.clockHeight)),
  clockTextScale: Math.min(
    1.4,
    Math.max(0.7, Number(saved?.clockTextScale) || defaultSettings.clockTextScale)
  ),
  clockBackgroundVisible:
    saved?.clockBackgroundVisible === undefined
      ? defaultSettings.clockBackgroundVisible
      : Boolean(saved.clockBackgroundVisible),
  clockTextColor: normalizeThemeColor(saved?.clockTextColor),
  clockBackgroundColor: normalizeThemeColor(saved?.clockBackgroundColor),
  clockDisplayMode: saved?.clockDisplayMode === 'analog' ? 'analog' : defaultSettings.clockDisplayMode,
  modalTransparency: Math.min(
    100,
    Math.max(0, Number(saved?.modalTransparency ?? defaultSettings.modalTransparency))
  ),
  modalBlur: Math.min(64, Math.max(0, Number(saved?.modalBlur ?? defaultSettings.modalBlur))),
  roles: normalizeRoles(saved?.roles),
  tagGoals: normalizeTagGoals(saved?.tagGoals),
  tagInventory: normalizeTagInventory(saved?.tagInventory),
  tagAliases: normalizeTagAliases(saved?.tagAliases),
  projects: normalizeProjects(saved?.projects),
  webhookProviderSettings: normalizeWebhookProviderSettings(saved?.webhookProviderSettings),
  mobileFocusMode: Boolean(saved?.mobileFocusMode),
  collapsedBoardLanes: Array.from(
    new Set(
      normalizeStringArray(saved?.collapsedBoardLanes).filter((status) =>
        validStatuses.includes(status as TaskStatus)
      )
    )
  ) as TaskStatus[],
  autoPromoteNextTask:
    saved?.autoPromoteNextTask === undefined
      ? defaultSettings.autoPromoteNextTask
      : Boolean(saved.autoPromoteNextTask),
  resizeHandleVisible:
    saved?.resizeHandleVisible === undefined
      ? defaultSettings.resizeHandleVisible
      : Boolean(saved.resizeHandleVisible),
  resizeHandleThickness: clampNumber(
    saved?.resizeHandleThickness,
    1,
    16,
    defaultSettings.resizeHandleThickness
  ),
  resizeHandleLength: clampNumber(saved?.resizeHandleLength, 1, 160, defaultSettings.resizeHandleLength),
  resizeHandleColor: normalizeThemeColor(saved?.resizeHandleColor) || defaultSettings.resizeHandleColor,
  timelineHourLinesVisible:
    saved?.timelineHourLinesVisible === undefined
      ? defaultSettings.timelineHourLinesVisible
      : Boolean(saved.timelineHourLinesVisible),
  timelineNowLineVisible:
    saved?.timelineNowLineVisible === undefined
      ? defaultSettings.timelineNowLineVisible
      : Boolean(saved.timelineNowLineVisible),
  layoutPreset: ['compact', 'three-column', 'full'].includes(saved?.layoutPreset)
    ? saved.layoutPreset
    : saved?.layoutPreset === 'standard'
      ? 'three-column'
      : defaultSettings.layoutPreset,
  ...normalizeSchemaSettings({
    ...(saved || {}),
    layoutPreset: saved?.layoutPreset === 'standard' ? 'three-column' : saved?.layoutPreset
  }),
  columnWidths: {
    ...defaultSettings.columnWidths,
    ...(saved?.columnWidths || {}),
    backlog: saved?.columnWidths?.backlog ?? saved?.columnWidths?.new ?? defaultSettings.columnWidths.backlog
  },
  compactColumnWidths: { ...defaultSettings.compactColumnWidths, ...(saved?.compactColumnWidths || {}) },
  compactHeights: { ...defaultSettings.compactHeights, ...(saved?.compactHeights || {}) },
  boardColumnOrder: normalizeBoardColumnOrder(saved?.boardColumnOrder)
});

export const normalizeImportedProfileSettings = (settings) => {
  const normalized = mergeSettings(settings);
  return {
    roles: normalized.roles,
    tagGoals: normalized.tagGoals,
    projects: normalized.projects
  };
};

export const emptyGoalCadence = () => normalizeGoalCadence({});
