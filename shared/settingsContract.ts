import { z } from 'zod';
import { activityPetIds } from './activityPets.js';

export const taskStatusIds = ['backlog', 'in-progress', 'done', 'rejected'] as const;
export const visualThemeIds = [
  'default',
  'zen',
  'tokyo-night',
  'liquid-glass',
  'obsidian-glass',
  'terminal',
  'terminal-white',
  'catppuccin',
  'gruvbox',
  'dracula',
  'github-light',
  'github-dark',
  'nord',
  'night-owl'
] as const;
export const mainViewModuleIds = ['focus', 'activity', 'calendar', 'media', 'clock'] as const;
export const mainViewSlotIds = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
export const mainViewSlotContentIds = [
  ...mainViewModuleIds,
  'timeline',
  'calendar-media',
  'clock-timeline',
  'focus-current',
  'activity-current',
  'clock-media-timeline'
] as const;

export type TaskStatusId = (typeof taskStatusIds)[number];
export type VisualThemeId = (typeof visualThemeIds)[number];
export type MainViewModuleId = (typeof mainViewModuleIds)[number];
export type MainViewSlotId = (typeof mainViewSlotIds)[number];
export type MainViewSlotContentId = (typeof mainViewSlotContentIds)[number];

const taskStatusSchema = z.enum(taskStatusIds);
const mainViewSlotContentSchema = z.enum(mainViewSlotContentIds);
const goalCadenceSchema = z.object({
  dailyTargetHours: z.number(),
  weeklyTargetHours: z.number(),
  monthlyTargetHours: z.number()
});
const roleDefinitionSchema = goalCadenceSchema.extend({
  id: z.string(),
  name: z.string(),
  tags: z.array(z.string())
});
const tagGoalSchema = goalCadenceSchema.extend({ id: z.string(), tag: z.string() });
const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['active', 'paused', 'completed']),
  tags: z.array(z.string()),
  taskIds: z.array(z.string()),
  milestones: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() }))
});

export const appSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  visualTheme: z.enum(visualThemeIds),
  colorScheme: z.object({ main: z.string(), secondary: z.string(), text: z.string() }),
  fontMain: z.string(),
  fontSecondary: z.string(),
  fontUI: z.string(),
  customThemeName: z.string(),
  monkMode: z.boolean(),
  monkModeOpenedAt: z.string().optional(),
  dailyGoal: z.string(),
  shutdownChecklist: z.record(z.string(), z.boolean()),
  sidebarVisible: z.boolean(),
  animationsEnabled: z.boolean(),
  clockFormat: z.enum(['12h', '24h']),
  showSeconds: z.boolean(),
  sidebarWidgets: z.array(z.string()),
  mainViewSlots: z
    .object({
      topLeft: mainViewSlotContentSchema,
      topRight: mainViewSlotContentSchema,
      bottomLeft: mainViewSlotContentSchema,
      bottomRight: mainViewSlotContentSchema
    })
    .optional(),
  mainViewColumnSplit: z.number().min(20).max(80).optional(),
  mainViewRowSplit: z.number().min(20).max(80).optional(),
  collapsedMainViewSlots: z.array(z.enum(mainViewSlotIds)).optional(),
  activityPetId: z.enum(activityPetIds).optional(),
  activityPetVisible: z.boolean().optional(),
  activityFlameAnimationEnabled: z.boolean().optional(),
  activityClearedBefore: z.iso.datetime().optional(),
  mainViewModules: z
    .array(
      z.object({
        id: z.enum(mainViewModuleIds),
        area: z.enum(['center', 'right']),
        visible: z.boolean()
      })
    )
    .max(mainViewModuleIds.length),
  focusMediaUrl: z.string().max(2048),
  sidebarWidth: z.number(),
  clockHeight: z.number(),
  clockTextScale: z.number(),
  clockBackgroundVisible: z.boolean(),
  clockTextColor: z.string(),
  clockBackgroundColor: z.string(),
  clockDisplayMode: z.enum(['digital', 'analog']),
  modalTransparency: z.number(),
  modalBlur: z.number(),
  layoutPreset: z.enum(['compact', 'three-column', 'full']),
  textSize: z.enum(['small', 'medium', 'large']),
  roles: z.array(roleDefinitionSchema),
  tagGoals: z.array(tagGoalSchema),
  tagInventory: z.array(z.string()),
  tagAliases: z.record(z.string(), z.string()),
  projects: z.array(projectSchema),
  mobileFocusMode: z.boolean(),
  collapsedBoardLanes: z.array(taskStatusSchema),
  collapseTasks: z.boolean(),
  autoPromoteNextTask: z.boolean(),
  resizeHandleVisible: z.boolean(),
  resizeHandleThickness: z.number(),
  resizeHandleLength: z.number(),
  resizeHandleColor: z.string(),
  timelineHourLinesVisible: z.boolean(),
  timelineNowLineVisible: z.boolean(),
  notificationsEnabled: z.boolean(),
  webhookAlertsEnabled: z.boolean(),
  webhookProviderSettings: z.object({
    discord: z.object({ enabled: z.boolean(), template: z.string().max(4000) }),
    slack: z.object({ enabled: z.boolean(), template: z.string().max(4000) }),
    telegram: z.object({ enabled: z.boolean(), template: z.string().max(4000) })
  }),
  columnWidths: z.object({
    backlog: z.number(),
    inProgress: z.number(),
    done: z.number(),
    rejected: z.number(),
    new: z.number().optional()
  }),
  compactColumnWidths: z.object({ left: z.number(), right: z.number() }),
  compactHeights: z.object({
    backlog: z.number(),
    inProgress: z.number(),
    done: z.number(),
    rejected: z.number()
  }),
  boardColumnOrder: z.object({
    compactActive: z.array(taskStatusSchema),
    compactDone: z.array(taskStatusSchema),
    threeColumn: z.array(taskStatusSchema),
    full: z.array(taskStatusSchema)
  })
});

export type PersistedAppSettings = z.infer<typeof appSettingsSchema>;
