import type { Task } from './types';
import { validRecurrences } from './dateTime';
import { generateId } from './ids';
import { normalizeTaskStatus } from './taskStatus';

export const defaultTasks: Task[] = [];

export const cloneTask = (task) => JSON.parse(JSON.stringify(task));

export const normalizeStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

export const normalizeLogs = (logs) =>
  Array.isArray(logs)
    ? logs
        .filter((log) => log && typeof log.start === 'string')
        .map((log) => ({ start: log.start, end: typeof log.end === 'string' ? log.end : null }))
    : [];

export const normalizeActivity = (activity) =>
  Array.isArray(activity)
    ? activity
        .filter((entry) => entry && typeof entry.text === 'string')
        .map((entry) => ({
          id: typeof entry.id === 'string' ? entry.id : generateId(),
          type: entry.type === 'note' ? ('note' as const) : ('system' as const),
          ...(['task-completed', 'subtask-completed', 'focus-session', 'time-tracked'].includes(entry.kind)
            ? { kind: entry.kind }
            : {}),
          ...(typeof entry.subjectId === 'string' && entry.subjectId ? { subjectId: entry.subjectId } : {}),
          text: entry.text,
          timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : new Date().toISOString()
        }))
    : [];

const noteTextFromImport = (note) => {
  if (typeof note === 'string') return note.trim();
  if (!note || typeof note !== 'object') return '';
  const text = typeof note.text === 'string' ? note.text.trim() : '';
  const title = typeof note.title === 'string' ? note.title.trim() : '';
  const url = typeof note.url === 'string' ? note.url.trim() : '';
  const base = text || title || url;
  if (!base) return '';
  return url && !base.includes(url) ? base + '\n' + url : base;
};

const normalizeImportedNotes = (task) => {
  const rawNotes = [
    ...(Array.isArray(task.notes) ? task.notes : task.notes === undefined ? [] : [task.notes]),
    ...(task.note === undefined ? [] : [task.note])
  ];

  return rawNotes
    .map((note) => ({ raw: note, text: noteTextFromImport(note) }))
    .filter(({ text }) => text.length > 0)
    .map(({ raw, text }) => ({
      id: typeof raw?.id === 'string' ? raw.id : generateId(),
      type: 'note' as const,
      text,
      timestamp: typeof raw?.timestamp === 'string' ? raw.timestamp : new Date().toISOString()
    }));
};

export const normalizeSubtasks = (subtasks) =>
  Array.isArray(subtasks)
    ? subtasks.map((subtask) => ({
        id: typeof subtask.id === 'string' ? subtask.id : generateId(),
        title: typeof subtask.title === 'string' ? subtask.title : '',
        status: normalizeTaskStatus(subtask.status),
        logs: normalizeLogs(subtask.logs),
        activeLogStart: typeof subtask.activeLogStart === 'string' ? subtask.activeLogStart : null,
        tags: normalizeStringArray(subtask.tags)
      }))
    : [];

export const normalizeTask = (task): Task => {
  if (!task || typeof task !== 'object') throw new Error('Every task must be an object.');
  return {
    id: typeof task.id === 'string' ? task.id : generateId(),
    title: typeof task.title === 'string' ? task.title : '',
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
    status: normalizeTaskStatus(task.status),
    urgency: Math.min(
      10,
      Math.max(1, Number.isFinite(Number(task.urgency)) ? Math.round(Number(task.urgency)) : 5)
    ),
    tags: normalizeStringArray(task.tags),
    scheduledDate: typeof task.scheduledDate === 'string' ? task.scheduledDate : '',
    scheduledStart: typeof task.scheduledStart === 'string' ? task.scheduledStart : '',
    scheduledEnd: typeof task.scheduledEnd === 'string' ? task.scheduledEnd : '',
    recurrence: validRecurrences.includes(task.recurrence) ? task.recurrence : 'none',
    recurrenceRootId: typeof task.recurrenceRootId === 'string' ? task.recurrenceRootId : null,
    subtasks: normalizeSubtasks(task.subtasks),
    logs: normalizeLogs(task.logs),
    activeLogStart: typeof task.activeLogStart === 'string' ? task.activeLogStart : null,
    activity: [...normalizeActivity(task.activity), ...normalizeImportedNotes(task)]
  };
};

export const normalizeTasksPayload = (payload): Task[] => {
  const rawTasks = Array.isArray(payload) ? payload : payload?.tasks;
  if (!Array.isArray(rawTasks)) {
    throw new Error('Import must be an array of tasks or an export object with a tasks array.');
  }
  return rawTasks.map(normalizeTask);
};

export const getEffectiveTags = (task) => {
  const taskTags = task.tags || [];
  const subtaskTags = (task.subtasks || []).flatMap((subtask) => subtask.tags || []);
  return Array.from(new Set([...taskTags, ...subtaskTags]));
};
