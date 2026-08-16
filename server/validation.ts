import { z } from 'zod';
import { appSettingsSchema, taskStatusIds } from '../shared/settingsContract.js';

export { appSettingsSchema } from '../shared/settingsContract.js';

const taskStatusSchema = z.preprocess(
  (value) => (value === 'new' ? 'backlog' : value),
  z.enum(taskStatusIds)
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
