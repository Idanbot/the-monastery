import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import { Command } from 'cmdk';
import { Toaster, toast } from 'sonner';
import {
  Activity,
  BarChart2,
  ChevronDown,
  Clock,
  Filter,
  Keyboard,
  LayoutDashboard,
  ListTodo,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  Target,
  Users,
  X,
  HelpCircle
} from 'lucide-react';
import { AgendaTimeline } from './components/timeline/AgendaTimeline';
import { KanbanBoard, TaskListView } from './components/board/TaskBoard';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskModal } from './components/task-modal/TaskModal';

import { CommandPalette } from './components/CommandPalette';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { ThemedSurface } from './components/ui/ThemedSurface';
import { MonkModeView } from './components/monk-mode/MonkModeView';
import { PersistenceStatusChip } from './components/PersistenceStatusChip';
import { CurrentTaskPin } from './components/CurrentTaskPin';
import { MobileBoardControls } from './components/board/MobileBoardControls';
import type { PersistenceStatus } from './domain/persistenceStatus';
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
import { getModalEffectStyle, getThemeStyle, visualThemeOptions, themeContracts } from './domain/themes';
import {
  formatDateInputValue,
  formatTime,
  generateId,
  normalizeTask,
  activeTaskStatuses
} from './domain/tasks';
import { useBackupActions } from './hooks/useBackupActions';
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
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverInfo, setDragOverInfo] = useState(null);
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

  const [columnSorts, setColumnSorts] = useState({
    backlog: 'none',
    'in-progress': 'none',
    done: 'none',
    rejected: 'none'
  });

  const { startResize } = useResizableLayout(setSettings);

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
          ...(settings.roles || []).flatMap((role) => role.tags || []),
          ...rolePresets.flatMap((preset) => preset.tags)
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [allUniqueTags, settings.roles]
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
  const createRoleRoutineTasks = () => {
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
  };

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

  const setMonkMode = (enabled) => {
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
  };

  const openSettings = (section = null) => {
    setSettingsInitialSection(section);
    setIsSettingsOpen(true);
  };
  const isSidebarVisible = settings.sidebarVisible !== false;
  const themeStyle = useMemo(
    () =>
      getThemeStyle(settings.visualTheme, systemIsDark, true, {
        ...settings.colorScheme,
        fontMain: settings.fontMain,
        fontSecondary: settings.fontSecondary,
        fontUI: settings.fontUI
      }),
    [
      settings.visualTheme,
      settings.colorScheme,
      settings.fontMain,
      settings.fontSecondary,
      settings.fontUI,
      systemIsDark
    ]
  );
  const modalEffectStyle = useMemo(
    () => getModalEffectStyle(settings.modalTransparency, settings.modalBlur),
    [settings.modalTransparency, settings.modalBlur]
  );

  const clockDate = new Date(now);
  const clockMinuteAngle = clockDate.getMinutes() * 6 + clockDate.getSeconds() * 0.1;
  const clockSecondAngle = clockDate.getSeconds() * 6;
  const clockHourAngle = ((clockDate.getHours() % 12) + clockDate.getMinutes() / 60) * 30;

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

  const addTask = (status = 'backlog', overrides: any = {}) => {
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
      tags: smartTags
    });
    setTasks((previous) => executeTaskCommand(previous, { type: 'create', task: newTask }).tasks);
    setSelectedTaskId(newTask.id);
  };

  const submitQuickAddTask = (event) => {
    event.preventDefault();
    const parsed = parseQuickAddTask(quickAddText);
    if (!parsed.title) return;
    addTask('backlog', parsed.overrides);
    setQuickAddText('');
  };

  const startFocusTask = () => {
    addTask('backlog', {
      title: '',
      urgency: 7,
      tags: ['focus'],
      scheduledDate: formatDateInputValue(new Date())
    });
  };

  const planMyDay = () => {
    const today = formatDateInputValue(new Date());
    const startHour = Math.max(9, new Date().getHours() + 1);
    setTasks(
      (previous) =>
        executeTaskCommand(previous, { type: 'plan-day', date: today, startMinutes: startHour * 60 }).tasks
    );
    setView('board');
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen((open) => !open);
        return;
      }
      if (isTyping || isCommandOpen || selectedTaskId) return;
      const navigationKeys = ['j', 'k', 'Enter'];
      if (navigationKeys.includes(event.key)) {
        if (filteredTasks.length === 0) return;
        event.preventDefault();
        const currentIndex = Math.max(
          0,
          filteredTasks.findIndex((task) => task.id === keyboardFocusedTaskId)
        );
        if (event.key === 'Enter') {
          setSelectedTaskId(filteredTasks[currentIndex]?.id || filteredTasks[0].id);
          return;
        }
        const direction = event.key === 'j' ? 1 : -1;
        const nextIndex = (currentIndex + direction + filteredTasks.length) % filteredTasks.length;
        setKeyboardFocusedTaskId(filteredTasks[nextIndex].id);
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        addTask('backlog');
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        startFocusTask();
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        planMyDay();
      }
      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setView('dashboard');
      }
      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setView('board');
      }
      if (event.key === '?') {
        event.preventDefault();
        setIsShortcutHelpOpen(true);
      }
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setSettings((previous) => {
          const newMode = !previous.monkMode;
          if (newMode) setIsEnteringMonkMode(true);
          return {
            ...previous,
            monkMode: newMode,
            monkModeOpenedAt: newMode ? new Date().toISOString() : undefined
          };
        });
      }
      if (event.key === '/') {
        event.preventDefault();
        setView('mobile');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
    // The shortcut handler intentionally rebinds only when visible keyboard scope changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTasks, isCommandOpen, keyboardFocusedTaskId, selectedTaskId]);

  const handleDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    const crt = e.currentTarget.cloneNode(true);
    crt.style.opacity = '0';
    crt.style.position = 'absolute';
    crt.style.top = '-1000px';
    document.body.appendChild(crt);
    e.dataTransfer.setDragImage(crt, 0, 0);
    setTimeout(() => {
      document.body.removeChild(crt);
      e.target.style.opacity = '0.5';
    }, 10);
  };

  const handleDragOver = (e, status, targetTaskId = null) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    if (!targetTaskId) {
      setDragOverInfo({ status, id: null, position: 'bottom' });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position = y < rect.height / 2 ? 'top' : 'bottom';

    if (dragOverInfo?.id !== targetTaskId || dragOverInfo?.position !== position) {
      setDragOverInfo({ status, id: targetTaskId, position });
    }
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    setTasks((prev) => {
      const movedTasks = executeTaskCommand(prev, { type: 'move', taskId: draggedTaskId, status }).tasks;
      const draggedTask = movedTasks.find((task) => task.id === draggedTaskId);
      if (!draggedTask) return prev;
      const newTasks = movedTasks.filter((task) => task.id !== draggedTaskId);

      if (!dragOverInfo || !dragOverInfo.id) {
        newTasks.push(draggedTask);
      } else {
        const targetIndex = newTasks.findIndex((t) => t.id === dragOverInfo.id);
        if (targetIndex !== -1) {
          const insertIndex = dragOverInfo.position === 'top' ? targetIndex : targetIndex + 1;
          newTasks.splice(insertIndex, 0, draggedTask);
        } else {
          newTasks.push(draggedTask);
        }
      }
      return newTasks;
    });

    setDraggedTaskId(null);
    setDragOverInfo(null);
    e.target.style.opacity = '1';
  };

  const cycleSort = (status) => {
    setColumnSorts((prev) => {
      const current = prev[status];
      const next = current === 'none' ? 'urgency' : current === 'urgency' ? 'time' : 'none';
      return { ...prev, [status]: next };
    });
  };

  const handlePomodoroComplete = (minutes) => {
    if (!currentTask) return;
    setTasks(
      (prev) => executeTaskCommand(prev, { type: 'record-focus', taskId: currentTask.id, minutes }).tasks
    );
  };
  const persistenceState = persistenceStatus as PersistenceStatus;
  usePersistenceNotifier(persistenceState, lastSavedAt);

  return (
    <div
      className={`${isDarkMode ? 'dark' : ''} app-shell h-screen w-full flex flex-col overflow-hidden`}
      data-text-size={settings.textSize}
      data-visual-theme={settings.visualTheme}
      data-monk-mode={settings.monkMode ? 'true' : 'false'}
      data-animations-enabled={settings.animationsEnabled === false ? 'false' : 'true'}
      data-resize-bars={settings.resizeHandleVisible === false ? 'false' : 'true'}
      style={
        {
          ...themeStyle,
          ...modalEffectStyle,
          '--resize-handle-thickness': String(settings.resizeHandleThickness || 4) + 'px',
          '--resize-handle-length': String(settings.resizeHandleLength || 48) + 'px',
          '--resize-handle-color': settings.resizeHandleColor || '#94a3b8'
        } as React.CSSProperties
      }
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
            {!settings.monkMode && (
              <select
                aria-label="Current view"
                value={view}
                onChange={(event) => setView(event.target.value)}
                className="max-w-24 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:hidden"
              >
                <option value="board">Board</option>
                <option value="mobile">List</option>
                <option value="dashboard">Analytics</option>
              </select>
            )}
            {!settings.monkMode && (
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setView('board')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${view === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <LayoutDashboard size={14} /> <span className="hidden md:inline">Board</span>
                </button>
                <button
                  onClick={() => setView('mobile')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${view === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <ListTodo size={14} /> <span className="hidden md:inline">List</span>
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <BarChart2 size={14} /> <span className="hidden md:inline">Analytics</span>
                </button>
              </div>
            )}

            {!settings.monkMode && (
              <label className="hidden lg:flex items-center gap-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-500">
                <Search size={15} className="shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            )}

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
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Filter by Tags
                    </h4>
                    {allUniqueTags.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No tags used yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {allUniqueTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() =>
                              setActiveFilters((prev) =>
                                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                              )
                            }
                            className={`px-2 py-1 text-xs rounded-md border transition-colors ${activeFilters.includes(tag) ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/50 dark:border-indigo-500/50 dark:text-indigo-200' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    {activeFilters.length > 0 && (
                      <button
                        onClick={() => setActiveFilters([])}
                        className="mt-2 text-xs text-rose-500 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
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
              <label className="lg:hidden mb-2 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-500 sm:mb-3 sm:py-2">
                <Search size={15} className="shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
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
                />
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
                <div
                  data-material="widget"
                  data-clock-background={settings.clockBackgroundVisible === false ? 'false' : 'true'}
                  data-clock-mode={settings.clockDisplayMode === 'analog' ? 'analog' : 'digital'}
                  className="clock-widget rounded-2xl border p-4 flex flex-col items-center justify-center relative overflow-hidden shrink-0"
                  style={
                    {
                      height: String(settings.clockHeight || 160) + 'px',
                      background:
                        settings.clockBackgroundVisible === false
                          ? 'transparent'
                          : 'var(--clock-background-color)',
                      borderColor:
                        settings.clockBackgroundVisible === false ? 'transparent' : 'var(--theme-border)',
                      '--clock-text-color':
                        settings.clockTextColor || settings.colorScheme?.text || 'var(--theme-text)',
                      '--clock-background-color': settings.clockBackgroundColor || 'var(--theme-surface)',
                      color: 'var(--clock-text-color)',
                      boxShadow: settings.clockBackgroundVisible === false ? 'none' : undefined
                    } as React.CSSProperties
                  }
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 pointer-events-none"></div>
                  <div className="clock-widget-controls absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg border border-[color:var(--theme-border)] bg-[color:var(--theme-muted-surface)] p-1 backdrop-blur-sm">
                    <button
                      type="button"
                      aria-label="Open clock settings"
                      onClick={() => openSettings('time')}
                      className="grid h-6 w-6 place-items-center rounded-md text-[color:var(--theme-muted-text)] hover:bg-[color:var(--theme-muted-surface)] hover:text-[color:var(--theme-text)]"
                    >
                      <Settings size={13} />
                    </button>
                  </div>
                  {settings.clockDisplayMode === 'analog' ? (
                    <div
                      data-testid="clock-analog"
                      className="relative z-10 mb-2 grid place-items-center rounded-full border-2"
                      style={{
                        width: Math.min(92, Math.max(58, (settings.clockHeight || 160) - 76)) + 'px',
                        height: Math.min(92, Math.max(58, (settings.clockHeight || 160) - 76)) + 'px',
                        color: 'var(--clock-text-color)',
                        borderColor: 'currentColor'
                      }}
                    >
                      <div className="absolute h-1.5 w-1.5 rounded-full bg-current" />
                      <div
                        className="absolute bottom-1/2 left-1/2 h-[28%] w-0.5 origin-bottom rounded-full bg-current"
                        style={{ transform: 'translateX(-50%) rotate(' + clockHourAngle + 'deg)' }}
                      />
                      <div
                        className="absolute bottom-1/2 left-1/2 h-[38%] w-px origin-bottom rounded-full bg-current"
                        style={{ transform: 'translateX(-50%) rotate(' + clockMinuteAngle + 'deg)' }}
                      />
                      {settings.showSeconds && (
                        <div
                          data-testid="clock-second-hand"
                          className="absolute bottom-1/2 left-1/2 h-[42%] w-px origin-bottom rounded-full bg-rose-500"
                          style={{ transform: 'translateX(-50%) rotate(' + clockSecondAngle + 'deg)' }}
                        />
                      )}
                    </div>
                  ) : (
                    <div
                      data-testid="clock-time"
                      className="font-mono font-bold mb-1 relative z-10 drop-shadow-md leading-none whitespace-nowrap max-w-full text-center"
                      style={{
                        color: 'var(--clock-text-color)',
                        fontSize: `clamp(1.75rem, ${(settings.clockTextScale || 1) * 2.25}rem, ${Math.max(
                          2,
                          ((settings.clockHeight || 160) - 58) / 28
                        )}rem)`
                      }}
                    >
                      {formatTime(now, settings.clockFormat, settings.showSeconds)}
                    </div>
                  )}
                  <div className="text-sm font-medium text-[color:var(--theme-muted-text)] relative z-10">
                    {new Intl.DateTimeFormat('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    }).format(now)}
                  </div>
                </div>
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

        {}
        {isCommandOpen && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsCommandOpen(false);
            }}
          >
            <ThemedSurface
              role="dialog"
              aria-label="Command palette"
              variant="modal"
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Keyboard size={16} className="text-indigo-500" />
                <h3 className="font-bold text-sm">Command Palette</h3>
              </div>
              <Command className="p-2" shouldFilter loop>
                <Command.Input
                  aria-label="Search commands"
                  placeholder="Search commands"
                  className="mb-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
                <Command.List className="max-h-[22rem] overflow-y-auto custom-scrollbar space-y-1">
                  <Command.Empty className="px-3 py-4 text-sm text-slate-400">
                    No command found.
                  </Command.Empty>
                  <Command.Group heading="Actions">
                    <Command.Item
                      value="backlog focus task"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        startFocusTask();
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Backlog focus task
                    </Command.Item>
                    <Command.Item
                      value="backlog task"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        addTask('backlog');
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Backlog task
                    </Command.Item>
                    <Command.Item
                      value="monk mode"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        setMonkMode(!settings.monkMode);
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      {settings.monkMode ? 'Exit Monk Mode' : 'Enter Monk Mode'}
                    </Command.Item>
                    <Command.Item
                      value="open settings"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        openSettings();
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Open settings
                    </Command.Item>
                    <Command.Item
                      value="go to analytics dashboard"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        setView('dashboard');
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Go to analytics
                    </Command.Item>
                    <Command.Item
                      value="theme studio appearance"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        openSettings('appearance');
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Theme Studio
                    </Command.Item>
                    <Command.Item
                      value="plan my day"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        planMyDay();
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Plan my day
                    </Command.Item>
                    <Command.Item
                      value="keyboard shortcuts help"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        setIsShortcutHelpOpen(true);
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Keyboard shortcuts
                    </Command.Item>
                    <Command.Item
                      value="create role routines"
                      onSelect={() => {
                        setIsCommandOpen(false);
                        createRoleRoutineTasks();
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                    >
                      Create role routines
                    </Command.Item>
                  </Command.Group>
                  <Command.Group heading="Themes">
                    {visualThemeOptions.map((theme) => (
                      <Command.Item
                        key={theme.id}
                        value={`theme ${theme.label}`}
                        onSelect={() => {
                          setIsCommandOpen(false);
                          setSettings((s) => ({
                            ...s,
                            visualTheme: theme.id,
                            theme: themeContracts[theme.id]?.preferredMode === 'dark' ? 'dark' : 'light',
                            colorScheme: { main: '', secondary: '', text: '' },
                            fontMain: '',
                            fontSecondary: '',
                            clockTextColor: '',
                            clockBackgroundColor: ''
                          }));
                        }}
                        className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: (
                              themeContracts[theme.id]?.tokens?.light ||
                              themeContracts[theme.id]?.tokens?.dark
                            )?.bg
                          }}
                        ></div>
                        Theme: {theme.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <Command.Group heading="Navigation">
                    {(
                      [
                        ['Liquid Glass', 'liquid-glass', 'light'],
                        ['Zen', 'zen', 'light'],
                        ['Terminal White', 'terminal-white', 'dark']
                      ] as const
                    ).map(([label, visualTheme, theme]) => (
                      <Command.Item
                        key={visualTheme}
                        value={String(label)}
                        onSelect={() => {
                          setIsCommandOpen(false);
                          setSettings((previous) => ({ ...previous, visualTheme, theme }));
                        }}
                        className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                      >
                        {label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                  {profiles.length > 0 && (
                    <Command.Group heading="Profiles">
                      {profiles.slice(0, 4).map((profile) => (
                        <Command.Item
                          key={profile.id}
                          value={profile.name}
                          onSelect={() => {
                            setIsCommandOpen(false);
                            selectProfile(profile.id);
                          }}
                          className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                        >
                          {profile.name}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                </Command.List>
              </Command>
            </ThemedSurface>
          </ThemedSurface>
        )}
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
        <CommandPalette
          settings={settings}
          setSettings={setSettings}
          setMonkMode={setMonkMode}
          setView={setView}
          openTaskModal={() => addTask('backlog')}
        />
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
          updateDraftTask={(updates) => {
            if (!draftTask || typeof updates.title !== 'string') {
              updateDraftTask(updates);
              return;
            }
            updateDraftTask({
              ...updates,
              tags: inferTaskTags({
                title: updates.title,
                existingTags: draftTask.tags || [],
                tagPool,
                roles: tagRoles
              })
            });
          }}
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
        />
      </div>
    </div>
  );
}
