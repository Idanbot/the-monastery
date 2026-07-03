import type { AppSettings, Task, TaskRecurrence, TaskStatus } from './types';
import { visualThemeIds } from './themes';
import { normalizeSchemaSettings, schemaSettingDefaults } from './settingsSchema';

export const validStatuses: TaskStatus[] = ['backlog', 'in-progress', 'done', 'rejected'];
export const taskStatuses = validStatuses;
export const activeTaskStatuses: TaskStatus[] = ['in-progress'];
export const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In-Progress',
  done: 'Done',
  rejected: 'Rejected'
};

export const defaultBoardColumnOrder = {
  compactActive: ['backlog', 'in-progress'] as TaskStatus[],
  compactDone: ['done', 'rejected'] as TaskStatus[],
  threeColumn: ['backlog', 'in-progress', 'done', 'rejected'] as TaskStatus[],
  full: ['backlog', 'in-progress', 'done', 'rejected'] as TaskStatus[]
};

export const normalizeBoardColumnOrder = (saved) => {
  const normalizeOrder = (value, fallback: TaskStatus[]) => {
    const order = Array.isArray(value) ? value.filter((status) => validStatuses.includes(status)) : [];
    return [...new Set([...order, ...fallback])] as TaskStatus[];
  };

  return {
    compactActive: normalizeOrder(saved?.compactActive, defaultBoardColumnOrder.compactActive).filter(
      (status) => defaultBoardColumnOrder.compactActive.includes(status)
    ),
    compactDone: normalizeOrder(saved?.compactDone, defaultBoardColumnOrder.compactDone).filter((status) =>
      defaultBoardColumnOrder.compactDone.includes(status)
    ),
    threeColumn: normalizeOrder(saved?.threeColumn, defaultBoardColumnOrder.threeColumn).slice(0, 4),
    full: normalizeOrder(saved?.full, defaultBoardColumnOrder.full).slice(0, 4)
  };
};

export const normalizeTaskStatus = (status): TaskStatus => {
  if (status === 'new') return 'backlog';
  return validStatuses.includes(status) ? status : 'backlog';
};
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
  fontMain: "Inter, 'Space Grotesk', system-ui, sans-serif",
  fontSecondary: "'Space Grotesk', system-ui, sans-serif",
  fontUI: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  customThemeName: 'Custom Liquid Glass',
  monkMode: false,
  dailyGoal: '',
  shutdownChecklist: { review: false, plan: false, clear: false },
  sidebarWidgets: ['now', 'clock', 'agenda'],
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

export const cloneTask = (task) => JSON.parse(JSON.stringify(task));

export const normalizeStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

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
  if (!Array.isArray(rawTasks))
    throw new Error('Import must be an array of tasks or an export object with a tasks array.');
  return rawTasks.map(normalizeTask);
};

const normalizeImportedTagList = (tags) =>
  Array.from(
    new Set(
      normalizeStringArray(tags)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );

const normalizeGoalMap = (goals) => {
  if (!goals || typeof goals !== 'object' || Array.isArray(goals)) return [];
  return Object.entries(goals)
    .filter(([tag]) => tag.trim())
    .map(([tag, value]) => ({
      id: generateId(),
      tag,
      ...(typeof value === 'number'
        ? { weeklyTargetHours: value }
        : value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : {})
    }));
};

export const normalizePlanningImportPayload = (payload) => {
  const source = payload?.profile || payload?.profiles?.[0] || payload;
  const settingsSource = source?.settings || source || {};
  const rawTasks = Array.isArray(source)
    ? source.map((item) => (typeof item === 'string' ? { title: item } : item))
    : source?.tasks || [];
  const rawRoles = settingsSource.roles || [];
  const rawGoals = settingsSource.tagGoals || settingsSource.goals || [];
  const mappedGoals = normalizeGoalMap(settingsSource.goals);
  const tasks = normalizeTasksPayload({ tasks: rawTasks });
  const projects = normalizeProjects(settingsSource.projects);
  const roles = normalizeRoles(rawRoles);
  const explicitTags = normalizeImportedTagList(settingsSource.tags);
  const roleTags = roles.flatMap((role) => role.tags || []);
  const taskTags = tasks.flatMap((task) => getEffectiveTags(task));
  const goals = normalizeTagGoals(Array.isArray(rawGoals) ? rawGoals : []).concat(
    normalizeTagGoals(mappedGoals)
  );
  const goalTags = goals.map((goal) => goal.tag);
  const tags = Array.from(new Set([...explicitTags, ...roleTags, ...taskTags, ...goalTags].filter(Boolean)));
  const existingGoalTags = new Set(goals.map((goal) => goal.tag.toLowerCase()));
  const tagGoals = [
    ...goals,
    ...explicitTags
      .filter((tag) => !existingGoalTags.has(tag.toLowerCase()))
      .map((tag) => ({ id: generateId(), tag, ...normalizeGoalCadence({}) }))
  ];

  if (!tasks.length && !roles.length && !tags.length && !tagGoals.length && !projects.length) {
    throw new Error('Import must include tasks, roles, projects, tags, tagGoals, or goals.');
  }

  return { tasks, roles, projects, tags, tagGoals };
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
