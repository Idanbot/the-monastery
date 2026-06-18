export type TaskStatus = 'new' | 'done' | 'rejected';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type VisualTheme =
  | 'default'
  | 'zen'
  | 'tokyo-night'
  | 'liquid-glass'
  | 'terminal'
  | 'terminal-clean'
  | 'terminal-white'
  | 'terminal-clean-white';

export type ThemeColorScheme = {
  main: string;
  secondary: string;
};

export type TimeLog = {
  start: string;
  end: string | null;
};

export type ActivityEntry = {
  id: string;
  type: 'system' | 'note';
  text: string;
  timestamp: string;
};

export type Subtask = {
  id: string;
  title: string;
  status: TaskStatus;
  logs: TimeLog[];
  activeLogStart: string | null;
  tags: string[];
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  urgency: number;
  tags: string[];
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  recurrence: TaskRecurrence;
  recurrenceRootId: string | null;
  subtasks: Subtask[];
  logs: TimeLog[];
  activeLogStart: string | null;
  activity: ActivityEntry[];
};

export type RoleDefinition = {
  id: string;
  name: string;
  tags: string[];
  weeklyTargetHours: number;
};

export type AppSettings = {
  theme: 'system' | 'light' | 'dark';
  visualTheme: VisualTheme;
  colorScheme: ThemeColorScheme;
  monkMode: boolean;
  sidebarVisible: boolean;
  animationsEnabled: boolean;
  clockFormat: '12h' | '24h';
  showSeconds: boolean;
  sidebarWidgets: string[];
  sidebarWidth: number;
  clockHeight: number;
  clockTextScale: number;
  modalTransparency: number;
  layoutPreset: 'standard' | 'compact';
  textSize: 'small' | 'medium' | 'large';
  roles: RoleDefinition[];
  collapseTasks: boolean;
  columnWidths: { new: number; done: number; rejected: number };
  compactColumnWidths: { left: number; right: number };
  compactHeights: { done: number; rejected: number };
};

export type Profile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
};

export type ImportPreview = {
  imported: Task[];
  newTasks: Task[];
  updatedTasks: Task[];
  unchangedTasks: Task[];
};
