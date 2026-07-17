import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Columns3,
  Music2,
  RotateCcw,
  Settings2,
  Target,
  X
} from 'lucide-react';
import { ActivityGraph } from '../dashboard/ActivityGraph';
import { ClockWidget } from '../ClockWidget';
import { CurrentTaskPin } from '../CurrentTaskPin';
import { PomodoroTimer } from '../monk-mode/PomodoroTimer';
import { KanbanBoard } from '../board/TaskBoard';
import { FocusPlanningPanel } from '../planning/FocusPlanningPanel';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import {
  defaultMainViewModules,
  mainViewModuleDefinitions,
  moveMainViewModule,
  normalizeMainViewModules,
  updateMainViewModule
} from '../../domain/mainView';
import { activeTaskStatuses, formatDateInputValue } from '../../domain/tasks';
import { sendBrowserNotification } from '../../domain/notifications';
import type { MainViewArea, MainViewModule, Task } from '../../domain/types';

export function MainWorkspace() {
  const { settings, setSettings, openSettings, startResize, toggleBoardLane } = useSettingsContext();
  const {
    tasks,
    filteredTasks,
    currentTask,
    addTask,
    updateTaskTimer,
    completeTask,
    setSelectedTaskId,
    applyFocusPlan,
    recordFocusSession,
    columnSorts,
    cycleSort,
    draggedTaskId,
    dragOverInfo,
    setDraggedTaskId,
    setDragOverInfo,
    handleDragOver,
    handleDrop,
    handleDragStart,
    moveTask,
    reorderTask
  } = useTaskContext();
  const {
    now,
    setView,
    setMonkMode,
    openMediaPlayer,
    quickAddText,
    setQuickAddText,
    submitQuickAddTask,
    keyboardFocusedTaskId
  } = useUIContext();
  const [customizing, setCustomizing] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [focusPlannerOpen, setFocusPlannerOpen] = useState(false);
  const modules = useMemo(
    () => normalizeMainViewModules(settings.mainViewModules),
    [settings.mainViewModules]
  );
  const visibleCenter = modules.filter((module) => module.visible && module.area === 'center');
  const visibleRight = modules.filter((module) => module.visible && module.area === 'right');

  const setModules = (next: MainViewModule[]) =>
    setSettings((previous) => ({ ...previous, mainViewModules: next }));

  const renderModule = (module: MainViewModule) => {
    if (module.id === 'focus') {
      return (
        <MainFocusModule
          key={module.id}
          area={module.area}
          settings={settings}
          now={now}
          currentTask={currentTask}
          onOpenTask={setSelectedTaskId}
          onAddTask={() => addTask('backlog')}
          onToggleTimer={updateTaskTimer}
          onCompleteTask={completeTask}
          onEnterMonkMode={() => setMonkMode(true)}
          onUpdateDailyGoal={(dailyGoal) => setSettings((previous) => ({ ...previous, dailyGoal }))}
          onPomodoroComplete={(minutes) => {
            if (settings.notificationsEnabled) {
              sendBrowserNotification('Pomodoro complete', {
                body: 'Focus session complete. Time for a short break.',
                tag: 'pomodoro-complete'
              });
            }
            if (currentTask) recordFocusSession(currentTask.id, minutes);
          }}
        />
      );
    }
    if (module.id === 'activity') {
      return (
        <div key={module.id} data-testid="main-activity-module" data-area={module.area}>
          <ActivityGraph tasks={tasks} now={now} compact />
        </div>
      );
    }
    if (module.id === 'calendar') {
      return (
        <MainCalendarModule
          key={module.id}
          area={module.area}
          tasks={tasks}
          now={now}
          onOpenCalendar={() => setView('calendar')}
          onOpenTask={setSelectedTaskId}
        />
      );
    }
    if (module.id === 'media') {
      return (
        <MainMediaModule
          key={module.id}
          area={module.area}
          url={settings.focusMediaUrl}
          onOpen={openMediaPlayer}
        />
      );
    }
    return (
      <div key={module.id} data-testid="main-clock-module" data-area={module.area}>
        <ClockWidget settings={settings} now={now} onOpenSettings={openSettings} />
      </div>
    );
  };

  return (
    <div data-testid="main-workspace" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="ui-eyebrow text-[var(--ui-info)]">Main view</div>
          <h2 className="truncate text-xl font-semibold text-[var(--ui-text-primary)]">Focus workspace</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFocusPlannerOpen((open) => !open)}
            className="ui-control ui-focus-ring hidden min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold lg:flex"
          >
            <CalendarDays size={16} /> Plan day
          </button>
          <button
            type="button"
            aria-label="Open Kanban"
            onClick={() => setKanbanOpen(true)}
            className="ui-accent-button ui-focus-ring flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
          >
            <Columns3 size={16} /> Kanban
          </button>
          <button
            type="button"
            aria-label="Customize main view"
            aria-expanded={customizing}
            onClick={() => setCustomizing((open) => !open)}
            className="ui-icon-button ui-control"
          >
            <Settings2 size={17} />
          </button>
        </div>
      </div>

      {customizing && (
        <MainViewCustomizer modules={modules} onChange={setModules} onClose={() => setCustomizing(false)} />
      )}

      {focusPlannerOpen && (
        <FocusPlanningPanel
          tasks={tasks}
          settings={settings}
          now={now}
          onApply={(date, taskIds, startMinutes) => {
            applyFocusPlan(date, taskIds, startMinutes);
            setFocusPlannerOpen(false);
          }}
          onClose={() => setFocusPlannerOpen(false)}
        />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-3 lg:gap-4">
        <div
          className={`custom-scrollbar grid min-h-0 auto-rows-min gap-4 overflow-y-auto pr-1 ${
            visibleCenter.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {visibleCenter.length > 0 ? (
            visibleCenter.map(renderModule)
          ) : (
            <EmptyArea label="Middle" onCustomize={() => setCustomizing(true)} />
          )}
        </div>
        <aside
          aria-label="Main view utilities"
          className="custom-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1"
        >
          {visibleRight.length > 0 ? (
            visibleRight.map(renderModule)
          ) : (
            <EmptyArea label="Right rail" onCustomize={() => setCustomizing(true)} />
          )}
        </aside>
      </div>

      <Dialog.Root open={kanbanOpen} onOpenChange={setKanbanOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="themed-modal fixed inset-3 z-[81] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--ui-border-subtle)] bg-[var(--ui-surface)] p-3 shadow-2xl md:inset-6"
          >
            <div className="mb-3 flex shrink-0 items-center gap-3">
              <Dialog.Title className="text-lg font-semibold text-[var(--ui-text-primary)]">
                Kanban board
              </Dialog.Title>
              <form
                onSubmit={submitQuickAddTask}
                className="ui-control ml-auto hidden min-w-0 max-w-xl flex-1 items-center gap-2 rounded-xl px-2 py-1.5 sm:flex"
                aria-label="Quick add task"
              >
                <input
                  value={quickAddText}
                  onChange={(event) => setQuickAddText(event.target.value)}
                  placeholder="Quick add task"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={!quickAddText.trim()}
                  className="ui-accent-button rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Add
                </button>
              </form>
              <button
                type="button"
                onClick={() => openSettings('board')}
                className="ui-control ui-focus-ring hidden min-h-9 rounded-lg px-3 text-xs font-semibold sm:block"
              >
                Board settings
              </button>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close Kanban" className="ui-icon-button ui-control">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1">
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
                onMoveTask={moveTask}
                onReorderTask={reorderTask}
                setSelectedTaskId={setSelectedTaskId}
                keyboardFocusedTaskId={keyboardFocusedTaskId}
                now={now}
                startResize={startResize}
                onToggleLane={toggleBoardLane}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function MainFocusModule({
  area,
  settings,
  now,
  currentTask,
  onOpenTask,
  onAddTask,
  onToggleTimer,
  onCompleteTask,
  onEnterMonkMode,
  onUpdateDailyGoal,
  onPomodoroComplete
}: {
  area: MainViewArea;
  settings: ReturnType<typeof useSettingsContext>['settings'];
  now: number;
  currentTask: Task | null;
  onOpenTask: (taskId: string) => void;
  onAddTask: () => void;
  onToggleTimer: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onEnterMonkMode: () => void;
  onUpdateDailyGoal: (value: string) => void;
  onPomodoroComplete: (minutes: number) => void;
}) {
  return (
    <section data-testid="main-focus-module" data-area={area} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="ui-eyebrow text-[var(--ui-info)]">Monk mode</div>
          <h3 className="mt-1 text-lg font-semibold text-[var(--ui-text-primary)]">
            One task, full attention
          </h3>
        </div>
        <button
          type="button"
          onClick={onEnterMonkMode}
          className="ui-control ui-focus-ring flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
        >
          <Target size={16} /> Immerse
        </button>
      </div>
      <div className="ui-surface rounded-2xl border p-3 shadow-sm">
        <PomodoroTimer compact onComplete={onPomodoroComplete} />
        <label className="mt-3 block border-t border-[var(--ui-border-subtle)] pt-3">
          <span className="ui-eyebrow">One outcome for today</span>
          <input
            value={settings.dailyGoal || ''}
            onChange={(event) => onUpdateDailyGoal(event.target.value)}
            placeholder="One outcome for today"
            className="mt-2 w-full bg-transparent text-center text-base font-medium outline-none"
          />
        </label>
      </div>
      <CurrentTaskPin
        task={currentTask}
        now={now}
        onOpen={onOpenTask}
        onAdd={onAddTask}
        onToggleTimer={onToggleTimer}
        onComplete={onCompleteTask}
      />
    </section>
  );
}

function MainCalendarModule({
  area,
  tasks,
  now,
  onOpenCalendar,
  onOpenTask
}: {
  area: MainViewArea;
  tasks: Task[];
  now: number;
  onOpenCalendar: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const today = formatDateInputValue(new Date(now));
  const scheduled = tasks
    .filter(
      (task) =>
        task.scheduledDate === today &&
        activeTaskStatuses.includes(task.status) &&
        Boolean(task.scheduledStart)
    )
    .sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart))
    .slice(0, 5);
  return (
    <section
      data-testid="main-calendar-module"
      data-area={area}
      className="ui-surface rounded-2xl border p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="ui-eyebrow text-[var(--ui-info)]">Calendar</div>
          <h3 className="mt-1 text-sm font-semibold text-[var(--ui-text-primary)]">
            {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(
              now
            )}
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="ui-icon-button ui-control"
          aria-label="Open calendar view"
        >
          <CalendarDays size={16} />
        </button>
      </div>
      <div className="mt-3 space-y-1.5">
        {scheduled.length > 0 ? (
          scheduled.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask(task.id)}
              className="ui-control ui-focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
            >
              <span className="w-11 shrink-0 font-mono text-xs text-[var(--ui-info)]">
                {task.scheduledStart}
              </span>
              <span className="truncate text-sm font-medium">{task.title || 'Untitled task'}</span>
            </button>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--ui-border-subtle)] px-3 py-4 text-center text-xs text-[var(--ui-text-secondary)]">
            No scheduled focus blocks today.
          </p>
        )}
      </div>
    </section>
  );
}

function MainMediaModule({ area, url, onOpen }: { area: MainViewArea; url: string; onOpen: () => void }) {
  let source = 'Saved focus source';
  try {
    source = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // Keep the friendly fallback for legacy values.
  }
  return (
    <section
      data-testid="main-media-module"
      data-area={area}
      className="ui-surface flex items-center gap-3 rounded-2xl border p-4 shadow-sm"
    >
      <div className="ui-accent-button grid size-10 shrink-0 place-items-center rounded-xl">
        <Music2 size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">Focus media</h3>
        <p className="truncate text-xs text-[var(--ui-text-secondary)]">{source}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="ui-control ui-focus-ring min-h-9 rounded-lg px-3 text-xs font-semibold"
      >
        Open
      </button>
    </section>
  );
}

function MainViewCustomizer({
  modules,
  onChange,
  onClose
}: {
  modules: MainViewModule[];
  onChange: (modules: MainViewModule[]) => void;
  onClose: () => void;
}) {
  return (
    <section
      data-testid="main-view-customizer"
      aria-label="Customize main view"
      className="ui-surface custom-scrollbar mb-3 max-h-56 shrink-0 overflow-y-auto rounded-2xl border p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Main modules</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(defaultMainViewModules.map((module) => ({ ...module })))}
            aria-label="Reset main view"
            className="ui-icon-button ui-control"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close main view customizer"
            className="ui-icon-button"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {modules.map((module) => {
          const definition = mainViewModuleDefinitions.find((candidate) => candidate.id === module.id)!;
          return (
            <div key={module.id} className="ui-control flex min-w-0 items-center gap-2 rounded-xl p-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={module.visible}
                  onChange={(event) =>
                    onChange(updateMainViewModule(modules, module.id, { visible: event.target.checked }))
                  }
                  aria-label={`Show ${definition.label}`}
                  className="accent-indigo-600"
                />
                <span className="truncate">{definition.label}</span>
              </label>
              <select
                aria-label={`${definition.label} placement`}
                value={module.area}
                onChange={(event) =>
                  onChange(
                    updateMainViewModule(modules, module.id, {
                      area: event.target.value as MainViewArea
                    })
                  )
                }
                className="rounded-lg border border-[var(--ui-border-subtle)] bg-transparent px-2 py-1 text-xs"
              >
                <option value="center">Middle</option>
                <option value="right">Right</option>
              </select>
              <button
                type="button"
                aria-label={`Move ${definition.label} up`}
                onClick={() => onChange(moveMainViewModule(modules, module.id, 'up'))}
                className="ui-icon-button size-8"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label={`Move ${definition.label} down`}
                onClick={() => onChange(moveMainViewModule(modules, module.id, 'down'))}
                className="ui-icon-button size-8"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyArea({ label, onCustomize }: { label: string; onCustomize: () => void }) {
  return (
    <button
      type="button"
      onClick={onCustomize}
      className="ui-surface ui-focus-ring flex min-h-28 w-full items-center justify-center rounded-2xl border border-dashed text-sm text-[var(--ui-text-secondary)]"
    >
      Add a module to {label}
    </button>
  );
}
