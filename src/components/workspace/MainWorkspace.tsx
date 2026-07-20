import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, Columns3, Maximize2, Minimize2, Music2, Settings2, Target, X } from 'lucide-react';
import { ActivityGraph } from '../dashboard/ActivityGraph';
import { ClockWidget } from '../ClockWidget';
import { CurrentTaskPin } from '../CurrentTaskPin';
import { PomodoroTimer } from '../monk-mode/PomodoroTimer';
import { KanbanBoard } from '../board/TaskBoard';
import { FocusPlanningPanel } from '../planning/FocusPlanningPanel';
import { AgendaTimeline } from '../timeline/AgendaTimeline';
import { ThemedPortalSurface } from '../ui/ThemedPortalSurface';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import {
  mainViewSlotContentDefinitions,
  mainViewSlotDefinitions,
  normalizeMainViewSlots
} from '../../domain/mainView';
import { activeTaskStatuses, formatDateInputValue } from '../../domain/tasks';
import { sendBrowserNotification } from '../../domain/notifications';
import type { MainViewSlotContentId, MainViewSlotId, Task } from '../../domain/types';

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
    isMediaPlayerActive,
    isMediaPlayerExpanded,
    openMediaPlayer,
    quickAddText,
    setQuickAddText,
    submitQuickAddTask,
    keyboardFocusedTaskId
  } = useUIContext();
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [focusPlannerOpen, setFocusPlannerOpen] = useState(false);
  const slots = useMemo(
    () => normalizeMainViewSlots(settings.mainViewSlots, settings.mainViewModules),
    [settings.mainViewModules, settings.mainViewSlots]
  );
  const collapsedSlots = settings.collapsedMainViewSlots || [];
  const columnSplit = settings.mainViewColumnSplit || 50;
  const rowSplit = settings.mainViewRowSplit || 50;
  const mediaSlot = mainViewSlotDefinitions.find(({ id }) =>
    ['media', 'calendar-media', 'clock-media-timeline'].includes(slots[id])
  )?.id;
  const toggleSlot = (slot: MainViewSlotId) => {
    setSettings((previous) => {
      const collapsed = previous.collapsedMainViewSlots || [];
      return {
        ...previous,
        collapsedMainViewSlots: collapsed.includes(slot)
          ? collapsed.filter((candidate) => candidate !== slot)
          : [...collapsed, slot]
      };
    });
  };
  const resizeWithKeyboard = (axis: 'columns' | 'rows', delta: number) => {
    setSettings((previous) => {
      const key = axis === 'columns' ? 'mainViewColumnSplit' : 'mainViewRowSplit';
      return { ...previous, [key]: Math.min(80, Math.max(20, (previous[key] || 50) + delta)) };
    });
  };

  const renderModule = (content: MainViewSlotContentId, slot: MainViewSlotId) => {
    if (content === 'calendar-media') {
      return (
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
          {renderModule('calendar', slot)}
          {renderModule('media', slot)}
        </div>
      );
    }
    if (content === 'clock-timeline') {
      return (
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          {renderModule('clock', slot)}
          {renderModule('timeline', slot)}
        </div>
      );
    }
    if (content === 'clock-media-timeline') {
      return (
        <div className="grid h-full min-h-0 grid-rows-[minmax(5rem,0.8fr)_auto_minmax(7rem,1fr)] gap-3">
          {renderModule('clock', slot)}
          {renderModule('media', slot)}
          {renderModule('timeline', slot)}
        </div>
      );
    }
    if (content === 'focus' || content === 'focus-current') {
      return (
        <MainFocusModule
          slot={slot}
          showCurrent={content === 'focus-current'}
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
    if (content === 'activity-current') {
      return (
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(7rem,1fr)] gap-3">
          {renderModule('activity', slot)}
          <div className="custom-scrollbar min-h-0 overflow-y-auto">
            <CurrentTaskPin
              task={currentTask}
              now={now}
              onOpen={setSelectedTaskId}
              onAdd={() => addTask('backlog')}
              onToggleTimer={updateTaskTimer}
              onComplete={completeTask}
            />
          </div>
        </div>
      );
    }
    if (content === 'activity') {
      return (
        <div data-testid="main-activity-module" data-slot={slot} className="h-full min-h-0">
          <ActivityGraph
            tasks={tasks}
            now={now}
            compact
            fill
            petId={settings.activityPetId}
            showPet={settings.activityPetVisible}
            animateFlame={settings.activityFlameAnimationEnabled && settings.animationsEnabled}
            animatePet={settings.animationsEnabled}
          />
        </div>
      );
    }
    if (content === 'calendar') {
      return (
        <MainCalendarModule
          slot={slot}
          tasks={tasks}
          now={now}
          onOpenCalendar={() => setView('calendar')}
          onOpenTask={setSelectedTaskId}
        />
      );
    }
    if (content === 'media') {
      return (
        <MainMediaModule
          slot={slot}
          url={settings.focusMediaUrl}
          active={isMediaPlayerActive}
          expanded={isMediaPlayerExpanded}
          isDockHost={slot === mediaSlot}
          onOpen={openMediaPlayer}
        />
      );
    }
    if (content === 'timeline') {
      return (
        <div data-testid="main-timeline-module" data-slot={slot} className="h-full min-h-0">
          <AgendaTimeline />
        </div>
      );
    }
    return (
      <div data-testid="main-clock-module" data-slot={slot} className="h-full min-h-0">
        <ClockWidget settings={settings} now={now} onOpenSettings={openSettings} fill />
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
            onClick={() => openSettings('main')}
            className="ui-icon-button ui-control"
          >
            <Settings2 size={17} />
          </button>
        </div>
      </div>

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

      <div
        data-testid="main-view-grid"
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateColumns: `minmax(0, ${columnSplit}fr) 0.75rem minmax(0, ${100 - columnSplit}fr)`,
          gridTemplateRows: `minmax(0, ${rowSplit}fr) 0.75rem minmax(0, ${100 - rowSplit}fr)`
        }}
      >
        {mainViewSlotDefinitions.map(({ id, label }) => {
          const collapsed = collapsedSlots.includes(id);
          const moduleLabel = mainViewSlotContentDefinitions.find(
            ({ id: content }) => content === slots[id]
          )?.label;
          const position = {
            topLeft: { gridColumn: 1, gridRow: 1 },
            topRight: { gridColumn: 3, gridRow: 1 },
            bottomLeft: { gridColumn: 1, gridRow: 3 },
            bottomRight: { gridColumn: 3, gridRow: 3 }
          }[id];
          return (
            <div
              key={id}
              data-testid={`main-view-slot-${id}`}
              data-slot={id}
              data-module={slots[id]}
              data-collapsed={collapsed ? 'true' : 'false'}
              className="group relative min-h-0 min-w-0 overflow-hidden"
              style={position}
            >
              {collapsed ? (
                <div className="ui-surface flex min-h-11 items-center gap-2 rounded-xl border px-3 shadow-sm">
                  <span className="truncate text-sm font-semibold text-[var(--ui-text-primary)]">
                    {moduleLabel}
                  </span>
                  <button
                    type="button"
                    aria-label={`Expand ${label}`}
                    onClick={() => toggleSlot(id)}
                    className="ui-icon-button ui-control ml-auto size-8"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label={`Collapse ${label}`}
                    onClick={() => toggleSlot(id)}
                    className="ui-icon-button ui-icon-button-sm ui-control absolute left-1 top-1 z-20 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Minimize2 size={7} />
                  </button>
                  {renderModule(slots[id], id)}
                </>
              )}
            </div>
          );
        })}
        {settings.resizeHandleVisible !== false && (
          <>
            <div
              role="separator"
              aria-label="Resize main view columns"
              aria-orientation="vertical"
              aria-valuemin={20}
              aria-valuemax={80}
              aria-valuenow={Math.round(columnSplit)}
              tabIndex={0}
              className="resize-handle resize-handle-vertical group flex cursor-col-resize items-center justify-center justify-self-center rounded"
              style={{ gridColumn: 2, gridRow: '1 / 4' }}
              onMouseDown={(event) => {
                event.preventDefault();
                startResize('main-view-columns');
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') resizeWithKeyboard('columns', -2);
                if (event.key === 'ArrowRight') resizeWithKeyboard('columns', 2);
              }}
            >
              <div className="resize-grip resize-grip-vertical rounded-full" />
            </div>
            <div
              role="separator"
              aria-label="Resize main view rows"
              aria-orientation="horizontal"
              aria-valuemin={20}
              aria-valuemax={80}
              aria-valuenow={Math.round(rowSplit)}
              tabIndex={0}
              className="resize-handle resize-handle-horizontal group flex cursor-row-resize items-center justify-center self-center rounded"
              style={{ gridColumn: '1 / 4', gridRow: 2 }}
              onMouseDown={(event) => {
                event.preventDefault();
                startResize('main-view-rows');
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') resizeWithKeyboard('rows', -2);
                if (event.key === 'ArrowDown') resizeWithKeyboard('rows', 2);
              }}
            >
              <div className="resize-grip resize-grip-horizontal rounded-full" />
            </div>
          </>
        )}
      </div>

      <Dialog.Root open={kanbanOpen} onOpenChange={setKanbanOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <ThemedPortalSurface variant="overlay" className="fixed inset-0 z-[80]" />
          </Dialog.Overlay>
          <Dialog.Content asChild aria-describedby={undefined}>
            <ThemedPortalSurface
              variant="modal"
              className="fixed inset-3 z-[81] flex min-h-0 flex-col overflow-hidden rounded-2xl border p-3 shadow-2xl md:inset-6"
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
            </ThemedPortalSurface>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function MainFocusModule({
  slot,
  showCurrent,
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
  slot: MainViewSlotId;
  showCurrent: boolean;
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
    <section
      data-testid="main-focus-module"
      data-slot={slot}
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
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
      <div className={`mt-3 grid min-h-0 flex-1 gap-3 ${showCurrent ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="ui-surface custom-scrollbar min-h-0 overflow-y-auto rounded-2xl border p-3 shadow-sm">
          <PomodoroTimer compact onComplete={onPomodoroComplete} />
          <label className="mt-2 flex items-center gap-2 border-t border-[var(--ui-border-subtle)] pt-2">
            <span className="ui-eyebrow shrink-0">Goal</span>
            <input
              value={settings.dailyGoal || ''}
              onChange={(event) => onUpdateDailyGoal(event.target.value)}
              placeholder="One outcome for today"
              aria-label="One outcome for today"
              className="min-w-0 flex-1 bg-transparent text-right text-xs font-medium outline-none"
            />
          </label>
        </div>
        {showCurrent && (
          <div className="custom-scrollbar min-h-0 overflow-y-auto">
            <CurrentTaskPin
              task={currentTask}
              now={now}
              onOpen={onOpenTask}
              onAdd={onAddTask}
              onToggleTimer={onToggleTimer}
              onComplete={onCompleteTask}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function MainCalendarModule({
  slot,
  tasks,
  now,
  onOpenCalendar,
  onOpenTask
}: {
  slot: MainViewSlotId;
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
      data-slot={slot}
      className="ui-surface custom-scrollbar h-full min-h-0 overflow-y-auto rounded-2xl border p-4 shadow-sm"
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

function MainMediaModule({
  slot,
  url,
  active,
  expanded,
  isDockHost,
  onOpen
}: {
  slot: MainViewSlotId;
  url: string;
  active: boolean;
  expanded: boolean;
  isDockHost: boolean;
  onOpen: () => void;
}) {
  if (isDockHost && active && !expanded) {
    return (
      <div
        id="main-focus-media-host"
        data-testid="main-media-dock-host"
        data-slot={slot}
        className="flex h-full min-h-0 items-center"
      />
    );
  }
  let source = 'Saved focus source';
  try {
    source = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // Keep the friendly fallback for legacy values.
  }
  return (
    <section
      data-testid="main-media-module"
      data-slot={slot}
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
