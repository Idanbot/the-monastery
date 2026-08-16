import type { TaskRecurrence } from './types';

export const validRecurrences: TaskRecurrence[] = ['none', 'daily', 'weekly', 'monthly'];

export const formatTime = (dateObj, format = '12h', showSeconds = false) => {
  if (!dateObj) return '--:--';
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h'
  };
  if (showSeconds) options.second = '2-digit';
  return new Intl.DateTimeFormat('en-US', options).format(new Date(dateObj));
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Unscheduled';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

export const formatDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateTotalDuration = (logs) =>
  logs.reduce((total, log) => {
    const start = new Date(log.start).getTime();
    const end = log.end ? new Date(log.end).getTime() : Date.now();
    return total + (end - start);
  }, 0);

export const formatDurationString = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatLiveTimer = (startIso, now) => {
  if (!startIso) return '00:00:00';
  const diff = Math.max(0, now - new Date(startIso).getTime());
  const h = Math.floor(diff / 3600000)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((diff / 60000) % 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor((diff / 1000) % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const toDateTimeLocal = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export const fromDateTimeLocal = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getNextRecurringDate = (dateString, recurrence) => {
  if (!dateString || recurrence === 'none') return '';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';

  if (recurrence === 'daily') return formatDateInputValue(addDays(date, 1));
  if (recurrence === 'weekly') return formatDateInputValue(addDays(date, 7));
  if (recurrence === 'monthly') {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return formatDateInputValue(next);
  }

  return '';
};
