import { X } from 'lucide-react';
import { AgendaTimeline } from '../timeline/AgendaTimeline';
import { CurrentTaskPin } from '../CurrentTaskPin';
import { ClockWidget } from '../ClockWidget';

export function WorkspaceSidebar({
  settings,
  tasks,
  setTasks,
  currentTask,
  now,
  sidebarOpen,
  setSidebarOpen,
  isSidebarVisible,
  setSelectedTaskId,
  addTask,
  updateTaskTimer,
  completeTask,
  openSettings,
  startResize,
  agendaContainerRef,
  agendaScrollTopRef,
  timelineDragRef,
  suppressTimelineClickRef
}) {
  return (
    <>
      {settings.resizeHandleVisible !== false && (
        <div
          data-testid="main-sidebar-resizer"
          className={`resize-handle resize-handle-vertical hidden w-1 shrink-0 cursor-col-resize items-center justify-center rounded hover:bg-indigo-500/10 md:flex ${isSidebarVisible ? '' : 'md:hidden'}`}
          onMouseDown={() => startResize('main-sidebar')}
          title="Resize sidebar"
        >
          <div className="resize-grip resize-grip-vertical h-12 w-px rounded-full bg-slate-300 transition-colors dark:bg-slate-700" />
        </div>
      )}
      <aside
        data-testid="app-sidebar"
        data-material="sidebar"
        className={`absolute right-0 top-0 z-40 flex h-full shrink-0 flex-col overflow-hidden rounded-l-2xl border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 md:relative md:rounded-xl md:shadow-none ${sidebarOpen && isSidebarVisible ? 'translate-x-0' : 'translate-x-full'} ${isSidebarVisible ? 'md:translate-x-0' : 'md:hidden'}`}
        style={{ width: `${settings.sidebarWidth || 320}px` }}
      >
        <div className="flex shrink-0 justify-end border-b border-slate-100 p-2 dark:border-slate-800 md:hidden">
          <button
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
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
                className="resize-handle resize-handle-horizontal flex h-2 w-full shrink-0 cursor-row-resize items-center justify-center rounded hover:bg-indigo-500/10"
                onMouseDown={() => startResize('sidebar-clock')}
                title="Resize clock and timeline"
              >
                <div className="resize-grip resize-grip-horizontal h-px w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
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
      </aside>
    </>
  );
}
