import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import { Toaster, toast } from 'sonner';
import {
  Activity,
  ChevronDown,
  Clock,
  Filter,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings,
  Target,
  Users,
  X,
  HelpCircle
} from 'lucide-react';
import { AgendaTimeline } from './components/timeline/AgendaTimeline';
import { KanbanBoard, MobileFocusView, TaskListView } from './components/board/TaskBoard';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskModal } from './components/task-modal/TaskModal';

import { CommandPalette } from './components/CommandPalette';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { ThemedSurface } from './components/ui/ThemedSurface';
import { MonkModeView } from './components/monk-mode/MonkModeView';
import { PersistenceStatusChip } from './components/PersistenceStatusChip';
import { CurrentTaskPin } from './components/CurrentTaskPin';
import { MobileBoardControls } from './components/board/MobileBoardControls';
import { ViewSwitcher } from './components/ViewSwitcher';
import { TaskSearchInput } from './components/TaskSearchInput';
import { TagFilterMenu } from './components/TagFilterMenu';
import { ClockWidget } from './components/ClockWidget';
import type { PersistenceStatus } from './domain/persistenceStatus';
import type { TaskStatus } from './domain/types';
import { usePersistenceNotifier } from './hooks/usePersistenceNotifier';
import { executeTaskCommand } from './domain/taskCommands';

const MANTRAS = [
  'You have power over your mind - not outside events.',
  'Focus on the step in front of you, not the whole staircase.',
  'Do less, but do it better.',
  'The obstacle is the way.',
  'Wherever you are, be there totally.'
];

import { rolePresets } from './domain/rolePresets';
import { parseQuickAddTask } from './domain/quickAdd';
import { inferTaskTags } from './domain/taskIntelligence';
import { applyTagTaxonomyCommand, canonicalizeTags, type TagTaxonomyCommand } from './domain/tagTaxonomy';
import { visualThemeOptions, themeContracts } from './domain/themes';
import { formatDateInputValue, generateId, normalizeTask, activeTaskStatuses } from './domain/tasks';
import { useBackupActions } from './hooks/useBackupActions';
import { useBoardController } from './hooks/useBoardController';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { useImportFlows } from './hooks/useImportFlows';
import {
  loadInitialLocalSettings,
  loadInitialLocalTasks,
  useLocalFallbackPersistence
} from './hooks/useLocalFallbackPersistence';
import { useProfileImportExport } from './hooks/useProfileImportExport';
import { useProfilesSync } from './hooks/useProfilesSync';
import { useRecurringTasks } from './hooks/useRecurringTasks';
import { useResizableLayout } from './hooks/useResizableLayout';
import { useTaskDraft } from './hooks/useTaskDraft';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useThemeStyle } from './hooks/useThemeStyle';
import { cssVars } from './lib/cssVars';

const frontendVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const formatVisibleVersion = (version: string) => {
  const match = version.match(/^(\d+)\.(\d+)/);
  return match ? `v${match[1]}.${match[2]}` : `v${version}`;
};

