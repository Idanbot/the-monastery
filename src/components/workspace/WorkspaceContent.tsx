import { lazy, Suspense, useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanBoard, MobileFocusView, TaskListView } from '../board/TaskBoard';
import { MobileBoardControls } from '../board/MobileBoardControls';
import { MobileLaneBoard } from '../board/MobileLaneBoard';
import { MonkModeView } from '../monk-mode/MonkModeView';
import { TaskSearchInput } from '../TaskSearchInput';
import { CalendarView } from '../calendar/CalendarView';
import { FocusPlanningPanel } from '../planning/FocusPlanningPanel';
import { MainWorkspace } from './MainWorkspace';

import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useProfileContext } from '../../contexts/ProfileContext';
import { useUIContext } from '../../contexts/UIContext';
import { sendBrowserNotification } from '../../domain/notifications';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const ProjectsView = lazy(() =>
  import('../projects/ProjectsView').then((module) => ({ default: module.ProjectsView }))
);

const AnalyticsView = lazy(() =>
  import('../dashboard/AnalyticsView').then((module) => ({ default: module.AnalyticsView }))
);

export function WorkspaceContent() {
  const { settings, setSettings, toggleBoardLane, startResize, openSettings } = useSettingsContext();
  const {
    tasks,
    filteredTasks,
    currentTask,
    addTask,
    applyFocusPlan,
    recordFocusSession,
    updateTaskTimer,
    startTask,
    completeTask,
    rejectTask,
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
    reorderTask,
    setSelectedTaskId,
    searchQuery,
    setSearchQuery
  } = useTaskContext();

  const { activeProfile } = useProfileContext();

  const {
    view,
    now,
    isEnteringMonkMode,
    setIsEnteringMonkMode,
    mantra,
    setMonkMode,
    quickAddText,
    setQuickAddText,
    submitQuickAddTask,
    keyboardFocusedTaskId,
    unifiedSearchResults,
    unifiedSearchLoading,
    selectUnifiedSearchResult
  } = useUIContext();
  const [focusPlannerOpen, setFocusPlannerOpen] = useState(false);
  const isPhoneLayout = useMediaQuery('(max-width: 639px)');
  const isDesktopLayout = useMediaQuery('(min-width: 768px)');
  const showBoardWorkspace = view === 'board' || (view === 'main' && !isDesktopLayout);

  return (
    <div data-testid="workspace-content" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      {!settings.monkMode &&
        view !== 'dashboard' &&
        view !== 'calendar' &&
        view !== 'projects' &&
        view !== 'main' &&
        view !== 'board' && (
          <TaskSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            variant="inline"
            results={unifiedSearchResults}
            loading={unifiedSearchLoading}
            onSelectResult={selectUnifiedSearchResult}
          />
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
          onPomodoroComplete={(minutes) => {
            if (settings.notificationsEnabled) {
              sendBrowserNotification('Pomodoro complete', {
                body: 'Focus session complete. Time for a short break.',
                tag: 'pomodoro-complete'
              });
            }
            if (!currentTask) return;
            recordFocusSession(currentTask.id, minutes);
          }}
        />
      )}

      {!settings.monkMode && view === 'dashboard' && (
        <Suspense
          fallback={
            <div className="ui-surface flex flex-1 items-center justify-center rounded-2xl border text-sm text-[var(--ui-text-secondary)]">
              Loading analytics…
            </div>
          }
        >
          <AnalyticsView
            tasks={tasks}
            settings={settings}
            now={now}
            activeProfile={activeProfile ?? null}
            currentTask={currentTask}
            openRoleSettings={() => openSettings('roles')}
          />
        </Suspense>
      )}

      {!settings.monkMode && view === 'projects' && (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Loading projects...
            </div>
          }
        >
          <ProjectsView
            projects={settings.projects || []}
            tasks={tasks}
            now={now}
            onOpenTask={setSelectedTaskId}
            onOpenSettings={() => openSettings('projects')}
          />
        </Suspense>
      )}

      {!settings.monkMode && view === 'mobile' && (
        <div className="min-h-0 flex-1">
          <TaskListView
            filteredTasks={filteredTasks}
            setSelectedTaskId={setSelectedTaskId}
            now={now}
            onStartTask={startTask}
            onCompleteTask={completeTask}
            onRejectTask={rejectTask}
          />
        </div>
      )}

      {!settings.monkMode && view === 'calendar' && <CalendarView />}

      {!settings.monkMode && view === 'main' && isDesktopLayout && <MainWorkspace />}

      {!settings.monkMode && showBoardWorkspace && (
        <>
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <form
              onSubmit={submitQuickAddTask}
              className="ui-toolbar hidden min-w-0 flex-1 items-center gap-2 rounded-xl border px-2 py-1.5 sm:flex"
              aria-label="Quick add task"
            >
              <Plus size={15} className="shrink-0 text-[var(--ui-info)]" />
              <input
                value={quickAddText}
                onChange={(event) => setQuickAddText(event.target.value)}
                placeholder="Quick add: GKE migration tomorrow 9-10 #cloud !7"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text-primary)] outline-none placeholder:text-[var(--ui-text-secondary)]"
              />
              <button
                type="submit"
                className="ui-accent-button ui-focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!quickAddText.trim()}
              >
                Add
              </button>
            </form>
            <div className="hidden justify-end gap-2 sm:flex">
              <button
                onClick={() => setFocusPlannerOpen((open) => !open)}
                className="ui-control ui-focus-ring rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ui-success)]"
              >
                Plan day
              </button>
              <button
                onClick={() => openSettings('board')}
                className="ui-control ui-focus-ring rounded-xl px-3 py-2 text-sm font-semibold"
              >
                Board settings
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
          <MobileBoardControls
            settings={settings}
            setSettings={setSettings}
            taskCount={
              filteredTasks.filter((task) => task.status === 'backlog' || task.status === 'in-progress')
                .length
            }
          />
          {!settings.mobileFocusMode && (
            <TaskSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              variant="inline"
              results={unifiedSearchResults}
              loading={unifiedSearchLoading}
              onSelectResult={selectUnifiedSearchResult}
            />
          )}
          {settings.mobileFocusMode && (
            <MobileFocusView
              filteredTasks={filteredTasks}
              currentTask={currentTask}
              setSelectedTaskId={setSelectedTaskId}
              now={now}
              onStartTask={updateTaskTimer}
              onCompleteTask={completeTask}
              onRejectTask={rejectTask}
              onNextTask={startTask}
            />
          )}
          <div className={`min-h-0 flex-1 ${settings.mobileFocusMode ? 'hidden sm:flex' : 'flex'}`}>
            {isPhoneLayout ? (
              <MobileLaneBoard
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
                onToggleLane={toggleBoardLane}
              />
            ) : (
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
            )}
          </div>
          <div id="board-focus-media-host" className="mt-2 w-full shrink-0 empty:hidden" />
        </>
      )}
    </div>
  );
}
