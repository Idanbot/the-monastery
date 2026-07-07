import { lazy, Suspense, useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanBoard, MobileFocusView, TaskListView } from '../board/TaskBoard';
import { MobileBoardControls } from '../board/MobileBoardControls';
import { MonkModeView } from '../monk-mode/MonkModeView';
import { TaskSearchInput } from '../TaskSearchInput';
import { CalendarView } from '../calendar/CalendarView';
import { FocusPlanningPanel } from '../planning/FocusPlanningPanel';

import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useProfileContext } from '../../contexts/ProfileContext';
import { useUIContext } from '../../contexts/UIContext';
import { sendBrowserNotification } from '../../domain/notifications';

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
    setTasks,
    filteredTasks,
    currentTask,
    addTask,
    applyFocusPlan,
    updateTaskTimer,
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

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      {!settings.monkMode && view !== 'dashboard' && view !== 'calendar' && view !== 'projects' && (
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
            setTasks((prev) =>
              prev.map((task) =>
                task.id === currentTask.id
                  ? {
                      ...task,
                      logs: [
                        ...task.logs,
                        {
                          start: new Date(Date.now() - minutes * 60_000).toISOString(),
                          end: new Date().toISOString()
                        }
                      ]
                    }
                  : task
              )
            );
          }}
        />
      )}

      {!settings.monkMode && view === 'dashboard' && (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
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
            openRoleSettings={() => {}}
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
          <TaskListView filteredTasks={filteredTasks} setSelectedTaskId={setSelectedTaskId} now={now} />
        </div>
      )}

      {!settings.monkMode && view === 'calendar' && <CalendarView />}

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
                onClick={() => setFocusPlannerOpen((open) => !open)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:border-emerald-400 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
              >
                Plan day
              </button>
              <button
                onClick={() => openSettings('board')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
              onMoveTask={moveTask}
              onReorderTask={reorderTask}
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
  );
}
