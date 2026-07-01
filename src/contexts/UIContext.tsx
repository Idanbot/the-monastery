import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSettingsContext } from './SettingsContext';
import { useTaskContext } from './TaskContext';
import { useAppShortcuts } from '../hooks/useAppShortcuts';
import { useTaskNotifications } from '../hooks/useTaskNotifications';
import { parseQuickAddTask } from '../domain/quickAdd';
import { formatDateInputValue } from '../domain/tasks';
import { statusLabels, taskStatuses } from '../domain/tasks';
import { visualThemeOptions, themeContracts } from '../domain/themes';

const MANTRAS = [
  'You have power over your mind - not outside events.',
  'Focus on the step in front of you, not the whole staircase.',
  'Do less, but do it better.',
  'The obstacle is the way.',
  'Wherever you are, be there totally.'
];

export type CommandGroup = {
  heading: string;
  commands: { value: string; label: string; leading?: React.ReactNode; onSelect: () => void }[];
};

interface UIContextType {
  view: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  now: number;
  isOnline: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCommandOpen: boolean;
  setIsCommandOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isShortcutHelpOpen: boolean;
  setIsShortcutHelpOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEnteringMonkMode: boolean;
  setIsEnteringMonkMode: React.Dispatch<React.SetStateAction<boolean>>;
  keyboardFocusedTaskId: string | null;
  setKeyboardFocusedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  quickAddText: string;
  setQuickAddText: React.Dispatch<React.SetStateAction<string>>;
  mantra: string;
  setMonkMode: (enabled: boolean) => void;
  submitQuickAddTask: (event: React.FormEvent) => void;
  startFocusTask: () => void;
  commandPaletteGroups: CommandGroup[];
  startFocusTaskAction: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};

