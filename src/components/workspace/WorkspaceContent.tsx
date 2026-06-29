import {
  lazy,
  Suspense,
  type Dispatch,
  type DragEvent,
  type FormEventHandler,
  type SetStateAction
} from 'react';
import { Plus } from 'lucide-react';
import type { AppSettings, Profile, Task, TaskStatus } from '../../domain/types';
import { KanbanBoard, MobileFocusView, TaskListView } from '../board/TaskBoard';
import { MobileBoardControls } from '../board/MobileBoardControls';
import { MonkModeView } from '../monk-mode/MonkModeView';
import { TaskSearchInput } from '../TaskSearchInput';

const AnalyticsView = lazy(() =>
  import('../dashboard/AnalyticsView').then((module) => ({ default: module.AnalyticsView }))
);

type DragOverInfo = {
  status: TaskStatus;
  id: string | null;
  position: 'top' | 'bottom';
} | null;

type WorkspaceContentProps = {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  view: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  tasks: Task[];
  filteredTasks: Task[];
  currentTask: Task | null;
  activeProfile?: Profile | null;
  now: number;
  isEnteringMonkMode: boolean;
  setIsEnteringMonkMode: (value: boolean) => void;
  mantra: string;
  setMonkMode: (enabled: boolean) => void;
  addTask: (status: TaskStatus) => void;
  handlePomodoroComplete: (minutes: number) => void;
  openSettings: (section?: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  quickAddText: string;
  setQuickAddText: (value: string) => void;
  submitQuickAddTask: FormEventHandler<HTMLFormElement>;
  planMyDay: () => void;
  updateTaskTimer: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  columnSorts: Record<TaskStatus, 'none' | 'urgency' | 'time'>;
  cycleSort: (status: TaskStatus) => void;
  draggedTaskId: string | null;
  dragOverInfo: DragOverInfo;
  setDraggedTaskId: (id: string | null) => void;
  setDragOverInfo: (info: DragOverInfo) => void;
  handleDragOver: (event: DragEvent<HTMLElement>, status: TaskStatus, targetTaskId?: string | null) => void;
  handleDrop: (event: DragEvent<HTMLElement>, status: TaskStatus) => void;
  handleDragStart: (event: DragEvent<HTMLElement>, taskId: string) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  reorderTask: (taskId: string, direction: 'earlier' | 'later') => void;
  keyboardFocusedTaskId: string | null;
  startResize: (id: string) => void;
  toggleBoardLane: (status: TaskStatus) => void;
};

export function WorkspaceContent({
  settings,
  setSettings,
  view,
  searchQuery,
  setSearchQuery,
  tasks,
  filteredTasks,
  currentTask,
  activeProfile,
  now,
  isEnteringMonkMode,
  setIsEnteringMonkMode,
  mantra,
  setMonkMode,
  addTask,
  handlePomodoroComplete,
  openSettings,
  setSelectedTaskId,
  quickAddText,
  setQuickAddText,
  submitQuickAddTask,
  planMyDay,
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
  keyboardFocusedTaskId,
  startResize,
  toggleBoardLane
}: WorkspaceContentProps) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
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
            openRoleSettings={() => openSettings('roles')}
          />
        </Suspense>
      )}

      {!settings.monkMode && view === 'mobile' && (
        <div className="min-h-0 flex-1">
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
