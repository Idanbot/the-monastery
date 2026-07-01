import {
  ArrowDownUp,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  GripHorizontal,
  Play
} from 'lucide-react';
import { UrgencyBadge } from '../UrgencyBadge';
import { formatLiveTimer, getEffectiveTags, statusLabels, taskStatuses } from '../../domain/tasks';
import { statusColorClass } from './boardStyles';

export function TaskColumn({
  status,
  filteredTasks,
  settings,
  columnSorts,
  cycleSort,
  draggedTaskId,
  dragOverInfo,
  setDraggedTaskId,
  setDragOverInfo,
  handleDragOver,
  handleDrop,
  handleDragStart,
  setSelectedTaskId,
  keyboardFocusedTaskId,
  now,
  onToggleLane,
  onMoveTask,
  onReorderTask,
  announceMove
}) {
  const filtered = filteredTasks.filter((task) => task.status === status);
  const sortType = columnSorts[status] || 'none';
  const collapsed = settings.collapsedBoardLanes?.includes(status) || false;

  if (sortType === 'urgency') {
    filtered.sort((a, b) => b.urgency - a.urgency);
  } else if (sortType === 'time') {
    filtered.sort((a, b) => {
      if (!a.scheduledStart) return 1;
      if (!b.scheduledStart) return -1;
      return a.scheduledStart.localeCompare(b.scheduledStart);
    });
  }

  return (
    <div
      data-testid={`board-column-${status}`}
      data-collapsed={collapsed ? 'true' : 'false'}
      className={`flex ${collapsed ? 'h-auto min-h-0 self-start' : 'h-full min-h-[14rem] sm:min-h-0'} flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-200/50 dark:border-slate-800/60 dark:bg-slate-800/40`}
      onDragOver={(e) => handleDragOver(e, status)}
      onDrop={(e) => handleDrop(e, status)}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/50 px-3 py-2 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <div className={`h-2 w-2 shrink-0 rounded-full ${statusColorClass(status)}`}></div>
            <span className="truncate">{statusLabels[status]}</span>
          </h2>
          <button
            onClick={() => cycleSort(status)}
            className={`rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 ${collapsed ? 'hidden' : ''}`}
            title={`Sort: ${sortType}`}
          >
            {sortType === 'urgency' && <Flame size={12} className="text-orange-500" />}
            {sortType === 'time' && <Clock size={12} className="text-blue-500" />}
            {sortType === 'none' && <ArrowDownUp size={12} />}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300 ${collapsed ? 'hidden' : ''}`}
          >
            {filtered.length}
          </span>
          <button
            type="button"
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${statusLabels[status]} lane`}
            aria-expanded={!collapsed}
            title={`${collapsed ? 'Expand' : 'Collapse'} ${statusLabels[status]} lane`}
            onClick={() => onToggleLane(status)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-700 ${collapsed ? 'bg-slate-200/70 dark:bg-slate-700/70' : ''}`}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="custom-scrollbar relative flex-1 space-y-2 overflow-y-auto p-2">
          {filtered.map((task) => {
            const isActive = task.activeLogStart || task.subtasks.some((subtask) => subtask.activeLogStart);
            const isDragOverTop = dragOverInfo?.id === task.id && dragOverInfo?.position === 'top';
            const isDragOverBottom = dragOverInfo?.id === task.id && dragOverInfo?.position === 'bottom';
            const isDragging = draggedTaskId === task.id;
            const isKeyboardFocused = keyboardFocusedTaskId === task.id;
            const taskTags = getEffectiveTags(task);
            const statusIndex = taskStatuses.indexOf(task.status);
            const moveWithKeyboard = (event) => {
              if (!event.altKey) return;
              const horizontalOffset = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
              if (horizontalOffset) {
                const nextStatus = taskStatuses[statusIndex + horizontalOffset];
                if (!nextStatus) return;
                event.preventDefault();
                announceMove(task, nextStatus);
                onMoveTask(task.id, nextStatus);
                return;
              }
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                const direction = event.key === 'ArrowUp' ? 'earlier' : 'later';
                onReorderTask(task.id, direction);
                announceMove(task, task.status, direction);
              }
            };

            return (
              <div key={task.id} onDragOver={(e) => handleDragOver(e, status, task.id)} className="relative">
                {isDragOverTop && (
                  <div className="relative z-10 mx-1 mb-2 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                )}

                <div
                  draggable
                  role="group"
                  tabIndex={0}
                  aria-label={`${task.title || 'Task'}, ${statusLabels[task.status]}. Use Alt plus arrow keys to move.`}
                  aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown Enter"
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverInfo(null);
                  }}
                  onClick={() => setSelectedTaskId(task.id)}
                  onKeyDown={(event) => {
                    moveWithKeyboard(event);
                    if (event.key === 'Enter' && event.target === event.currentTarget) {
                      setSelectedTaskId(task.id);
                    }
                  }}
                  className={`group cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-all dark:bg-slate-900 ${settings.collapseTasks ? 'p-2' : 'p-3'} ${isDragging ? 'opacity-50 grayscale' : ''} ${isKeyboardFocused ? 'border-amber-300 ring-2 ring-amber-400' : ''}
                  ${isActive ? 'border-indigo-400 ring-1 ring-indigo-400/30' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700/80 dark:hover:border-indigo-600'}
                `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 h-0.5 w-full animate-pulse bg-indigo-500"></div>
                  )}

                  <div
                    className={`flex items-start justify-between ${settings.collapseTasks ? 'mb-0' : 'mb-1.5'}`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5 pr-2">
                      <GripHorizontal
                        size={14}
                        className="shrink-0 cursor-grab text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600"
                      />
                      <h3
                        className={`truncate text-sm font-semibold leading-tight ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}
                      >
                        {task.title || 'Untitled Task'}
                      </h3>
                    </div>
                    <div
                      className="flex shrink-0 items-center gap-0.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Move ${task.title || 'task'} earlier`}
                        title="Move earlier (Alt+Up)"
                        onClick={() => {
                          onReorderTask(task.id, 'earlier');
                          announceMove(task, task.status, 'earlier');
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 sm:h-7 sm:w-7"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${task.title || 'task'} later`}
                        title="Move later (Alt+Down)"
                        onClick={() => {
                          onReorderTask(task.id, 'later');
                          announceMove(task, task.status, 'later');
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 sm:h-7 sm:w-7"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <select
                        aria-label={`Move ${task.title || 'task'} to lane`}
                        title="Move to lane (Alt+Left/Right)"
                        value={task.status}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          announceMove(task, nextStatus);
                          onMoveTask(task.id, nextStatus);
                        }}
                        className="h-10 max-w-10 cursor-pointer rounded border-0 bg-transparent text-xs text-slate-400 focus:max-w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 sm:h-7 sm:max-w-7"
                      >
                        {taskStatuses.map((laneStatus) => (
                          <option key={laneStatus} value={laneStatus}>
                            {statusLabels[laneStatus]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!settings.collapseTasks && isActive && (
                    <div className="mb-2 mt-2 flex items-center justify-between rounded border border-indigo-100 bg-indigo-50 p-1.5 text-indigo-700 shadow-inner dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <Play size={10} className="animate-pulse" fill="currentColor" /> Active
                      </div>
                      <div className="font-mono text-sm font-bold tracking-tight drop-shadow-sm">
                        {task.activeLogStart ? formatLiveTimer(task.activeLogStart, now) : 'Live Subtask'}
                      </div>
                    </div>
                  )}

                  {!settings.collapseTasks && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <UrgencyBadge urgency={task.urgency} />
                      {task.scheduledStart && (
                        <div className="rounded bg-slate-100 px-1.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {task.scheduledStart}
                        </div>
                      )}
                      {task.subtasks?.length > 0 && (
                        <div className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <CheckSquare size={10} />{' '}
                          {task.subtasks.filter((subtask) => subtask.status === 'done').length}/
                          {task.subtasks.length}
                        </div>
                      )}
                    </div>
                  )}

                  {!settings.collapseTasks && taskTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {taskTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="max-w-[60px] truncate rounded bg-slate-100 px-1 text-[9px] text-slate-500 dark:bg-slate-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {taskTags.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{taskTags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {isDragOverBottom && (
                  <div className="relative z-10 mx-1 mt-2 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && !dragOverInfo && (
            <div className="mx-2 flex h-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs italic text-slate-400 opacity-50 dark:border-slate-700">
              No tasks found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
