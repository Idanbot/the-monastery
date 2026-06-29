import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskModal } from './components/task-modal/TaskModal';

import { CommandPalette } from './components/CommandPalette';
import { ThemedSurface } from './components/ui/ThemedSurface';
import { WorkspaceContent } from './components/workspace/WorkspaceContent';
import { AppHeader } from './components/app/AppHeader';
import { WorkspaceSidebar } from './components/app/WorkspaceSidebar';
import { ProfileActionDialog, ShortcutHelpDialog } from './components/app/AppDialogs';
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
    handleDrop,
    moveTask,
    reorderTask
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
    syncConflict,
    keepLocalChanges,
    useServerChanges,
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
        <AppHeader
          settings={settings}
          view={view}
          setView={setView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isBackendAvailable={isBackendAvailable}
          isProfileReady={isProfileReady}
          profiles={profiles}
          activeProfileId={activeProfileId}
          activeProfile={activeProfile}
          selectProfile={selectProfile}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          tagPool={tagPool}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          isOnline={isOnline}
          persistenceState={persistenceState}
          lastSavedAt={lastSavedAt}
          profileError={profileError}
          setMonkMode={setMonkMode}
          isSidebarVisible={isSidebarVisible}
          toggleSidebarVisible={toggleSidebarVisible}
          toggleSidebarWidget={toggleSidebarWidget}
          setIsShortcutHelpOpen={setIsShortcutHelpOpen}
          openSettings={openSettings}
          addTask={addTask}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {(persistenceState === 'error' || persistenceState === 'offline' || profileError || syncConflict) && (
          <div
            data-testid="sync-recovery-notice"
            className={
              'border-b px-4 py-2 text-xs font-medium ' +
              (persistenceState === 'error' || profileError || syncConflict
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200')
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span>
                {persistenceState === 'error' || profileError || syncConflict
                  ? 'Sync problem: ' +
                    (syncConflict?.message ||
                      profileError ||
                      'Your latest edits remain in this browser. Export a backup if this persists.')
                  : 'Local mode: backend unavailable. Changes are saved on this device until sync is available.'}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {syncConflict && (
                  <>
                    <button
                      type="button"
                      onClick={keepLocalChanges}
                      className="rounded border border-current px-2 py-1 text-[11px]"
                    >
                      Keep local changes
                    </button>
                    <button
                      type="button"
                      onClick={useServerChanges}
                      className="rounded border border-current px-2 py-1 text-[11px]"
                    >
                      Use server version
                    </button>
                  </>
                )}
                {!syncConflict && (persistenceState === 'error' || profileError) && isBackendAvailable && (
                  <button
                    type="button"
                    onClick={reloadActiveProfile}
                    className="rounded border border-current px-2 py-1 text-[11px]"
                  >
                    Reload profile
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        {/* The workspace is purely flex, with strict hidden overflow so only columns scroll */}
        <main className="app-main flex-1 min-h-0 flex flex-col md:flex-row relative bg-slate-100 dark:bg-slate-950 p-2 gap-2 sm:p-4 sm:gap-4 overflow-hidden">
          <WorkspaceContent
            settings={settings}
            setSettings={setSettings}
            view={view}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            tasks={tasks}
            filteredTasks={filteredTasks}
            currentTask={currentTask}
            activeProfile={activeProfile}
            now={now}
            isEnteringMonkMode={isEnteringMonkMode}
            setIsEnteringMonkMode={setIsEnteringMonkMode}
            mantra={mantra}
            setMonkMode={setMonkMode}
            addTask={addTask}
            handlePomodoroComplete={handlePomodoroComplete}
            openSettings={openSettings}
            setSelectedTaskId={setSelectedTaskId}
            quickAddText={quickAddText}
            setQuickAddText={setQuickAddText}
            submitQuickAddTask={submitQuickAddTask}
            planMyDay={planMyDay}
            updateTaskTimer={updateTaskTimer}
            completeTask={completeTask}
            rejectTask={rejectTask}
            columnSorts={columnSorts}
            cycleSort={cycleSort}
            draggedTaskId={draggedTaskId}
            dragOverInfo={dragOverInfo}
            setDraggedTaskId={setDraggedTaskId}
            setDragOverInfo={setDragOverInfo}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragStart={handleDragStart}
            moveTask={moveTask}
            reorderTask={reorderTask}
            keyboardFocusedTaskId={keyboardFocusedTaskId}
            startResize={startResize}
            toggleBoardLane={toggleBoardLane}
          />

          <WorkspaceSidebar
            settings={settings}
            tasks={tasks}
            setTasks={setTasks}
            currentTask={currentTask}
            now={now}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isSidebarVisible={isSidebarVisible}
            setSelectedTaskId={setSelectedTaskId}
            addTask={addTask}
            updateTaskTimer={updateTaskTimer}
            completeTask={completeTask}
            openSettings={openSettings}
            startResize={startResize}
            agendaContainerRef={agendaContainerRef}
            agendaScrollTopRef={agendaScrollTopRef}
            timelineDragRef={timelineDragRef}
            suppressTimelineClickRef={suppressTimelineClickRef}
          />
        </main>

        <ShortcutHelpDialog open={isShortcutHelpOpen} onClose={() => setIsShortcutHelpOpen(false)} />
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
        <ProfileActionDialog
          action={profileAction}
          profileName={activeProfile?.name}
          onCancel={() => setProfileAction(null)}
          onConfirm={profileAction === 'reset' ? resetActiveProfile : removeActiveProfile}
        />
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
