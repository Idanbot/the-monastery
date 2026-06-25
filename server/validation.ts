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
  timestamp: z.string()
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
  tasks: z.array(taskSchema)
});

export const taskMutationPayloadSchema = z.object({
  task: taskSchema,
  position: z.number().int().min(0).optional()
});

export const settingsPayloadSchema = z.object({
  settings: z.record(z.string(), z.unknown())
});
