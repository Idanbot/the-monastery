export type TaskStatus = 'backlog' | 'in-progress' | 'done' | 'rejected';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type VisualTheme =
  | 'default'
  | 'zen'
  | 'tokyo-night'
  | 'liquid-glass'
  | 'obsidian-glass'
  | 'terminal'
  | 'terminal-white'
  | 'catppuccin'
  | 'gruvbox'
  | 'dracula'
  | 'github-light'
  | 'github-dark'
  | 'nord'
  | 'night-owl';
export type ThemeColorScheme = {
  main: string;
  secondary: string;
  text: string;
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
  createdAt: string;
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

export type GoalCadence = {
  dailyTargetHours: number;
  weeklyTargetHours: number;
  monthlyTargetHours: number;
};

export type RoleDefinition = GoalCadence & {
  id: string;
  name: string;
  tags: string[];
};

export type TagGoal = GoalCadence & {
  id: string;
  tag: string;
};

export type AppSettings = {
  theme: 'system' | 'light' | 'dark';
  visualTheme: VisualTheme;
  colorScheme: ThemeColorScheme;
  fontMain: string;
  fontSecondary: string;
  fontUI: string;
  customThemeName: string;
  monkMode: boolean;
  monkModeOpenedAt?: string;
  dailyGoal: string;
  shutdownChecklist: Record<string, boolean>;
  sidebarVisible: boolean;
  animationsEnabled: boolean;
  clockFormat: '12h' | '24h';
  showSeconds: boolean;
  sidebarWidgets: string[];
  sidebarWidth: number;
  clockHeight: number;
  clockTextScale: number;
  clockBackgroundVisible: boolean;
  clockTextColor: string;
  clockBackgroundColor: string;
  clockDisplayMode: 'digital' | 'analog';
  modalTransparency: number;
  modalBlur: number;
  layoutPreset: 'compact' | 'three-column' | 'full';
  textSize: 'small' | 'medium' | 'large';
  roles: RoleDefinition[];
  tagGoals: TagGoal[];
  tagInventory: string[];
  tagAliases: Record<string, string>;
  mobileFocusMode: boolean;
  collapsedBoardLanes: TaskStatus[];
  collapseTasks: boolean;
  autoPromoteNextTask: boolean;
  resizeHandleVisible: boolean;
  resizeHandleThickness: number;
  resizeHandleLength: number;
  resizeHandleColor: string;
  timelineHourLinesVisible: boolean;
  timelineNowLineVisible: boolean;
  columnWidths: { backlog: number; inProgress: number; done: number; rejected: number; new?: number };
  compactColumnWidths: { left: number; right: number };
  compactHeights: { backlog: number; inProgress: number; done: number; rejected: number };
  boardColumnOrder: {
    compactActive: TaskStatus[];
    compactDone: TaskStatus[];
    threeColumn: TaskStatus[];
    full: TaskStatus[];
  };
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

export type ProfileImportPreview = {
  name: string;
  settings?: unknown;
  tasks: Task[];
  currentTaskCount: number;
};

export type PlanningImportPreview = {
  tasks: Task[];
  roles: RoleDefinition[];
  tags: string[];
  tagGoals: TagGoal[];
  newTasks: Task[];
  updatedTasks: Task[];
};

export type LocalBackup = {
  schemaVersion: number;
  id: string;
  label: string;
  createdAt: string;
  taskCount: number;
  profileName: string;
  settings: AppSettings;
  tasks: Task[];
};
