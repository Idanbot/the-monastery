import type { ActivityEntry, Task, TimeLog } from './types';

export type ActivityDay = {
  date: string;
  trackedMs: number;
  completedSubtasks: number;
  completedTasks: number;
  score: number;
};

export type ActivitySummary = {
  days: ActivityDay[];
  totalTrackedMs: number;
  completedSubtasks: number;
  completedTasks: number;
  currentStreak: number;
};

type ActivityOptions = { now?: number; days?: number; clearedBefore?: string };

const dateKey = (value: number | string) => new Date(value).toISOString().slice(0, 10);
const validTimestamp = (value: string | null | undefined) => {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};
const isSubtaskCompletion = (entry: ActivityEntry) =>
  entry.kind === 'subtask-completed' || /^completed subtask:/i.test(entry.text);
const isTaskCompletion = (entry: ActivityEntry) =>
  entry.kind === 'task-completed' || /^(marked done|status changed to done)$/i.test(entry.text);

export const buildActivitySummary = (
  tasks: Task[],
  { now = Date.now(), days = 90, clearedBefore }: ActivityOptions = {}
): ActivitySummary => {
  const cutoff = validTimestamp(clearedBefore);
  const safeDays = Math.max(1, Math.floor(days));
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const firstDay = new Date(today);
  firstDay.setUTCDate(firstDay.getUTCDate() - safeDays + 1);
  const byDate = new Map<string, ActivityDay>();

  for (let offset = 0; offset < safeDays; offset++) {
    const date = new Date(firstDay);
    date.setUTCDate(date.getUTCDate() + offset);
    const key = date.toISOString().slice(0, 10);
    byDate.set(key, { date: key, trackedMs: 0, completedSubtasks: 0, completedTasks: 0, score: 0 });
  }

  const addTrackedLog = (log: TimeLog, activeEnd = now) => {
    const parsedStart = validTimestamp(log.start);
    const end = validTimestamp(log.end) ?? activeEnd;
    if (parsedStart === null || !Number.isFinite(end)) return;
    const start = cutoff === null ? parsedStart : Math.max(parsedStart, cutoff);
    if (end <= start) return;
    let cursor = start;
    while (cursor < end) {
      const current = new Date(cursor);
      const nextDay = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 1);
      const segmentEnd = Math.min(end, nextDay);
      const day = byDate.get(dateKey(cursor));
      if (day) day.trackedMs += segmentEnd - cursor;
      cursor = segmentEnd;
    }
  };

  const addCompletion = (timestamp: string, kind: 'subtask' | 'task', amount = 1) => {
    const parsed = validTimestamp(timestamp);
    if (parsed === null || (cutoff !== null && parsed <= cutoff)) return;
    const day = byDate.get(dateKey(parsed));
    if (!day) return;
    if (kind === 'subtask') day.completedSubtasks += amount;
    else day.completedTasks += amount;
  };

  tasks.forEach((task) => {
    task.logs.forEach((log) => addTrackedLog(log));
    if (task.activeLogStart) addTrackedLog({ start: task.activeLogStart, end: null });
    task.subtasks.forEach((subtask) => {
      subtask.logs.forEach((log) => addTrackedLog(log));
      if (subtask.activeLogStart) addTrackedLog({ start: subtask.activeLogStart, end: null });
    });

    const subtaskCompletions = task.activity.filter(isSubtaskCompletion);
    const taskCompletions = task.activity.filter(isTaskCompletion);
    subtaskCompletions.forEach((entry) => addCompletion(entry.timestamp, 'subtask'));
    taskCompletions.forEach((entry) => addCompletion(entry.timestamp, 'task'));

    const fallbackTimestamp = task.activity.at(-1)?.timestamp || task.createdAt;
    const doneSubtasks = task.subtasks.filter((subtask) => subtask.status === 'done').length;
    if (doneSubtasks > subtaskCompletions.length) {
      addCompletion(fallbackTimestamp, 'subtask', doneSubtasks - subtaskCompletions.length);
    }
    if (task.status === 'done' && taskCompletions.length === 0) {
      addCompletion(fallbackTimestamp, 'task');
    }
  });

  const activityDays = Array.from(byDate.values()).map((day) => ({
    ...day,
    score:
      (day.trackedMs > 0 ? Math.max(1, Math.ceil(day.trackedMs / (25 * 60_000))) : 0) +
      day.completedSubtasks +
      day.completedTasks * 2
  }));
  let currentStreak = 0;
  for (let index = activityDays.length - 1; index >= 0; index--) {
    if (activityDays[index].score > 0) currentStreak++;
    else if (index !== activityDays.length - 1) break;
  }

  return {
    days: activityDays,
    totalTrackedMs: activityDays.reduce((total, day) => total + day.trackedMs, 0),
    completedSubtasks: activityDays.reduce((total, day) => total + day.completedSubtasks, 0),
    completedTasks: activityDays.reduce((total, day) => total + day.completedTasks, 0),
    currentStreak
  };
};