import { useProfileContext } from './ProfileContext';

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, setSettings, openSettings } = useSettingsContext();
  const {
    tasks,
    setTasks,
    filteredTasks,
    addTask,
    planMyDay,
    createRoleRoutineTasks,
    selectedTaskId,
    setSelectedTaskId,
    moveTask,
    updateTaskTimer
  } = useTaskContext();

  const { profiles, selectProfile } = useProfileContext();

  const [view, setView] = useState('board');
  const [now, setNow] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isEnteringMonkMode, setIsEnteringMonkMode] = useState(false);
  const [keyboardFocusedTaskId, setKeyboardFocusedTaskId] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)]);

  useTaskNotifications({
    enabled: settings.notificationsEnabled,
    tasks,
    now,
    onOpenTask: setSelectedTaskId
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  const setMonkMode = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({
        ...prev,
        monkMode: enabled,
        monkModeOpenedAt: enabled ? new Date().toISOString() : undefined
      }));
      if (enabled) {
        setView('board');
        setIsEnteringMonkMode(true);
      } else {
        setIsEnteringMonkMode(false);
      }
    },
    [setSettings]
  );

  const startFocusTask = useCallback(() => {
    addTask(
      'backlog',
      {
        title: '',
        urgency: 7,
        tags: ['focus'],
        scheduledDate: formatDateInputValue(new Date())
      },
      (newTask) => {
        setSelectedTaskId(newTask.id);
      }
    );
  }, [addTask, setSelectedTaskId]);

  const submitQuickAddTask = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const parsed = parseQuickAddTask(quickAddText);
      if (!parsed.title) return;
      addTask('backlog', parsed.overrides, (newTask) => {
        setSelectedTaskId(newTask.id);
      });
      setQuickAddText('');
    },
    [quickAddText, addTask, setSelectedTaskId]
  );

  const handlePlanMyDay = useCallback(() => {
    planMyDay(() => {
      setView('board');
    });
  }, [planMyDay]);

  const scheduleTaskToday = useCallback(
    (taskId: string) => {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? {
                ...task,
                scheduledDate: formatDateInputValue(new Date()),
                scheduledStart: task.scheduledStart || '09:00',
                scheduledEnd: task.scheduledEnd || '10:00'
              }
            : task
        )
      );
    },
    [setTasks]
  );

  useAppShortcuts({
    filteredTasks,
    isCommandOpen,
    selectedTaskId,
    keyboardFocusedTaskId,
    setKeyboardFocusedTaskId,
    setSelectedTaskId,
    toggleCommandPalette: () => setIsCommandOpen((open) => !open),
    closeCommandPalette: () => setIsCommandOpen(false),
    addBacklogTask: () => {
      addTask('backlog', {}, (newTask) => {
        setSelectedTaskId(newTask.id);
      });
    },
    startFocusTask,
    planDay: handlePlanMyDay,
    showAnalytics: () => setView('dashboard'),
    showBoard: () => setView('board'),
    showShortcuts: () => setIsShortcutHelpOpen(true),
    toggleMonkMode: () => setMonkMode(!settings.monkMode),
    showList: () => setView('mobile')
  });

  const commandPaletteGroups = useMemo(
    () => [
      {
        heading: 'Actions',
        commands: [
          { value: 'backlog focus task', label: 'Backlog focus task', onSelect: () => startFocusTask() },
          {
            value: 'backlog task',
            label: 'Backlog task',
            onSelect: () => {
              addTask('backlog', {}, (newTask) => {
                setSelectedTaskId(newTask.id);
              });
            }
          },
          {
            value: 'monk mode',
            label: settings.monkMode ? 'Exit Monk Mode' : 'Enter Monk Mode',
            onSelect: () => setMonkMode(!settings.monkMode)
          },
          { value: 'open settings', label: 'Open settings', onSelect: () => openSettings() },
          {
            value: 'theme studio appearance',
            label: 'Theme Studio',
            onSelect: () => openSettings('appearance')
          },
          { value: 'plan my day', label: 'Plan my day', onSelect: () => handlePlanMyDay() },
          {
            value: 'keyboard shortcuts help',
            label: 'Keyboard shortcuts',
            onSelect: () => setIsShortcutHelpOpen(true)
          },
          {
            value: 'create role routines',
            label: 'Create role routines',
            onSelect: () => createRoleRoutineTasks()
          }
        ]
      },
      {
        heading: 'Tasks',
        commands: tasks.slice(0, 30).flatMap((task) => [
          {
            value: `open task ${task.title}`,
            label: `Open: ${task.title || 'Untitled'}`,
            onSelect: () => setSelectedTaskId(task.id)
          },
          {
            value: `${task.activeLogStart ? 'stop' : 'start'} timer ${task.title}`,
            label: `${task.activeLogStart ? 'Stop' : 'Start'} timer: ${task.title || 'Untitled'}`,
            onSelect: () => updateTaskTimer(task.id)
          },
          {
            value: `schedule today ${task.title}`,
            label: `Schedule today: ${task.title || 'Untitled'}`,
            onSelect: () => scheduleTaskToday(task.id)
          },
          ...taskStatuses.map((status) => ({
            value: `move ${task.title} to ${statusLabels[status]} status`,
            label: `Move ${task.title || 'Untitled'} to ${statusLabels[status]}`,
            onSelect: () => moveTask(task.id, status)
          }))
        ])
      },
      {
        heading: 'Themes',
        commands: visualThemeOptions.map((theme) => ({
          value: `theme ${theme.label}`,
          label: `Theme: ${theme.label}`,
          leading: (
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: (
                  themeContracts[theme.id]?.tokens?.light || themeContracts[theme.id]?.tokens?.dark
                )?.bg
              }}
            />
          ),
          onSelect: () =>
            setSettings((s) => ({
              ...s,
              visualTheme: theme.id,
              theme: themeContracts[theme.id]?.preferredMode === 'dark' ? 'dark' : 'light',
              colorScheme: { main: '', secondary: '', text: '' },
              fontMain: '',
              fontSecondary: '',
              clockTextColor: '',
              clockBackgroundColor: ''
            }))
        }))
      },
      {
        heading: 'Navigation',
        commands: [
          { value: 'go to board navigate', label: 'Go to board', onSelect: () => setView('board') },
          {
            value: 'go to calendar navigate',
            label: 'Go to calendar',
            onSelect: () => setView('calendar')
          },
          {
            value: 'go to task list navigate',
            label: 'Go to task list',
            onSelect: () => setView('mobile')
          },
          {
            value: 'go to analytics navigate',
            label: 'Go to analytics',
            onSelect: () => setView('dashboard')
          },
          { value: 'go to settings navigate', label: 'Go to settings', onSelect: () => openSettings() }
        ]
      },
      {
        heading: 'Profiles',
        commands: profiles.slice(0, 4).map((profile) => ({
          value: profile.name,
          label: profile.name,
          onSelect: () => selectProfile(profile.id)
        }))
      }
    ],
    [
      settings.monkMode,
      tasks,
      profiles,
      startFocusTask,
      addTask,
      setMonkMode,
      openSettings,
      setView,
      handlePlanMyDay,
      createRoleRoutineTasks,
      setSettings,
      selectProfile,
      setSelectedTaskId,
      updateTaskTimer,
      scheduleTaskToday,
      moveTask
    ]
  );

  const value = useMemo(
    () => ({
      view,
      setView,
      now,
      isOnline,
      sidebarOpen,
      setSidebarOpen,
      isCommandOpen,
      setIsCommandOpen,
      isShortcutHelpOpen,
      setIsShortcutHelpOpen,
      isEnteringMonkMode,
      setIsEnteringMonkMode,
      keyboardFocusedTaskId,
      setKeyboardFocusedTaskId,
      quickAddText,
      setQuickAddText,
      mantra,
      setMonkMode,
      submitQuickAddTask,
      startFocusTask,
      commandPaletteGroups,
      startFocusTaskAction: startFocusTask
    }),
    [
      view,
      now,
      isOnline,
      sidebarOpen,
      isCommandOpen,
      isShortcutHelpOpen,
      isEnteringMonkMode,
      keyboardFocusedTaskId,
      quickAddText,
      mantra,
      setMonkMode,
      submitQuickAddTask,
      startFocusTask,
      commandPaletteGroups
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
