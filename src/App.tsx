import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import {
  Activity,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  EyeOff,
  Filter,
  LayoutDashboard,
  ListTodo,
  Menu,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  Search,
  Settings,
  Square,
  Target,
  Users,
  X
} from 'lucide-react';
import { UrgencyBadge } from './components/UrgencyBadge';
import { KanbanBoard, TaskListView } from './components/board/TaskBoard';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskModal } from './components/task-modal/TaskModal';
import { ThemedSurface } from './components/ui/ThemedSurface';
import { calculateAnalytics } from './domain/analytics';
import { rolePresets } from './domain/rolePresets';
import { getModalEffectStyle, getThemeStyle } from './domain/themes';
import {
  formatDateInputValue,
  formatDurationString,
  formatLiveTimer,
  formatTime,
  generateId,
  calculateTotalDuration,
  normalizeTasksPayload,
  normalizeTask
} from './domain/tasks';
import { apiRequest } from './lib/api';
import { downloadJson } from './lib/download';
import {
  loadInitialLocalSettings,
  loadInitialLocalTasks,
  useLocalFallbackPersistence
} from './hooks/useLocalFallbackPersistence';
import { useProfilesSync } from './hooks/useProfilesSync';
import { useRecurringTasks } from './hooks/useRecurringTasks';
import { useResizableLayout } from './hooks/useResizableLayout';
import { useTaskDraft } from './hooks/useTaskDraft';
import { useTaskFilters } from './hooks/useTaskFilters';
import taskSchema from './task.schema.json';

const taskSchemaId = (taskSchema as { $id?: string }).$id || 'https://the-monastery.local/task.schema.json';

