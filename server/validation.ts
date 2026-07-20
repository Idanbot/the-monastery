import { z } from 'zod';

const taskStatusSchema = z.preprocess(
  (value) => (value === 'new' ? 'backlog' : value),
  z.enum(['backlog', 'in-progress', 'done', 'rejected'])
);
const recurrenceSchema = z.enum(['none', 'daily', 'weekly', 'monthly']);

const timeLogSchema = z.object({
  start: z.string(),
  end: z.string().nullable()
});

const activityEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['system', 'note']),
  text: z.string(),
  timestamp: z.string(),
  kind: z.enum(['task-completed', 'subtask-completed', 'focus-session', 'time-tracked']).optional(),
  subjectId: z.string().optional()
});

const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  logs: z.array(timeLogSchema),
  activeLogStart: z.string().nullable(),
  tags: z.array(z.string())
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  status: taskStatusSchema,
  urgency: z.number().int().min(1).max(10),
  tags: z.array(z.string()),
  scheduledDate: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  recurrence: recurrenceSchema,
  recurrenceRootId: z.string().nullable(),
  subtasks: z.array(subtaskSchema),
  logs: z.array(timeLogSchema),
  activeLogStart: z.string().nullable(),
  activity: z.array(activityEntrySchema)
});

export const tasksPayloadSchema = z.object({
  tasks: z.array(taskSchema),
  baseRevision: z.number().int().min(0).optional()
});

export const taskMutationPayloadSchema = z.object({
  task: taskSchema,
  position: z.number().int().min(0).optional(),
  baseRevision: z.number().int().min(0).optional()
});

const visualThemeSchema = z.enum([
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
]);

const taskStatusEnumSchema = z.enum(['backlog', 'in-progress', 'done', 'rejected']);
const mainViewModuleSchema = z.object({
  id: z.enum(['focus', 'activity', 'calendar', 'media', 'clock']),
  area: z.enum(['center', 'right']),
  visible: z.boolean()
});
const mainViewSlotContentSchema = z.enum([
  'focus',
  'activity',
  'calendar',
  'media',
  'clock',
  'timeline',
  'calendar-media',
  'clock-timeline',
  'focus-current',
  'activity-current',
  'clock-media-timeline'
]);

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

const tagGoalSchema = goalCadenceSchema.extend({
  id: z.string(),
  tag: z.string()
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['active', 'paused', 'completed']),
  tags: z.array(z.string()),
  taskIds: z.array(z.string()),
  milestones: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() }))
});

/**
 * Server-side validation for the settings payload. Previously the server
 * accepted any `Record<string, unknown>` and silently stored garbage that the
 * client's `mergeSettings` would drop. This schema mirrors `AppSettings` from
 * `src/domain/types.ts` and rejects unknown/garbage writes at the boundary.
 */
export const appSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  visualTheme: visualThemeSchema,
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
  collapsedMainViewSlots: z.array(z.enum(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'])).optional(),
  activityPetId: z.enum(['aurelius', 'kitten']).optional(),
  activityPetVisible: z.boolean().optional(),
  activityFlameAnimationEnabled: z.boolean().optional(),
  mainViewModules: z.array(mainViewModuleSchema).max(5),
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
  collapsedBoardLanes: z.array(taskStatusEnumSchema),
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
    compactActive: z.array(taskStatusEnumSchema),
    compactDone: z.array(taskStatusEnumSchema),
    threeColumn: z.array(taskStatusEnumSchema),
    full: z.array(taskStatusEnumSchema)
  })
});

export const settingsPayloadSchema = z.object({
  settings: appSettingsSchema,
  baseRevision: z.number().int().min(0).optional()
});

/**
 * Shape returned to clients when zod validation fails. Field-level issues let
 * the UI surface specific problems instead of a generic "is required" string.
 */
export const validationErrorResponse = (
  issues: readonly { path: readonly PropertyKey[]; message: string }[] | undefined
) => ({
  error: 'Validation failed.',
  issues: (issues ?? []).map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message
  }))
});
