import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { loadInitialLocalTasks } from '../hooks/useLocalFallbackPersistence';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { useRecurringTasks } from '../hooks/useRecurringTasks';
import { useBoardController, type DragOverInfo } from '../hooks/useBoardController';
import { useSettingsContext } from './SettingsContext';
import { executeTaskCommand } from '../domain/taskCommands';
import { inferTaskTags } from '../domain/taskIntelligence';
import { rolePresets } from '../domain/rolePresets';
import { canonicalizeTags, applyTagTaxonomyCommand, type TagTaxonomyCommand } from '../domain/tagTaxonomy';
import { generateId, normalizeTask, activeTaskStatuses, formatDateInputValue } from '../domain/tasks';
import type { Task, TaskStatus } from '../domain/types';
import { defaultTagInventory } from '../domain/defaultTagInventory';

export type TaskOverrides = Partial<Task> & { activity?: Task['activity'] };

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  selectedTaskId: string | null;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  currentTask: Task | null;
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allUniqueTags: string[];
  filteredTasks: Task[];
  tagPool: string[];
  resolveTaskTags: (tags: string[]) => string[];
  registerTags: (tags: string[]) => void;
  runTagTaxonomyCommand: (command: TagTaxonomyCommand) => void;
  columnSorts: Record<TaskStatus, 'none' | 'urgency' | 'time'>;
  cycleSort: (status: TaskStatus) => void;
  draggedTaskId: string | null;
  dragOverInfo: DragOverInfo;
  setDraggedTaskId: (id: string | null) => void;
  setDragOverInfo: (info: DragOverInfo) => void;
  handleDragStart: (event: React.DragEvent<HTMLElement>, taskId: string) => void;
  handleDragOver: (
    event: React.DragEvent<HTMLElement>,
    status: TaskStatus,
    targetTaskId?: string | null
  ) => void;
  handleDrop: (event: React.DragEvent<HTMLElement>, status: TaskStatus) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  reorderTask: (taskId: string, direction: 'earlier' | 'later') => void;
  addTask: (status?: TaskStatus, overrides?: TaskOverrides, onCreated?: (task: Task) => void) => void;
  updateTaskTimer: (taskId: string) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  createRoleRoutineTasks: () => void;
  planMyDay: (onComplete?: () => void) => void;
  applyFocusPlan: (date: string, taskIds: string[], startMinutes: number) => void;
  recordFocusSession: (taskId: string, minutes: number) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(loadInitialLocalTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { settings, setSettings } = useSettingsContext();

  const {
    activeFilters,
    setActiveFilters,
    isFilterOpen,
    setIsFilterOpen,
    searchQuery,
    setSearchQuery,
    allUniqueTags,
    filteredTasks
  } = useTaskFilters(tasks);

  const {
    columnSorts,
    cycleSort,
    draggedTaskId,
    dragOverInfo,
    setDraggedTaskId,
    setDragOverInfo,
    handleDragStart,
    handleDragOver,
    handleDrop,
    moveTask,
    reorderTask
  } = useBoardController(setTasks);

  useRecurringTasks(tasks, setTasks);

  const tagPool = useMemo(
    () =>
      Array.from(
        new Set([
          ...allUniqueTags,
          ...(settings.tagInventory || []),
          ...(settings.roles || []).flatMap((role) => role.tags || []),
          ...(settings.tagGoals || []).map((goal) => goal.tag),
          ...defaultTagInventory,
          ...rolePresets.flatMap((preset) => preset.tags)
        ])
      )
        .filter(Boolean)
        .filter(
          (tag, index, tags) =>
            tags.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index
        )
        .sort((a, b) => a.localeCompare(b)),
    [allUniqueTags, settings.roles, settings.tagGoals, settings.tagInventory]
  );

  const resolveTaskTags = useCallback(
    (tags: string[]) => canonicalizeTags(tags, settings.tagAliases),
    [settings.tagAliases]
  );

  const registerTags = useCallback(
    (tags: string[]) => {
      setSettings((previous) => {
        const inventory = [...(previous.tagInventory || [])];
        const keys = new Set(inventory.map((tag) => tag.toLowerCase()));
        canonicalizeTags(tags, previous.tagAliases).forEach((tag) => {
          const trimmed = tag.trim();
          const key = trimmed.toLowerCase();
          if (!trimmed || keys.has(key)) return;
          keys.add(key);
          inventory.push(trimmed);
        });
        return inventory.length === (previous.tagInventory || []).length
          ? previous
          : { ...previous, tagInventory: inventory };
      });
    },
    [setSettings]
  );

  const runTagTaxonomyCommand = useCallback(
    (command: TagTaxonomyCommand) => {
      const result = applyTagTaxonomyCommand(tasks, settings, command);
      setTasks(result.tasks);
      setSettings(result.settings);
    },
    [settings, tasks, setSettings, setTasks]
  );

  const tagRoles = useMemo(() => settings.roles || [], [settings.roles]);

  const currentTask = useMemo(() => {
    const activeTask = tasks.find((task) => activeTaskStatuses.includes(task.status) && task.activeLogStart);
    if (activeTask) return activeTask;

    const today = formatDateInputValue(new Date());
    const scheduledToday = tasks
      .filter((task) => activeTaskStatuses.includes(task.status) && task.scheduledDate === today)
      .sort((a, b) => (a.scheduledStart || '99:99').localeCompare(b.scheduledStart || '99:99'))[0];
    if (scheduledToday) return scheduledToday;

    return tasks.find((task) => activeTaskStatuses.includes(task.status)) || null;
  }, [tasks]);

  const updateTaskTimer = useCallback((taskId: string) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'toggle-timer', taskId }).tasks);
  }, []);

  const startTask = useCallback((taskId: string) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'start', taskId }).tasks);
  }, []);

  const rejectTask = useCallback((taskId: string) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'move', taskId, status: 'rejected' }).tasks);
  }, []);

  const completeTask = useCallback(
    (taskId: string) => {
      setTasks(
        (previous) =>
          executeTaskCommand(previous, {
            type: 'complete',
            taskId,
            promoteNext: settings.autoPromoteNextTask
          }).tasks
      );
    },
    [settings.autoPromoteNextTask]
  );

  const addTask = useCallback(
    (status: TaskStatus = 'backlog', overrides: TaskOverrides = {}, onCreated?: (task: Task) => void) => {
      const createdAt = new Date().toISOString();
      const title = typeof overrides.title === 'string' ? overrides.title : '';
      const baseTags = Array.isArray(overrides.tags) ? overrides.tags : [];
      const smartTags = inferTaskTags({ title, existingTags: baseTags, tagPool, roles: tagRoles });
      const activity = [
        { id: generateId(), type: 'system' as const, text: 'Task created', timestamp: createdAt },
        ...(Array.isArray(overrides.activity) ? overrides.activity : [])
      ];
      const newTask = normalizeTask({
        id: generateId(),
        status,
        urgency: 5,
        scheduledDate: formatDateInputValue(new Date(createdAt)),
        scheduledStart: '',
        scheduledEnd: '',
        recurrence: 'none',
        recurrenceRootId: null,
        subtasks: [],
        logs: [],
        activeLogStart: null,
        activity,
        ...overrides,
        title,
        createdAt,
        tags: resolveTaskTags(smartTags)
      });
      setTasks((previous) => executeTaskCommand(previous, { type: 'create', task: newTask }).tasks);
      if (onCreated) {
        onCreated(newTask);
      }
    },
    [tagPool, tagRoles, resolveTaskTags, setTasks]
  );

  const createRoleRoutineTasks = useCallback(() => {
    const today = formatDateInputValue(new Date());
    const routineTasks = (settings.roles || []).map((role) =>
      normalizeTask({
        id: generateId(),
        title: role.name + ' routine block',
        status: 'backlog',
        urgency: 6,
        tags: Array.from(new Set(['routine', ...(role.tags || [])])),
        scheduledDate: today,
        scheduledStart: '',
        scheduledEnd: '',
        recurrence: 'none',
        recurrenceRootId: null,
        subtasks: [],
        logs: [],
        activeLogStart: null,
        activity: [
          {
            id: generateId(),
            type: 'system',
            text: 'Created from role routine template',
            timestamp: new Date().toISOString()
          }
        ]
      })
    );
    if (routineTasks.length) setTasks((previous) => [...routineTasks, ...previous]);
  }, [settings.roles, setTasks]);

  const planMyDay = useCallback(
    (onComplete?: () => void) => {
      const today = formatDateInputValue(new Date());
      const startHour = Math.max(9, new Date().getHours() + 1);
      setTasks(
        (previous) =>
          executeTaskCommand(previous, { type: 'plan-day', date: today, startMinutes: startHour * 60 }).tasks
      );
      if (onComplete) onComplete();
    },
    [setTasks]
  );

  const applyFocusPlan = useCallback((date: string, taskIds: string[], startMinutes: number) => {
    setTasks(
      (previous) =>
        executeTaskCommand(previous, {
          type: 'apply-focus-plan',
          date,
          taskIds,
          startMinutes
        }).tasks
    );
  }, []);

  const recordFocusSession = useCallback((taskId: string, minutes: number) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'record-focus', taskId, minutes }).tasks);
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      setTasks,
      selectedTaskId,
      setSelectedTaskId,
      currentTask,
      activeFilters,
      setActiveFilters,
      isFilterOpen,
      setIsFilterOpen,
      searchQuery,
      setSearchQuery,
      allUniqueTags,
      filteredTasks,
      tagPool,
      resolveTaskTags,
      registerTags,
      runTagTaxonomyCommand,
      columnSorts,
      cycleSort,
      draggedTaskId,
      dragOverInfo,
      setDraggedTaskId,
      setDragOverInfo,
      handleDragStart,
      handleDragOver,
      handleDrop,
      moveTask,
      reorderTask,
      addTask,
      updateTaskTimer,
      startTask,
      completeTask,
      rejectTask,
      createRoleRoutineTasks,
      planMyDay,
      applyFocusPlan,
      recordFocusSession
    }),
    [
      tasks,
      selectedTaskId,
      currentTask,
      activeFilters,
      setActiveFilters,
      isFilterOpen,
      setIsFilterOpen,
      searchQuery,
      setSearchQuery,
      allUniqueTags,
      filteredTasks,
      tagPool,
      resolveTaskTags,
      registerTags,
      runTagTaxonomyCommand,
      columnSorts,
      cycleSort,
      draggedTaskId,
      dragOverInfo,
      setDraggedTaskId,
      setDragOverInfo,
      handleDragStart,
      handleDragOver,
      handleDrop,
      moveTask,
      reorderTask,
      addTask,
      updateTaskTimer,
      startTask,
      completeTask,
      rejectTask,
      createRoleRoutineTasks,
      planMyDay,
      applyFocusPlan,
      recordFocusSession
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