export default function App() {
  const [tasks, setTasks] = useState(loadInitialLocalTasks);
  const [settings, setSettings] = useState(loadInitialLocalSettings);

  /* View & UI State */
  const [view, setView] = useState('board');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverInfo, setDragOverInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [importPreview, setImportPreview] = useState(null);

  const [columnSorts, setColumnSorts] = useState({ new: 'none', done: 'none', rejected: 'none' });

  const { startResize } = useResizableLayout(setSettings);

  /* Modal Collapsible State */
  const [modalSections, setModalSections] = useState({ timer: false, notes: false, activity: true });
  const importInputRef = useRef(null);
  const agendaContainerRef = useRef(null);
  const agendaScrollTopRef = useRef(0);
  const {
    isBackendAvailable,
    isProfileReady,
    profiles,
    activeProfileId,
    selectProfile,
    newProfileName,
    setNewProfileName,
    profileAction,
    setProfileAction,
    profileError,
    activeProfile,
    createProfile,
    resetActiveProfile,
    removeActiveProfile
  } = useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId });
  useLocalFallbackPersistence({
    tasks,
    setTasks,
    settings,
    setSettings,
    isBackendAvailable,
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
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateSystemTheme = () => setIsDarkMode(mediaQuery.matches);
      updateSystemTheme();
      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }

    setIsDarkMode(settings.theme === 'dark');
  }, [settings.theme]);

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

  const exportTasks = () => {
    downloadJson('the-monastery-tasks.json', {
      $schema: taskSchemaId,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      tasks
    });
  };

  const backupData = async () => {
    try {
      if (isBackendAvailable) {
        const backup = await apiRequest('/api/backup');
        downloadJson(`the-monastery-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
        return;
      }

      downloadJson(`the-monastery-backup-${new Date().toISOString().slice(0, 10)}.json`, {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        profiles: [
          {
            id: activeProfileId || 'local',
            name: activeProfile?.name || 'Local',
            settings,
            tasks
          }
        ]
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create backup.');
    }
  };

  const exportTaskSchema = () => {
    downloadJson('the-monastery-task.schema.json', taskSchema);
  };

  const importTasks = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const imported = normalizeTasksPayload(JSON.parse(text));
      const currentById = new Map(tasks.map((task) => [task.id, task] as const));
      const newTasks = imported.filter((task) => !currentById.has(task.id));
      const updatedTasks = imported.filter((task) => {
        const current = currentById.get(task.id);
        return current && JSON.stringify(current) !== JSON.stringify(task);
      });
      const unchangedTasks = imported.filter((task) => {
        const current = currentById.get(task.id);
        return current && JSON.stringify(current) === JSON.stringify(task);
      });

      setImportPreview({ imported, newTasks, updatedTasks, unchangedTasks });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import tasks.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const confirmImportTasks = () => {
    if (!importPreview) return;
    const imported = importPreview.imported;
    setTasks((prev) => {
      const importedIds = new Set(imported.map((task) => task.id));
      return [...imported, ...prev.filter((task) => !importedIds.has(task.id))];
    });
    setSelectedTaskId(null);
    setImportPreview(null);
  };

  const addRole = () => {
    setSettings((prev) => ({
      ...prev,
      roles: [...(prev.roles || []), { id: generateId(), name: 'New Role', tags: [], weeklyTargetHours: 0 }]
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

  const setMonkMode = (enabled) => {
    setSettings((prev) => ({ ...prev, monkMode: enabled }));
    if (enabled) setView('board');
  };

  const openSettings = (section = null) => {
    setSettingsInitialSection(section);
    setIsSettingsOpen(true);
  };

  const isSidebarVisible = settings.sidebarVisible !== false;
  const themeStyle = useMemo(
    () =>
      getThemeStyle(
        settings.visualTheme,
        isDarkMode,
        settings.animationsEnabled !== false,
        settings.colorScheme
      ),
    [isDarkMode, settings.animationsEnabled, settings.visualTheme, settings.colorScheme]
  );
  const modalEffectStyle = useMemo(
    () => getModalEffectStyle(settings.modalTransparency),
    [settings.modalTransparency]
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

  const adjustClockTextScale = (delta) => {
    setSettings((prev) => ({
      ...prev,
      clockTextScale: Math.min(1.4, Math.max(0.7, Number(prev.clockTextScale || 1) + delta))
    }));
  };

  const currentTask = useMemo(() => {
    const activeTask = tasks.find((task) => task.status === 'new' && task.activeLogStart);
    if (activeTask) return activeTask;

    const today = formatDateInputValue(new Date());
    const scheduledToday = tasks
      .filter((task) => task.status === 'new' && task.scheduledDate === today)
      .sort((a, b) => (a.scheduledStart || '99:99').localeCompare(b.scheduledStart || '99:99'))[0];
    if (scheduledToday) return scheduledToday;

    return tasks.find((task) => task.status === 'new') || null;
  }, [tasks]);

  const updateTaskTimer = (taskId) => {
    const timestamp = new Date().toISOString();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) {
          if (!task.activeLogStart) return task;
          return {
            ...task,
            activeLogStart: null,
            logs: [...task.logs, { start: task.activeLogStart, end: timestamp }],
            activity: [
              ...task.activity,
              { id: generateId(), type: 'system', text: 'Timer stopped', timestamp }
            ]
          };
        }

        if (task.activeLogStart) {
          return {
            ...task,
            activeLogStart: null,
            logs: [...task.logs, { start: task.activeLogStart, end: timestamp }],
            activity: [
              ...task.activity,
              { id: generateId(), type: 'system', text: 'Timer stopped', timestamp }
            ]
          };
        }

        return {
          ...task,
          activeLogStart: timestamp,
          activity: [...task.activity, { id: generateId(), type: 'system', text: 'Timer started', timestamp }]
        };
      })
    );
  };

  const completeTask = (taskId) => {
    const timestamp = new Date().toISOString();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          status: 'done',
          activeLogStart: null,
          logs: task.activeLogStart
            ? [...task.logs, { start: task.activeLogStart, end: timestamp }]
            : task.logs,
          activity: [...task.activity, { id: generateId(), type: 'system', text: 'Marked done', timestamp }]
        };
      })
    );
  };

  const addTask = (status = 'new') => {
    const newTask = normalizeTask({
      id: generateId(),
      title: '',
      status,
      urgency: 5,
      tags: [],
      scheduledDate: formatDateInputValue(new Date()),
      scheduledStart: '',
      scheduledEnd: '',
      recurrence: 'none',
      recurrenceRootId: null,
      subtasks: [],
      logs: [],
      activeLogStart: null,
      activity: [
        { id: generateId(), type: 'system', text: 'Task created', timestamp: new Date().toISOString() }
      ]
    });
    setTasks([newTask, ...tasks]);
    setSelectedTaskId(newTask.id);
  };

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
      const draggedTask = prev.find((t) => t.id === draggedTaskId);
      const newTasks = prev.filter((t) => t.id !== draggedTaskId);

      const statusChanged = draggedTask.status !== status;
      draggedTask.status = status;

      if (status === 'done' && draggedTask.activeLogStart) {
        draggedTask.logs.push({ start: draggedTask.activeLogStart, end: new Date().toISOString() });
        draggedTask.activeLogStart = null;
        draggedTask.activity.push({
          id: generateId(),
          type: 'system',
          text: 'Status changed to done (Timer stopped)',
          timestamp: new Date().toISOString()
        });
      } else if (statusChanged) {
        draggedTask.activity.push({
          id: generateId(),
          type: 'system',
          text: `Status changed to ${status}`,
          timestamp: new Date().toISOString()
        });
      }

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

  const analytics = useMemo(
    () => calculateAnalytics({ tasks, roles: settings.roles, now }),
    [tasks, settings.roles, now]
  );

  const cycleSort = (status) => {
    setColumnSorts((prev) => {
      const current = prev[status];
      const next = current === 'none' ? 'urgency' : current === 'urgency' ? 'time' : 'none';
      return { ...prev, [status]: next };
    });
  };

  const renderRadarChart = (roles) => {
    const size = 300;
    const center = size / 2;
    const radius = 104;
    const maxHours = Math.max(1, ...roles.map((role) => role.hours));
    const pointsForScale = (scale) =>
      roles
        .map((_, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(roles.length, 1);
          return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
        })
        .join(' ');
    const valuePoints = roles
      .map((role, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(roles.length, 1);
        const scale = role.hours / maxHours;
        return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
      })
      .join(' ');

    if (roles.length < 3) {
      return (
        <div className="h-[300px] flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          Define at least three roles for radar view
        </div>
      );
    }

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[360px] mx-auto overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={pointsForScale(scale)}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="1"
          />
        ))}
        {roles.map((role, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / roles.length;
          const axisX = center + Math.cos(angle) * radius;
          const axisY = center + Math.sin(angle) * radius;
          const labelX = center + Math.cos(angle) * (radius + 28);
          const labelY = center + Math.sin(angle) * (radius + 28);
          return (
            <g key={role.id}>
              <line
                x1={center}
                y1={center}
                x2={axisX}
                y2={axisY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[10px] font-semibold"
              >
                {role.name}
              </text>
            </g>
          );
        })}
        <polygon points={valuePoints} fill="rgb(79 70 229 / 0.22)" stroke="rgb(79 70 229)" strokeWidth="2" />
        {roles.map((role, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / roles.length;
          const scale = role.hours / maxHours;
          return (
            <circle
              key={role.id}
              cx={center + Math.cos(angle) * radius * scale}
              cy={center + Math.sin(angle) * radius * scale}
              r="3.5"
              fill="rgb(79 70 229)"
            />
          );
        })}
      </svg>
    );
  };

  const renderAgendaTimeline = () => {
    const todayTasks = tasks.filter(
      (t) =>
        t.status !== 'done' &&
        t.status !== 'rejected' &&
        t.scheduledDate === formatDateInputValue(new Date()) &&
        t.scheduledStart
    );
    const nowObj = new Date(now);
    const currentMinutes = nowObj.getHours() * 60 + nowObj.getMinutes();

    const scrollToCurrent = () => {
      if (agendaContainerRef.current) {
        const scrollTo = Math.max(0, currentMinutes - 150);
        agendaContainerRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
    };

    return (
      <div className="timeline-panel h-full min-h-0 flex flex-col border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Calendar size={14} className="text-indigo-500" /> Today's Timeline
          </h3>
          <button
            onClick={scrollToCurrent}
            aria-label="Locate current time"
            className="timeline-current-button grid h-7 w-7 place-items-center rounded-md transition-colors group relative"
            title="Locate Current Time"
          >
            <Target size={14} strokeWidth={2.4} />
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-900 custom-scrollbar"
          ref={agendaContainerRef}
          onScroll={(e) => {
            agendaScrollTopRef.current = e.currentTarget.scrollTop;
          }}
        >
          <div className="relative h-[1440px] w-full">
            {/* 1 Hour Grid Markers Full Width Transparent */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full flex items-center pointer-events-none z-0"
                style={{ top: `${i * 60}px` }}
              >
                <div className="w-20 text-[10px] font-medium text-slate-400 dark:text-slate-500 text-right pr-3 whitespace-nowrap">
                  {formatTime(new Date(new Date().setHours(i, 0, 0, 0)), settings.clockFormat)}
                </div>
                <div className="flex-1 border-t border-slate-300/30 dark:border-slate-600/30 w-full h-px"></div>
              </div>
            ))}

            {/* Current Time Red Line */}
            <div
              className="absolute w-full flex items-center z-20 pointer-events-none"
              style={{ top: `${currentMinutes}px` }}
            >
              <div className="w-20 text-[10px] font-bold text-red-500 text-right pr-3 whitespace-nowrap">
                {formatTime(now, settings.clockFormat)}
              </div>
              <div className="flex-1 h-px bg-red-500/50 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
            </div>

            {/* Task Blocks */}
            <div className="absolute top-0 bottom-0 left-20 right-2 z-10">
              {todayTasks.map((task) => {
                const [startH, startM] = task.scheduledStart.split(':').map(Number);
                const top = startH * 60 + startM;
                let duration = 60;
                if (task.scheduledEnd) {
                  const [endH, endM] = task.scheduledEnd.split(':').map(Number);
                  duration = Math.max(15, endH * 60 + endM - top);
                }
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="absolute left-1 right-1 rounded-md p-2 text-xs cursor-pointer overflow-hidden border transition-all shadow-sm group hover:z-30 hover:shadow-md bg-white/95 dark:bg-slate-800/95 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400"
                    style={{ top: `${top}px`, height: `${duration}px` }}
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {task.title || 'Untitled'}
                    </div>
                    {duration >= 45 && (
                      <div className="flex items-center gap-2 mt-1">
                        <UrgencyBadge urgency={task.urgency} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentTaskPin = (variant = 'sidebar') => {
    const isWide = variant === 'wide';

    if (!currentTask) {
      return (
        <section
          data-testid="current-task-pin"
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${
            isWide ? 'p-6' : 'p-4'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Now</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">No active task pinned.</div>
          <button
            onClick={() => addTask('new')}
            className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus size={15} /> New task
          </button>
        </section>
      );
    }

    const trackedLabel = currentTask.activeLogStart
      ? formatLiveTimer(currentTask.activeLogStart, now)
      : formatDurationString(calculateTotalDuration(currentTask.logs));

    return (
      <section
        data-testid="current-task-pin"
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${
          isWide ? 'p-6' : 'p-4'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Now</div>
          <button
            onClick={() => setSelectedTaskId(currentTask.id)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Open
          </button>
        </div>
        <button onClick={() => setSelectedTaskId(currentTask.id)} className="block w-full text-left group">
          <h2
            className={`font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 ${
              isWide ? 'text-3xl' : 'text-base'
            }`}
          >
            {currentTask.title || 'Untitled task'}
          </h2>
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1">
            {trackedLabel}
          </span>
          <UrgencyBadge urgency={currentTask.urgency} />
          {(currentTask.tags || []).slice(0, isWide ? 5 : 2).map((tag) => (
            <span key={tag} className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
        <div className={`mt-4 grid gap-2 ${isWide ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            onClick={() => updateTaskTimer(currentTask.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
              currentTask.activeLogStart
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {currentTask.activeLogStart ? <Square size={14} /> : <Play size={14} />}
            {currentTask.activeLogStart ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={() => completeTask(currentTask.id)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-300 text-sm font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} /> Done
          </button>
        </div>
      </section>
    );
  };

  const renderMonkMode = () => {
    const nextTasks = tasks
      .filter((task) => task.status === 'new' && task.id !== currentTask?.id)
      .slice(0, 6);

    return (
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-8">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Monk Mode</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                One task, quiet controls, no dashboard noise.
              </p>
            </div>
            <button
              onClick={() => setMonkMode(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Exit
            </button>
          </div>

          {renderCurrentTaskPin('wide')}

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Next</div>
            <div className="space-y-2">
              {nextTasks.length === 0 && (
                <div className="text-sm text-slate-400">No queued tasks. Keep the lane clear.</div>
              )}
              {nextTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="w-full text-left rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-500/60"
                >
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                    {task.title || 'Untitled task'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{task.scheduledStart || 'Unscheduled'}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${isDarkMode ? 'dark' : ''} app-shell h-screen w-full flex flex-col overflow-hidden`}
      data-text-size={settings.textSize}
      data-visual-theme={settings.visualTheme}
      data-monk-mode={settings.monkMode ? 'true' : 'false'}
      data-animations-enabled={settings.animationsEnabled === false ? 'false' : 'true'}
      style={
        {
          ...themeStyle,
          ...modalEffectStyle
        } as React.CSSProperties
      }
    >
      <div className="app-frame h-full w-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors duration-200">
        {/* Header - Fixed Height */}
        <header
          data-material="control"
          className="app-header bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex justify-between items-center shrink-0 z-[70] shadow-sm"
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
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {!settings.monkMode && (
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
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
              <div>
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

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

            <button
              aria-label={settings.monkMode ? 'Exit monk mode' : 'Enter monk mode'}
              onClick={() => setMonkMode(!settings.monkMode)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border transition-colors ${
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
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium border transition-colors ${
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
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium border transition-colors ${
                settings.sidebarWidgets.includes('clock')
                  ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <Clock size={16} />
            </button>

            <button
              aria-label="Open settings"
              onClick={() => openSettings()}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              <Settings size={18} />
            </button>

            <button
              aria-label="New task"
              onClick={() => addTask('new')}
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium shrink-0"
            >
              <Plus size={16} /> <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </header>

        {}
        {/* The workspace is purely flex, with strict hidden overflow so only columns scroll */}
        <main className="app-main flex-1 min-h-0 flex flex-col md:flex-row relative bg-slate-100 dark:bg-slate-950 p-4 gap-4 overflow-hidden">
          {/* Main Content Area (Kanban or Analytics) */}
          <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
            {!settings.monkMode && view !== 'dashboard' && (
              <label className="lg:hidden mb-3 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-500">
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

            {settings.monkMode && renderMonkMode()}

            {!settings.monkMode && view === 'dashboard' && (
              <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">Analytics</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Tracked time is credited to matching tags and roles.
                      </p>
                    </div>
                    {activeProfile && (
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Profile: {activeProfile.name}
                      </div>
                    )}
                    <button
                      onClick={() => openSettings('roles')}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Role settings
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="text-slate-500 text-sm mb-1">Total Tracked</div>
                      <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {formatDurationString(analytics.totalTrackedMs)}
                      </div>
                    </div>
                    {(['new', 'done', 'rejected'] as const).map((status) => (
                      <div
                        key={status}
                        className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <div className="text-slate-500 text-sm mb-1 capitalize">{status}</div>
                        <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100">
                          {analytics.statusCounts[status]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
                    <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-base font-bold">Role Radar</h3>
                        <span className="text-xs text-slate-500">points = hours</span>
                      </div>
                      {renderRadarChart(analytics.roleRows)}
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="text-base font-bold mb-4">Role Hours</h3>
                      <div className="space-y-3">
                        {analytics.roleRows.length === 0 && (
                          <div className="text-sm text-slate-400">No roles defined.</div>
                        )}
                        {analytics.roleRows.map((role) => {
                          const maxRoleHours = Math.max(1, ...analytics.roleRows.map((item) => item.hours));
                          const targetHours = Math.max(0, Number(role.weeklyTargetHours) || 0);
                          const progressBase = targetHours > 0 ? targetHours : maxRoleHours;
                          return (
                            <div key={role.id}>
                              <div className="flex justify-between gap-3 text-sm mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {role.name}
                                </span>
                                <span className="font-mono text-slate-500">
                                  {role.hours.toFixed(2)}h{targetHours > 0 ? ` / ${targetHours}h` : ''}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500"
                                  style={{ width: `${Math.min(100, (role.hours / progressBase) * 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 truncate">
                                {role.matchingTags.length
                                  ? role.matchingTags.join(', ')
                                  : 'No matching tracked tags'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="text-base font-bold mb-4">Tag Hours</h3>
                      <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                        {analytics.tagRows.length === 0 && (
                          <div className="text-sm text-slate-400">No tracked tag time yet.</div>
                        )}
                        {analytics.tagRows.map((row) => {
                          const maxTagHours = Math.max(1, ...analytics.tagRows.map((item) => item.hours));
                          return (
                            <div
                              key={row.tag}
                              className="grid grid-cols-[8rem_1fr_4rem] items-center gap-3 text-sm"
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                {row.tag}
                              </span>
                              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${Math.min(100, (row.hours / maxTagHours) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-xs text-slate-500 text-right">
                                {row.hours.toFixed(2)}h
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="text-base font-bold mb-4">Tasks by Status</h3>
                      <div className="space-y-3">
                        {(['new', 'done', 'rejected'] as const).map((status) => {
                          const maxStatus = Math.max(
                            1,
                            analytics.statusCounts.new,
                            analytics.statusCounts.done,
                            analytics.statusCounts.rejected
                          );
                          const color =
                            status === 'new'
                              ? 'bg-indigo-500'
                              : status === 'done'
                                ? 'bg-emerald-500'
                                : 'bg-rose-500';
                          return (
                            <div key={status}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize font-medium">{status}</span>
                                <span className="font-mono text-slate-500">
                                  {analytics.statusCounts[status]}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full ${color}`}
                                  style={{ width: `${(analytics.statusCounts[status] / maxStatus) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}

            {!settings.monkMode && view === 'mobile' && (
              <div className="flex-1 min-h-0">
                <TaskListView filteredTasks={filteredTasks} setSelectedTaskId={setSelectedTaskId} now={now} />
              </div>
            )}

            {!settings.monkMode && view === 'board' && (
              <>
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={() => openSettings('board')}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                  >
                    Board settings
                  </button>
                </div>
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
                  now={now}
                  startResize={startResize}
                />
              </>
            )}
          </div>

          <div
            data-testid="main-sidebar-resizer"
            className={`resize-handle resize-handle-vertical hidden md:flex w-1 cursor-col-resize shrink-0 items-center justify-center hover:bg-indigo-500/10 group rounded ${isSidebarVisible ? '' : 'md:hidden'}`}
            onMouseDown={() => startResize('main-sidebar')}
            title="Resize sidebar"
          >
            <div className="resize-grip resize-grip-vertical w-px h-12 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
          </div>

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
              {settings.sidebarWidgets.includes('now') && renderCurrentTaskPin('sidebar')}

              {settings.sidebarWidgets.includes('clock') && (
                <div
                  data-material="widget"
                  className="clock-widget bg-slate-900 dark:bg-black rounded-2xl p-4 flex flex-col items-center justify-center text-white shadow-inner relative overflow-hidden shrink-0"
                  style={{ height: `${settings.clockHeight || 160}px` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 pointer-events-none"></div>
                  <div className="clock-widget-controls absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
                    <button
                      type="button"
                      aria-label="Open clock settings"
                      onClick={() => openSettings('time')}
                      className="grid h-6 w-6 place-items-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
                    >
                      <Settings size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Hide clock"
                      onClick={() => toggleSidebarWidget('clock')}
                      className="grid h-6 w-6 place-items-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
                    >
                      <EyeOff size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Decrease clock text size"
                      onClick={() => adjustClockTextScale(-0.1)}
                      disabled={(settings.clockTextScale || 1) <= 0.7}
                      className="grid h-6 w-6 place-items-center rounded-md text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Minus size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Increase clock text size"
                      onClick={() => adjustClockTextScale(0.1)}
                      disabled={(settings.clockTextScale || 1) >= 1.4}
                      className="grid h-6 w-6 place-items-center rounded-md text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div
                    data-testid="clock-time"
                    className="font-mono font-bold mb-1 relative z-10 drop-shadow-md leading-none whitespace-nowrap max-w-full text-center"
                    style={{
                      fontSize: `clamp(1.75rem, ${(settings.clockTextScale || 1) * 2.25}rem, ${Math.max(
                        2,
                        ((settings.clockHeight || 160) - 58) / 28
                      )}rem)`
                    }}
                  >
                    {formatTime(now, settings.clockFormat, settings.showSeconds)}
                  </div>
                  <div className="text-sm font-medium text-slate-400 relative z-10">
                    {new Intl.DateTimeFormat('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    }).format(now)}
                  </div>
                </div>
              )}

              {settings.sidebarWidgets.includes('clock') && settings.sidebarWidgets.includes('agenda') && (
                <div
                  className="resize-handle resize-handle-horizontal h-2 w-full cursor-row-resize shrink-0 flex items-center justify-center hover:bg-indigo-500/10 group rounded"
                  onMouseDown={() => startResize('sidebar-clock')}
                  title="Resize clock and timeline"
                >
                  <div className="resize-grip resize-grip-horizontal h-px w-12 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
                </div>
              )}

              {settings.sidebarWidgets.includes('agenda') && (
                <div className="min-h-0 flex-1 overflow-hidden">{renderAgendaTimeline()}</div>
              )}
            </div>
          </div>
        </main>

        {}
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
            exportTaskSchema={exportTaskSchema}
            importInputRef={importInputRef}
            importTasks={importTasks}
            tagPool={tagPool}
            isDarkMode={isDarkMode}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        {profileAction && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setProfileAction(null);
            }}
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl"
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
        {importPreview && (
          <ThemedSurface
            variant="overlay"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setImportPreview(null);
            }}
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
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
                    <div className="text-xs text-slate-500">New</div>
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
        <TaskModal
          draftTask={draftTask}
          draftNote={draftNote}
          setDraftNote={setDraftNote}
          modalSections={modalSections}
          setModalSections={setModalSections}
          now={now}
          clockFormat={settings.clockFormat}
          updateDraftTask={updateDraftTask}
          closeTaskModal={closeTaskModal}
          saveDraftTask={saveDraftTask}
          closeAfterSave={() => setSelectedTaskId(null)}
          showDeleteTaskPrompt={showDeleteTaskPrompt}
          setShowDeleteTaskPrompt={setShowDeleteTaskPrompt}
          deleteDraftTask={deleteDraftTask}
          showDirtyClosePrompt={showDirtyClosePrompt}
          setShowDirtyClosePrompt={setShowDirtyClosePrompt}
          discardDraftTask={discardDraftTask}
          tagPool={tagPool}
        />
      </div>
    </div>
  );
}
