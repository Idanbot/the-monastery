import type { Task } from './types';

export const getWeekDates = (date: Date): Date[] => {
  const current = new Date(date);
  const day = current.getDay();
  // Adjust so Monday is 0, Sunday is 6
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  
  return Array.from({ length: 7 }).map((_, i) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    return next;
  });
};

export const getTasksForDate = (tasks: Task[], date: string): Task[] => {
  return tasks.filter(
    (task) =>
      task.status !== 'done' &&
      task.status !== 'rejected' &&
      task.scheduledDate === date &&
      task.scheduledStart
  );
};

export const getUnscheduledTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(
    (task) =>
      task.status !== 'done' &&
      task.status !== 'rejected' &&
      (!task.scheduledDate || !task.scheduledStart)
  );
};

export const snapToSlot = (minutes: number, slotSize = 15): number => {
  return Math.round(minutes / slotSize) * slotSize;
};

export const clockTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const minutesToClockTime = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(1439, minutes));
  const hours = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${mins}`;
};
