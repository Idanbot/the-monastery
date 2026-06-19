import type { AppSettings, Task, TaskRecurrence, TaskStatus } from './types';
import { visualThemeIds } from './themes';

export const validStatuses: TaskStatus[] = ['new', 'done', 'rejected'];
export const validRecurrences: TaskRecurrence[] = ['none', 'daily', 'weekly', 'monthly'];

export const generateId = () => Math.random().toString(36).substring(2, 9);

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

export const calculateTotalDuration = (logs) => {
  return logs.reduce((total, log) => {
    const start = new Date(log.start).getTime();
    const end = log.end ? new Date(log.end).getTime() : Date.now();
    return total + (end - start);
  }, 0);
};

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

export const getEffectiveTags = (task) => {
  const taskTags = task.tags || [];
  const subtaskTags = (task.subtasks || []).flatMap((s) => s.tags || []);
  return Array.from(new Set([...taskTags, ...subtaskTags]));
};

export const defaultTasks: Task[] = [];

export const defaultSettings: AppSettings = {
  theme: 'system',
  visualTheme: 'liquid-glass',
  colorScheme: { main: '#4f46e5', secondary: '#64748b', text: '#1e293b' },
  fontMain: "Inter, 'Space Grotesk', system-ui, sans-serif",
  fontSecondary: "'Space Grotesk', system-ui, sans-serif",
  fontUI: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  customThemeName: 'Custom Liquid Glass',
  monkMode: false,
  dailyGoal: '',
  shutdownChecklist: { review: false, plan: false, clear: false },
  sidebarVisible: true,
  animationsEnabled: true,
  clockFormat: '24h',
  showSeconds: true,
  sidebarWidgets: ['now', 'clock', 'agenda'],
  sidebarWidth: 320,
  clockHeight: 160,
  clockTextScale: 1,
  clockBackgroundVisible: true,
  clockTextColor: '',
  clockBackgroundColor: '',
  clockDisplayMode: 'digital',
  modalTransparency: 35,
  modalBlur: 1,
  layoutPreset: 'compact',
  textSize: 'medium',
  roles: [],
  tagGoals: [],
  collapseTasks: false,
  resizeHandleVisible: true,
  resizeHandleThickness: 4,
  resizeHandleLength: 48,
  resizeHandleColor: '#94a3b8',
  timelineHourLinesVisible: true,
  timelineNowLineVisible: true,
  columnWidths: { new: 33.33, done: 33.33, rejected: 33.33 },
  compactColumnWidths: { left: 50, right: 50 },
  compactHeights: { done: 50, rejected: 50 }
};

export const cloneTask = (task) => JSON.parse(JSON.stringify(task));

export const normalizeStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

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
  fontMain: typeof saved?.fontMain === 'string' ? saved.fontMain : (typeof saved?.fontFamily === 'string' ? saved.fontFamily : defaultSettings.fontMain),
  fontSecondary: typeof saved?.fontSecondary === 'string' ? saved.fontSecondary : (typeof saved?.fontFamily === 'string' ? saved.fontFamily : defaultSettings.fontSecondary),
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
  animationsEnabled:
    saved?.animationsEnabled === undefined
      ? defaultSettings.animationsEnabled
      : Boolean(saved.animationsEnabled),
  sidebarVisible:
    saved?.sidebarVisible === undefined ? defaultSettings.sidebarVisible : Boolean(saved.sidebarVisible),
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
  columnWidths: { ...defaultSettings.columnWidths, ...(saved?.columnWidths || {}) },
  compactColumnWidths: { ...defaultSettings.compactColumnWidths, ...(saved?.compactColumnWidths || {}) },
  compactHeights: { ...defaultSettings.compactHeights, ...(saved?.compactHeights || {}) }
});

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
          text: entry.text,
          timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : new Date().toISOString()
        }))
    : [];

export const normalizeSubtasks = (subtasks) =>
  Array.isArray(subtasks)
    ? subtasks.map((subtask) => ({
        id: typeof subtask.id === 'string' ? subtask.id : generateId(),
        title: typeof subtask.title === 'string' ? subtask.title : '',
        status: validStatuses.includes(subtask.status) ? subtask.status : 'new',
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
    status: validStatuses.includes(task.status) ? task.status : 'new',
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
    activity: normalizeActivity(task.activity)
  };
};

export const normalizeTasksPayload = (payload): Task[] => {
  const rawTasks = Array.isArray(payload) ? payload : payload?.tasks;
  if (!Array.isArray(rawTasks))
    throw new Error('Import must be an array of tasks or an export object with a tasks array.');
  return rawTasks.map(normalizeTask);
};

export const taskMatchesSearch = (task, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const searchable = [
    task.title,
    task.status,
    task.scheduledDate,
    task.scheduledStart,
    task.scheduledEnd,
    ...(task.tags || []),
    ...(task.activity || []).flatMap((entry) => [entry.text, entry.type]),
    ...(task.subtasks || []).flatMap((subtask) => [subtask.title, subtask.status, ...(subtask.tags || [])])
  ];
  return searchable.some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(normalizedQuery)
  );
};