export default function App() {
  const [tasks, setTasks] = useState(loadInitialLocalTasks);
  const [settings, setSettings] = useState(loadInitialLocalSettings);

  /* View & UI State */
  const [view, setView] = useState('board');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );
  const [now, setNow] = useState(Date.now());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isEnteringMonkMode, setIsEnteringMonkMode] = useState(false);
  const [keyboardFocusedTaskId, setKeyboardFocusedTaskId] = useState(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [quickAddText, setQuickAddText] = useState('');

  // Random daily mantra
  const [mantra] = useState(() => MANTRAS[Math.floor(Math.random() * MANTRAS.length)]);

  const { startResize } = useResizableLayout(setSettings);
  const {
    columnSorts,
    cycleSort,
    draggedTaskId,
    dragOverInfo,
    setDraggedTaskId,
    setDragOverInfo,
    handleDragStart,
    handleDragOver,
    handleDrop
  } = useBoardController(setTasks);

  /* Modal Collapsible State */
  const [modalSections, setModalSections] = useState({ timer: false, notes: false, activity: false });
  const importProfileInputRef = useRef(null);
  const agendaContainerRef = useRef(null);
  const agendaScrollTopRef = useRef(0);
  const timelineDragRef = useRef(null);
  const suppressTimelineClickRef = useRef(new Set());
  const {
    isBackendAvailable,
    isProfileReady,
    persistenceStatus,
    lastSavedAt,
    profiles,
    activeProfileId,
    selectProfile,
    newProfileName,
    setNewProfileName,
    profileAction,
    setProfileAction,
    profileError,
    activeProfile,
    reloadActiveProfile,
    createProfile,
    resetActiveProfile,
    removeActiveProfile
  } = useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId });
  const {
    profileImportPreview,
    setProfileImportPreview,
    exportActiveProfile,
    importActiveProfile,
    confirmProfileImport
  } = useProfileImportExport({
    tasks,
    setTasks,
    settings,
    setSettings,
    activeProfile,
    activeProfileId,
    setSelectedTaskId,
    importProfileInputRef
  });
  const {
    importPreview,
    setImportPreview,
    planningImportPreview,
    setPlanningImportPreview,
    importInputRef,
    importCalendarInputRef,
    importPlanningInputRef,
    importTasks,
    importCalendarTasks,
    importPlanningData,
    confirmImportTasks,
    confirmPlanningImport
  } = useImportFlows({ tasks, setTasks, setSettings, setSelectedTaskId });
  const {
    localBackups,
    restoreLocalBackup,
    removeLocalBackup,
    exportTasks,
    backupData,
    exportTaskSchema,
    exportThemeRecipe
  } = useBackupActions({
    tasks,
    setTasks,
    settings,
    setSettings,
    activeProfile,
    activeProfileId,
    isBackendAvailable,
    setSelectedTaskId,
    setIsSettingsOpen
  });
  useLocalFallbackPersistence({
    tasks,
    setTasks,
    settings,
    setSettings,
    isProfileReady
  });
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
  const tagPool = useMemo(
    () =>
      Array.from(
        new Set([
          ...allUniqueTags,
          ...(settings.tagInventory || []),
          ...(settings.roles || []).flatMap((role) => role.tags || []),
          ...(settings.tagGoals || []).map((goal) => goal.tag),
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
    [settings, tasks]
  );
  const tagRoles = useMemo(() => settings.roles || [], [settings.roles]);
  const { refs: filterRefs, floatingStyles: filterFloatingStyles } = useFloating({
    open: isFilterOpen,
    onOpenChange: setIsFilterOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  const setFilterReference = useCallback(
    (node) => {
      filterRefs.setReference(node);
    },
    [filterRefs]
  );
  const setFilterFloating = useCallback(
    (node) => {
      filterRefs.setFloating(node);
    },
    [filterRefs]
  );
  const { refs: profileRefs, floatingStyles: profileFloatingStyles } = useFloating({
    open: isProfileOpen,
    onOpenChange: setIsProfileOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  const [profileReferenceNode, setProfileReferenceNode] = useState(null);
  const [profileFloatingNode, setProfileFloatingNode] = useState(null);
  const setProfileReference = useCallback(
    (node) => {
      profileRefs.setReference(node);
      setProfileReferenceNode(node);
    },
    [profileRefs]
  );
  const setProfileFloating = useCallback(
    (node) => {
      profileRefs.setFloating(node);
      setProfileFloatingNode(node);
    },
    [profileRefs]
  );
  const {
    draftTask,
    draftNote,
    setDraftNote,
    draftIsDirty,
    draftSavedAt,
    draftSaveStatus,
    showDirtyClosePrompt,
    setShowDirtyClosePrompt,
    showDeleteTaskPrompt,
    setShowDeleteTaskPrompt,
    updateDraftTask,
    saveDraftTask,
    closeTaskModal,
    discardDraftTask,
    deleteDraftTask
  } = useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId });
  useRecurringTasks(tasks, setTasks);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => setSystemIsDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  const isDarkMode = settings.theme === 'system' ? systemIsDark : settings.theme === 'dark';

  useLayoutEffect(() => {
    if (agendaContainerRef.current) {
      agendaContainerRef.current.scrollTop = agendaScrollTopRef.current;
    }
  });

  useEffect(() => {
    if (!isProfileOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      const target = event.target;
      if (profileReferenceNode?.contains(target) || profileFloatingNode?.contains(target)) return;
      setIsProfileOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isProfileOpen, profileFloatingNode, profileReferenceNode]);

  const addRole = () => {
    setSettings((prev) => ({
      ...prev,
      roles: [
        ...(prev.roles || []),
        {
          id: generateId(),
          name: 'New Role',
          tags: [],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ]
    }));
  };

  const updateRole = (roleId, updates) => {
    setSettings((prev) => ({
      ...prev,
      roles: (prev.roles || []).map((role) => (role.id === roleId ? { ...role, ...updates } : role))
    }));
  };

  const removeRole = (roleId) => {
    setSettings((prev) => ({
      ...prev,
      roles: (prev.roles || []).filter((role) => role.id !== roleId)
    }));
  };
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
        recurrence: 'weekly',
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

  useEffect(() => {
    const minutesToClockTime = (minutes) => {
      const clamped = Math.max(0, Math.min(1439, minutes));
      const hours = Math.floor(clamped / 60)
        .toString()
        .padStart(2, '0');
      const mins = Math.floor(clamped % 60)
        .toString()
        .padStart(2, '0');
      return hours + ':' + mins;
    };
    const handleTimelineMouseUp = (event) => {
      const drag = timelineDragRef.current;
      if (!drag) return;
      timelineDragRef.current = null;
      const delta = event.clientY - drag.startY;
      const snappedDelta = Math.round(delta / 15) * 15;
      if (Math.abs(snappedDelta) < 15) return;
      suppressTimelineClickRef.current.add(drag.taskId);
      window.setTimeout(() => suppressTimelineClickRef.current.delete(drag.taskId), 0);
      const nextStart = Math.max(0, Math.min(1439 - drag.duration, drag.startTop + snappedDelta));
      setTasks((previous) =>
        previous.map((item) =>
          item.id === drag.taskId
            ? {
                ...item,
                scheduledStart: minutesToClockTime(nextStart),
                scheduledEnd: minutesToClockTime(nextStart + drag.duration)
              }
            : item
        )
      );
    };
    window.addEventListener('mouseup', handleTimelineMouseUp);
    return () => window.removeEventListener('mouseup', handleTimelineMouseUp);
  }, [setTasks]);

  const setMonkMode = useCallback(
    (enabled) => {
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

  const openSettings = useCallback((section = null) => {
    setSettingsInitialSection(section);
    setIsSettingsOpen(true);
  }, []);
  const isSidebarVisible = settings.sidebarVisible !== false;
  const { themeStyle, modalEffectStyle } = useThemeStyle(settings, systemIsDark);

  const toggleBoardLane = useCallback(
    (status: TaskStatus) => {
      setSettings((previous) => {
        const collapsed = previous.collapsedBoardLanes || [];
        return {
          ...previous,
          collapsedBoardLanes: collapsed.includes(status)
            ? collapsed.filter((item) => item !== status)
            : [...collapsed, status]
        };
      });
    },
    [setSettings]
  );

  const toggleSidebarVisible = () => {
    setSettings((prev) => ({ ...prev, sidebarVisible: prev.sidebarVisible === false }));
  };

  const toggleSidebarWidget = (widget) => {
    setSettings((prev) => ({
      ...prev,
      sidebarWidgets: prev.sidebarWidgets.includes(widget)
        ? prev.sidebarWidgets.filter((item) => item !== widget)
        : Array.from(new Set([...prev.sidebarWidgets, widget]))
    }));
  };

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

  const updateTaskTimer = (taskId) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'toggle-timer', taskId }).tasks);
  };

  const handleSaveDraftTask = () => {
    saveDraftTask();
  };

  const handleDeleteDraftTask = () => {
    deleteDraftTask();
  };

  const handleConfirmProfileImport = () => {
    confirmProfileImport();
    toast.success('Profile restored.');
  };

  const rejectTask = (taskId) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'move', taskId, status: 'rejected' }).tasks);
  };

  const completeTask = (taskId) => {
    setTasks(
      (previous) =>
        executeTaskCommand(previous, {
          type: 'complete',
          taskId,
          promoteNext: settings.autoPromoteNextTask
        }).tasks
    );
  };

  const addTask = useCallback(
    (status = 'backlog', overrides: any = {}) => {
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
      setSelectedTaskId(newTask.id);
    },
    [tagPool, tagRoles, resolveTaskTags, setTasks, setSelectedTaskId]
  );

  const submitQuickAddTask = (event) => {
    event.preventDefault();
    const parsed = parseQuickAddTask(quickAddText);
    if (!parsed.title) return;
    addTask('backlog', parsed.overrides);
    setQuickAddText('');
  };

  const startFocusTask = useCallback(() => {
    addTask('backlog', {
      title: '',
      urgency: 7,
      tags: ['focus'],
      scheduledDate: formatDateInputValue(new Date())
    });
  }, [addTask]);

  const planMyDay = useCallback(() => {
    const today = formatDateInputValue(new Date());
    const startHour = Math.max(9, new Date().getHours() + 1);
    setTasks(
      (previous) =>
        executeTaskCommand(previous, { type: 'plan-day', date: today, startMinutes: startHour * 60 }).tasks
    );
    setView('board');
  }, [setTasks]);

  useAppShortcuts({
    filteredTasks,
    isCommandOpen,
    selectedTaskId,
    keyboardFocusedTaskId,
    setKeyboardFocusedTaskId,
    setSelectedTaskId,
    toggleCommandPalette: () => setIsCommandOpen((open) => !open),
    closeCommandPalette: () => setIsCommandOpen(false),
    addBacklogTask: () => addTask('backlog'),
    startFocusTask,
    planDay: planMyDay,
    showAnalytics: () => setView('dashboard'),
    showBoard: () => setView('board'),
    showShortcuts: () => setIsShortcutHelpOpen(true),
    toggleMonkMode: () =>
      setSettings((previous) => {
        const monkMode = !previous.monkMode;
        if (monkMode) setIsEnteringMonkMode(true);
        return {
          ...previous,
          monkMode,
          monkModeOpenedAt: monkMode ? new Date().toISOString() : undefined
        };
      }),
    showList: () => setView('mobile')
  });

  const handlePomodoroComplete = (minutes) => {
    if (!currentTask) return;
    setTasks(
      (prev) => executeTaskCommand(prev, { type: 'record-focus', taskId: currentTask.id, minutes }).tasks
    );
  };
  const persistenceState = persistenceStatus as PersistenceStatus;
  usePersistenceNotifier(persistenceState, lastSavedAt);

  const commandPaletteGroups = useMemo(
    () => [
      {
        heading: 'Actions',
        commands: [
          { value: 'backlog focus task', label: 'Backlog focus task', onSelect: () => startFocusTask() },
          { value: 'backlog task', label: 'Backlog task', onSelect: () => addTask('backlog') },
          {
            value: 'monk mode',
            label: settings.monkMode ? 'Exit Monk Mode' : 'Enter Monk Mode',
            onSelect: () => setMonkMode(!settings.monkMode)
          },
          { value: 'open settings', label: 'Open settings', onSelect: () => openSettings() },
          {
            value: 'go to analytics dashboard',
            label: 'Go to analytics',
            onSelect: () => setView('dashboard')
          },
          {
            value: 'theme studio appearance',
            label: 'Theme Studio',
            onSelect: () => openSettings('appearance')
          },
          { value: 'plan my day', label: 'Plan my day', onSelect: () => planMyDay() },
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
        commands: (
          [
            ['Liquid Glass', 'liquid-glass', 'light'],
            ['Zen', 'zen', 'light'],
            ['Terminal White', 'terminal-white', 'dark']
          ] as const
        ).map(([label, visualTheme, theme]) => ({
          value: String(label),
          label,
          onSelect: () => setSettings((previous) => ({ ...previous, visualTheme, theme }))
        }))
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
      profiles,
      startFocusTask,
      addTask,
      setMonkMode,
      openSettings,
      setView,
      planMyDay,
      createRoleRoutineTasks,
      setSettings,
      selectProfile
    ]
  );

  return (
    <div
      className={`${isDarkMode ? 'dark' : ''} app-shell h-screen w-full flex flex-col overflow-hidden`}
      data-text-size={settings.textSize}
      data-visual-theme={settings.visualTheme}
      data-monk-mode={settings.monkMode ? 'true' : 'false'}
      data-animations-enabled={settings.animationsEnabled === false ? 'false' : 'true'}
      data-resize-bars={settings.resizeHandleVisible === false ? 'false' : 'true'}
      style={cssVars({
        ...themeStyle,
        ...modalEffectStyle,
        '--resize-handle-thickness': String(settings.resizeHandleThickness || 4) + 'px',
        '--resize-handle-length': String(settings.resizeHandleLength || 48) + 'px',
        '--resize-handle-color': settings.resizeHandleColor || '#94a3b8'
      })}
    >
      <div className="app-frame h-full w-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors duration-200">
        <Toaster richColors position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
        {/* Header - Fixed Height */}
        <header
          data-material="control"
          className="app-header bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 md:px-6 py-2 sm:py-3 flex justify-between items-center shrink-0 z-[70] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <button
              aria-label="Toggle sidebar"
              className="md:hidden p-2 -ml-2 text-slate-500"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
              <Activity size={18} />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none hidden sm:block">
              TheMonastery
            </h1>
            <div
              data-testid="app-version-chip"
              title={`Version ${formatVisibleVersion(frontendVersion)}`}
              className="hidden lg:flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400"
            >
              {formatVisibleVersion(frontendVersion)}
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1 sm:gap-2 md:gap-3">
            <ViewSwitcher view={view} onChange={setView} disabled={settings.monkMode} />
            <TaskSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              variant="header"
              disabled={settings.monkMode}
            />

            {isBackendAvailable && (
              <div className="hidden sm:block relative">
                <ThemedSurface
                  as="button"
                  variant="menuTrigger"
                  ref={setProfileReference}
                  type="button"
                  data-testid="active-profile-control"
                  data-active-profile-id={activeProfileId}
                  title="Active profile"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="flex max-w-48 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <Users size={15} className="text-slate-400 shrink-0" />
                  <span className="min-w-0 truncate">{activeProfile?.name || 'Profile'}</span>
                  <ChevronDown size={14} className="shrink-0 text-slate-400" />
                  {!isProfileReady && <span className="text-[10px] text-slate-400">syncing</span>}
                </ThemedSurface>
                {isProfileOpen && (
                  <ThemedSurface
                    variant="menu"
                    ref={setProfileFloating}
                    style={profileFloatingStyles}
                    className="z-[90] w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 flex flex-col gap-1"
                  >
                    <div className="px-2 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Profiles
                    </div>
                    {profiles.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          selectProfile(profile.id);
                          setIsProfileOpen(false);
                        }}
                        className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          profile.id === activeProfileId
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block truncate font-medium">{profile.name}</span>
                        <span className="block text-[10px] text-slate-400">
                          {profile.taskCount ?? 0} tasks
                        </span>
                      </button>
                    ))}
                  </ThemedSurface>
                )}
              </div>
            )}

            {/* Global Tags Filter */}
            {!settings.monkMode && (
              <div className="hidden sm:block">
                <ThemedSurface
                  as="button"
                  variant="menuTrigger"
                  ref={setFilterReference}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 rounded-lg flex items-center gap-1 text-sm font-medium border transition-colors ${activeFilters.length > 0 ? 'border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
                >
                  <Filter size={16} /> <span className="hidden lg:inline">Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="bg-indigo-500 text-white text-[10px] px-1.5 rounded-full">
                      {activeFilters.length}
                    </span>
                  )}
                </ThemedSurface>
                {isFilterOpen && (
                  <ThemedSurface
                    variant="menu"
                    ref={setFilterFloating}
                    style={filterFloatingStyles}
                    className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[90] p-3 flex flex-col gap-2"
                  >
                    <TagFilterMenu
                      knownTags={tagPool}
                      activeFilters={activeFilters}
                      onToggleTag={(tag) =>
                        setActiveFilters((previous) =>
                          previous.includes(tag)
                            ? previous.filter((item) => item !== tag)
                            : [...previous, tag]
                        )
                      }
                      onClear={() => setActiveFilters([])}
                    />
                  </ThemedSurface>
                )}
              </div>
            )}

            <div
              data-testid="offline-status"
              className={`hidden lg:block rounded-full px-2 py-1 text-[10px] font-semibold ${isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}
            >
              {isOnline ? 'Online' : 'Offline ready'}
            </div>

            <PersistenceStatusChip
              status={persistenceState}
              lastSavedAt={lastSavedAt}
              errorMessage={profileError}
            />

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

            <button
              aria-label={settings.monkMode ? 'Exit monk mode' : 'Enter monk mode'}
              onClick={() => setMonkMode(!settings.monkMode)}
              className={`hidden sm:flex px-3 py-2 rounded-lg items-center gap-2 text-sm font-medium border transition-colors ${
                settings.monkMode
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <Target size={15} /> <span className="hidden md:inline">Monk</span>
            </button>

            <button
              aria-label={isSidebarVisible ? 'Hide right container' : 'Show right container'}
              title={isSidebarVisible ? 'Hide right container' : 'Show right container'}
              onClick={toggleSidebarVisible}
              className={`hidden md:flex p-2 rounded-lg items-center gap-2 text-sm font-medium border transition-colors ${
                isSidebarVisible
                  ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  : 'bg-indigo-600 border-indigo-600 text-white'
              }`}
            >
              {isSidebarVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>

            <button
              aria-label={settings.sidebarWidgets.includes('clock') ? 'Hide clock' : 'Show clock'}
              title={settings.sidebarWidgets.includes('clock') ? 'Hide clock' : 'Show clock'}
              onClick={() => toggleSidebarWidget('clock')}
              className={`hidden md:flex p-2 rounded-lg items-center gap-2 text-sm font-medium border transition-colors ${
                settings.sidebarWidgets.includes('clock')
                  ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <Clock size={16} />
            </button>

            <button
              aria-label="Shortcuts & Guide"
              onClick={() => setIsShortcutHelpOpen(true)}
              className="hidden md:block p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              <HelpCircle size={18} />
            </button>

            <button
              aria-label="Open settings"
              onClick={() => openSettings()}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              <Settings size={18} />
            </button>

            <button
              aria-label="Backlog task"
              onClick={() => addTask('backlog')}
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium shrink-0"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Backlog Task</span>
            </button>
          </div>
        </header>

        {(persistenceState === 'error' || persistenceState === 'offline' || profileError) && (
          <div
            data-testid="sync-recovery-notice"
            className={
              'border-b px-4 py-2 text-xs font-medium ' +
              (persistenceState === 'error' || profileError
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200')
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span>
                {persistenceState === 'error' || profileError
                  ? 'Sync problem: ' +
                    (profileError ||
                      'Your latest edits remain in this browser. Export a backup if this persists.')
                  : 'Local mode: backend unavailable. Changes are saved on this device until sync is available.'}
              </span>
              {(persistenceState === 'error' || profileError) && isBackendAvailable && (
                <button
                  type="button"
                  onClick={reloadActiveProfile}
                  className="shrink-0 rounded border border-current px-2 py-1 text-[11px]"
                >
                  Reload profile
                </button>
              )}
            </div>
          </div>
        )}

        {}
        {/* The workspace is purely flex, with strict hidden overflow so only columns scroll */}
        <main className="app-main flex-1 min-h-0 flex flex-col md:flex-row relative bg-slate-100 dark:bg-slate-950 p-2 gap-2 sm:p-4 sm:gap-4 overflow-hidden">
          {/* Main Content Area (Kanban or Analytics) */}
          <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
            {!settings.monkMode && view !== 'dashboard' && (
              <TaskSearchInput value={searchQuery} onChange={setSearchQuery} variant="inline" />
            )}

            {settings.monkMode && (
              <MonkModeView
                settings={settings}
                setSettings={setSettings}
                tasks={tasks}
                currentTask={currentTask}
                now={now}
                isEnteringMonkMode={isEnteringMonkMode}
                mantra={mantra}
                onExit={() => setMonkMode(false)}
                onIntroComplete={() => setIsEnteringMonkMode(false)}
                onAddTask={() => addTask('backlog')}
                onPomodoroComplete={handlePomodoroComplete}
              />
            )}

            {!settings.monkMode && view === 'dashboard' && (
              <AnalyticsView
                tasks={tasks}
                settings={settings}
                now={now}
                activeProfile={activeProfile}
                currentTask={currentTask}
                openRoleSettings={() => openSettings('roles')}
              />
            )}

            {!settings.monkMode && view === 'mobile' && (
              <div className="flex-1 min-h-0">
                <TaskListView filteredTasks={filteredTasks} setSelectedTaskId={setSelectedTaskId} now={now} />
              </div>
            )}

            {!settings.monkMode && view === 'board' && (
              <>
                <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <form
                    onSubmit={submitQuickAddTask}
                    className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex"
                    aria-label="Quick add task"
                  >
                    <Plus size={15} className="shrink-0 text-indigo-500" />
                    <input
                      value={quickAddText}
                      onChange={(event) => setQuickAddText(event.target.value)}
                      placeholder="Quick add: GKE migration tomorrow 9-10 #cloud !7"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!quickAddText.trim()}
                    >
                      Add
                    </button>
                  </form>
                  <div className="hidden justify-end gap-2 sm:flex">
                    <button
                      onClick={planMyDay}
                      className="px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:border-emerald-400"
                    >
                      Plan day
                    </button>
                    <button
                      onClick={() => openSettings('board')}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                    >
                      Board settings
                    </button>
                  </div>
                </div>
                <MobileBoardControls settings={settings} setSettings={setSettings} />
                {settings.mobileFocusMode && (
                  <MobileFocusView
                    filteredTasks={filteredTasks}
                    currentTask={currentTask}
                    setSelectedTaskId={setSelectedTaskId}
                    now={now}
                    onStartTask={updateTaskTimer}
                    onCompleteTask={completeTask}
                    onRejectTask={rejectTask}
                    onNextTask={updateTaskTimer}
                  />
                )}
                <div className={`min-h-0 flex-1 ${settings.mobileFocusMode ? 'hidden sm:flex' : 'flex'}`}>
                  <KanbanBoard
                    filteredTasks={filteredTasks}
                    settings={settings}
                    columnSorts={columnSorts}
                    cycleSort={cycleSort}
                    draggedTaskId={draggedTaskId}
                    dragOverInfo={dragOverInfo}
                    setDraggedTaskId={setDraggedTaskId}
                    setDragOverInfo={setDragOverInfo}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleDragStart={handleDragStart}
                    setSelectedTaskId={setSelectedTaskId}
                    keyboardFocusedTaskId={keyboardFocusedTaskId}
                    now={now}
                    startResize={startResize}
                    onToggleLane={toggleBoardLane}
                  />
                </div>
              </>
            )}
          </div>

          {settings.resizeHandleVisible !== false && (
            <div
              data-testid="main-sidebar-resizer"
              className={`resize-handle resize-handle-vertical hidden md:flex w-1 cursor-col-resize shrink-0 items-center justify-center hover:bg-indigo-500/10 group rounded ${isSidebarVisible ? '' : 'md:hidden'}`}
              onMouseDown={() => startResize('main-sidebar')}
              title="Resize sidebar"
            >
              <div className="resize-grip resize-grip-vertical w-px h-12 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
            </div>
          )}

          {}
          <div
            data-testid="app-sidebar"
            data-material="sidebar"
            className={`
            absolute md:relative top-0 right-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl md:shadow-none transition-transform duration-300 z-40 rounded-l-2xl md:rounded-xl overflow-hidden
            ${sidebarOpen && isSidebarVisible ? 'translate-x-0' : 'translate-x-full'}
            ${isSidebarVisible ? 'md:translate-x-0' : 'md:hidden'}
          `}
            style={{ width: `${settings.sidebarWidth || 320}px` }}
          >
            {/* Mobile close btn */}
            <div className="md:hidden flex justify-end p-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
              {settings.sidebarWidgets.includes('now') && (
                <CurrentTaskPin
                  task={currentTask}
                  now={now}
                  onOpen={setSelectedTaskId}
                  onAdd={() => addTask('backlog')}
                  onToggleTimer={updateTaskTimer}
                  onComplete={completeTask}
                />
              )}

              {settings.sidebarWidgets.includes('clock') && (
                <ClockWidget settings={settings} now={now} onOpenSettings={openSettings} />
              )}

              {settings.resizeHandleVisible !== false &&
                settings.sidebarWidgets.includes('clock') &&
                settings.sidebarWidgets.includes('agenda') && (
                  <div
                    className="resize-handle resize-handle-horizontal h-2 w-full cursor-row-resize shrink-0 flex items-center justify-center hover:bg-indigo-500/10 group rounded"
                    onMouseDown={() => startResize('sidebar-clock')}
                    title="Resize clock and timeline"
                  >
                    <div className="resize-grip resize-grip-horizontal h-px w-12 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
                  </div>
                )}

              {settings.sidebarWidgets.includes('agenda') && (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <AgendaTimeline
                    tasks={tasks}
                    settings={settings}
                    now={now}
                    setTasks={setTasks}
                    setSelectedTaskId={setSelectedTaskId}
                    agendaContainerRef={agendaContainerRef}
                    agendaScrollTopRef={agendaScrollTopRef}
                    timelineDragRef={timelineDragRef}
                    suppressTimelineClickRef={suppressTimelineClickRef}
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        {isShortcutHelpOpen && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsShortcutHelpOpen(false);
            }}
          >
            <ThemedSurface
              role="dialog"
              aria-label="Keyboard shortcuts"
              variant="modal"
              className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold text-sm">Keyboard shortcuts</h3>
                <button
                  aria-label="Close keyboard shortcuts"
                  onClick={() => setIsShortcutHelpOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                {[
                  ['Ctrl+K', 'Command palette'],
                  ['n', 'Backlog task'],
                  ['f', 'Focus task'],
                  ['p', 'Plan day'],
                  ['j/k', 'Move task focus'],
                  ['Enter', 'Open focused task'],
                  ['d', 'Analytics'],
                  ['b', 'Board'],
                  ['?', 'Shortcuts']
                ].map(([key, label]) => (
                  <React.Fragment key={key}>
                    <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs">
                      {key}
                    </kbd>
                    <span>{label}</span>
                  </React.Fragment>
                ))}
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}
        {isSettingsOpen && (
          <SettingsModal
            initialSection={settingsInitialSection}
            settings={settings}
            setSettings={setSettings}
            addRole={addRole}
            updateRole={updateRole}
            removeRole={removeRole}
            isBackendAvailable={isBackendAvailable}
            profiles={profiles}
            activeProfileId={activeProfileId}
            selectProfile={selectProfile}
            newProfileName={newProfileName}
            setNewProfileName={setNewProfileName}
            createProfile={createProfile}
            setProfileAction={(action) => {
              setProfileAction(action);
              setIsSettingsOpen(false);
            }}
            profileError={profileError}
            exportTasks={exportTasks}
            backupData={backupData}
            exportThemeRecipe={exportThemeRecipe}
            createRoleRoutineTasks={createRoleRoutineTasks}
            exportActiveProfile={exportActiveProfile}
            importProfileInputRef={importProfileInputRef}
            importActiveProfile={importActiveProfile}
            exportTaskSchema={exportTaskSchema}
            importInputRef={importInputRef}
            importTasks={importTasks}
            importCalendarInputRef={importCalendarInputRef}
            importCalendarTasks={importCalendarTasks}
            importPlanningInputRef={importPlanningInputRef}
            importPlanningData={importPlanningData}
            localBackups={localBackups}
            restoreLocalBackup={restoreLocalBackup}
            removeLocalBackup={removeLocalBackup}
            tagPool={tagPool}
            onTagCommand={runTagTaxonomyCommand}
            isDarkMode={isDarkMode}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        {profileAction && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setProfileAction(null);
            }}
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl pointer-events-auto"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {profileAction === 'reset' ? 'Reset profile?' : 'Remove profile?'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {profileAction === 'reset'
                    ? `This will delete every task in ${activeProfile?.name || 'this profile'} and keep the profile.`
                    : `This will delete ${activeProfile?.name || 'this profile'} and all of its tasks.`}
                </p>
              </div>
              <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  onClick={() => setProfileAction(null)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={profileAction === 'reset' ? resetActiveProfile : removeActiveProfile}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {profileAction === 'reset' ? 'Reset profile' : 'Remove profile'}
                </button>
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}
        {profileImportPreview && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setProfileImportPreview(null);
            }}
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore profile?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {profileImportPreview.name} has {profileImportPreview.tasks.length} tasks. Current profile
                  has {profileImportPreview.currentTaskCount} tasks.
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                  <div className="text-xs text-slate-400">Current</div>
                  <div className="font-mono text-lg">{profileImportPreview.currentTaskCount}</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                  <div className="text-xs text-slate-400">Imported</div>
                  <div className="font-mono text-lg">{profileImportPreview.tasks.length}</div>
                </div>
              </div>
              <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setProfileImportPreview(null)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProfileImport}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Restore profile
                </button>
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}
        {planningImportPreview && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPlanningImportPreview(null);
            }}
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Import planning data?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tasks merge by ID, roles merge by ID or name, and tag goals merge by tag.
                </p>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
                {[
                  ['Tasks', planningImportPreview.tasks.length],
                  ['Roles', planningImportPreview.roles.length],
                  ['Tags', planningImportPreview.tags.length],
                  ['Goals', planningImportPreview.tagGoals.length]
                ].map(([label, count]) => (
                  <div
                    key={label}
                    className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-2xl font-mono font-bold text-indigo-600">{count}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPlanningImportPreview(null)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlanningImport}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Merge planning data
                </button>
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}
        {importPreview && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setImportPreview(null);
            }}
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Import preview</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Matching task IDs will be updated, new IDs will be added, and all other current tasks stay
                  in place.
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-mono font-bold text-emerald-600">
                      {importPreview.newTasks.length}
                    </div>
                    <div className="text-xs text-slate-500">Backlog</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-mono font-bold text-indigo-600">
                      {importPreview.updatedTasks.length}
                    </div>
                    <div className="text-xs text-slate-500">Changed</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-mono font-bold text-slate-500">
                      {importPreview.unchangedTasks.length}
                    </div>
                    <div className="text-xs text-slate-500">Same</div>
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto custom-scrollbar rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {importPreview.imported.slice(0, 8).map((task) => (
                    <div key={task.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                      <span className="truncate">{task.title || 'Untitled Task'}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-400">
                        {task.status}
                      </span>
                    </div>
                  ))}
                  {importPreview.imported.length > 8 && (
                    <div className="px-3 py-2 text-xs text-slate-400">
                      +{importPreview.imported.length - 8} more
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setImportPreview(null)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImportTasks}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Merge import
                </button>
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}
        <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} groups={commandPaletteGroups} />
        <TaskModal
          draftTask={draftTask}
          draftNote={draftNote}
          setDraftNote={setDraftNote}
          draftIsDirty={draftIsDirty}
          draftSavedAt={draftSavedAt}
          draftSaveStatus={draftSaveStatus}
          modalSections={modalSections}
          setModalSections={setModalSections}
          now={now}
          clockFormat={settings.clockFormat}
          updateDraftTask={updateDraftTask}
          closeTaskModal={closeTaskModal}
          saveDraftTask={handleSaveDraftTask}
          closeAfterSave={() => setSelectedTaskId(null)}
          showDeleteTaskPrompt={showDeleteTaskPrompt}
          setShowDeleteTaskPrompt={setShowDeleteTaskPrompt}
          deleteDraftTask={handleDeleteDraftTask}
          showDirtyClosePrompt={showDirtyClosePrompt}
          setShowDirtyClosePrompt={setShowDirtyClosePrompt}
          discardDraftTask={discardDraftTask}
          tagPool={tagPool}
          roles={tagRoles}
          onRegisterTags={registerTags}
          resolveTags={resolveTaskTags}
        />
      </div>
    </div>
  );
}
