import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Repeat } from 'lucide-react';
import { UrgencyBadge } from '../UrgencyBadge';
import { cssVars } from '../../lib/cssVars';
import {
  calculateTotalDuration,
  formatDate,
  formatDurationString,
  formatLiveTimer,
  getEffectiveTags,
  statusLabels,
  taskStatuses
} from '../../domain/tasks';
import { TaskColumn } from './TaskColumn';
import { statusColorClass } from './boardStyles';

const widthKey = (status) => (status === 'in-progress' ? 'inProgress' : status);

const normalizeOrder = (value, fallback) => {
  const source = Array.isArray(value) ? value : [];
  return [...new Set([...source.filter((status) => taskStatuses.includes(status)), ...fallback])];
};

const boardOrder = (settings) => ({
  compactActive: normalizeOrder(settings.boardColumnOrder?.compactActive, ['backlog', 'in-progress']).filter(
    (status) => status === 'backlog' || status === 'in-progress'
  ),
  compactDone: normalizeOrder(settings.boardColumnOrder?.compactDone, ['done', 'rejected']).filter(
    (status) => status === 'done' || status === 'rejected'
  ),
  threeColumn: normalizeOrder(settings.boardColumnOrder?.threeColumn, taskStatuses).slice(0, 4),
  full: normalizeOrder(settings.boardColumnOrder?.full, taskStatuses).slice(0, 4)
});

const columnWidth = (settings, status) => Number(settings.columnWidths?.[widthKey(status)]) || 25;
const stackHeight = (settings, status) => Number(settings.compactHeights?.[widthKey(status)]) || 50;
const collapsedLane = (settings, status) => settings.collapsedBoardLanes?.includes(status) || false;
const collapsedTrack = 'var(--collapsed-lane-size, 3.5rem)';
const columnTrack = (settings, status) => String(columnWidth(settings, status)) + 'fr';
const stackTrack = (settings, status) =>
  collapsedLane(settings, status) ? collapsedTrack : String(stackHeight(settings, status)) + 'fr';
const gridTemplate = (tracks, resizeVisible) =>
  tracks
    .flatMap((track, index) =>
      resizeVisible && index < tracks.length - 1 ? [track, 'var(--resize-handle-thickness, 4px)'] : [track]
    )
    .join(' ');
const stackTemplate = (settings, pair, resizeVisible) =>
  resizeVisible
    ? stackTrack(settings, pair[0]) + ' var(--resize-handle-thickness, 4px) ' + stackTrack(settings, pair[1])
    : stackTrack(settings, pair[0]) + ' ' + stackTrack(settings, pair[1]);

function ResizeHandle({ id, orientation = 'vertical', startResize, title }) {
  return (
    <div
      data-testid={'board-resizer-' + id}
      className={
        'resize-handle resize-handle-' +
        orientation +
        ' ' +
        (orientation === 'vertical' ? 'hidden cursor-col-resize sm:flex' : 'flex cursor-row-resize') +
        ' shrink-0 items-center justify-center rounded hover:bg-indigo-500/10 group'
      }
      onMouseDown={(event) => {
        event.preventDefault();
        startResize(id);
      }}
      title={title || 'Resize board lanes'}
    >
      <div
        className={
          'resize-grip resize-grip-' +
          orientation +
          ' rounded-full bg-slate-300 transition-colors group-hover:bg-indigo-400 dark:bg-slate-700'
        }
      ></div>
    </div>
  );
}

const observeListRect = (instance, callback) => {
  const element = instance.scrollElement;
  if (!element) return undefined;
  const update = () =>
    callback({
      width: element.clientWidth || 1024,
      height: element.clientHeight || 640
    });
  update();
  const observer = new ResizeObserver(update);
  observer.observe(element);
  window.addEventListener('resize', update);
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', update);
  };
};

export function TaskListView({ filteredTasks, setSelectedTaskId, now }) {
  const parentRef = useRef(null);
  const rows = useMemo(
    () =>
      taskStatuses.flatMap((status) => {
        const statusTasks = filteredTasks.filter((task) => task.status === status);
        return [
          { type: 'header', key: `header-${status}`, status, count: statusTasks.length },
          ...(statusTasks.length
            ? statusTasks.map((task) => ({ type: 'task', key: `task-${task.id}`, status, task }))
            : [{ type: 'empty', key: `empty-${status}`, status }])
        ];
      }),
    [filteredTasks]
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual manages its own measurement callbacks.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => rows[index].key,
    estimateSize: (index) => (rows[index].type === 'header' ? 44 : rows[index].type === 'empty' ? 64 : 92),
    observeElementRect: observeListRect,
    overscan: 6,
    initialRect: { width: 1024, height: 640 }
  });
  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      role="list"
      aria-label="Task list"
      data-testid="virtualized-task-list"
      data-total-items={rows.length}
      data-virtual-items={virtualRows.length}
      className="custom-scrollbar h-full overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.key}
              data-index={virtualRow.index}
              className="absolute left-0 top-0 w-full"
              style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
            >
              {row.type === 'header' && (
                <div className="flex h-full items-center justify-between border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <span className={`h-2 w-2 rounded-full ${statusColorClass(row.status)}`}></span>
                    {statusLabels[row.status]}
                  </h2>
                  <span className="text-xs font-medium text-slate-500">{row.count}</span>
                </div>
              )}
              {row.type === 'empty' && (
                <div className="flex h-full items-center justify-center border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                  No tasks found
                </div>
              )}
              {row.type === 'task' &&
                (() => {
                  const task = row.task;
                  const taskTags = getEffectiveTags(task);
                  const totalMs =
                    calculateTotalDuration(task.logs || []) +
                    (task.activeLogStart ? Math.max(0, now - new Date(task.activeLogStart).getTime()) : 0);
                  return (
                    <div role="listitem" className="h-full border-b border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className="h-full w-full px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className={`truncate text-sm font-semibold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}
                            >
                              {task.title || 'Untitled Task'}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {taskTags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="shrink-0 space-y-1 text-right">
                            <UrgencyBadge urgency={task.urgency} />
                            {totalMs > 0 && (
                              <div className="font-mono text-[10px] text-slate-500">
                                {formatDurationString(totalMs)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                          {task.scheduledDate && <span>{formatDate(task.scheduledDate)}</span>}
                          {task.scheduledStart && <span>{task.scheduledStart}</span>}
                          {task.recurrence && task.recurrence !== 'none' && (
                            <span className="flex items-center gap-1">
                              <Repeat size={12} /> {task.recurrence}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MobileFocusView({
  filteredTasks,
  currentTask,
  setSelectedTaskId,
  now,
  onStartTask,
  onCompleteTask,
  onRejectTask,
  onNextTask
}) {
  const inProgress = filteredTasks.filter((task) => task.status === 'in-progress');
  const queued = inProgress.filter((task) => task.id !== currentTask?.id);
  const nextTask = queued[0];

  return (
    <div data-testid="mobile-focus-view" className="custom-scrollbar h-full overflow-y-auto pb-4 sm:hidden">
      <section className="mb-3 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-800 dark:bg-slate-900">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-500">Current</div>
        {currentTask ? (
          <>
            <button
              type="button"
              aria-label={`Open current task ${currentTask.title}`}
              onClick={() => setSelectedTaskId(currentTask.id)}
              className="min-h-16 w-full rounded-xl bg-indigo-600 px-4 py-3 text-left text-lg font-semibold text-white"
            >
              <span className="block">{currentTask.title || 'Untitled Task'}</span>
              {currentTask.activeLogStart && (
                <span className="mt-1 block font-mono text-sm text-indigo-100">
                  {formatLiveTimer(currentTask.activeLogStart, now)}
                </span>
              )}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-label={currentTask.activeLogStart ? 'Stop current task' : 'Start current task'}
                onClick={() => onStartTask(currentTask.id)}
                className="min-h-12 rounded-xl bg-emerald-600 px-3 py-2 text-base font-semibold text-white"
              >
                {currentTask.activeLogStart ? 'Stop' : 'Start'}
              </button>
              <button
                type="button"
                aria-label="Complete current task"
                onClick={() => onCompleteTask(currentTask.id)}
                className="min-h-12 rounded-xl bg-indigo-600 px-3 py-2 text-base font-semibold text-white"
              >
                Done
              </button>
              <button
                type="button"
                aria-label="Reject current task"
                onClick={() => onRejectTask(currentTask.id)}
                className="min-h-12 rounded-xl border border-rose-300 px-3 py-2 text-base font-semibold text-rose-700 dark:border-rose-700 dark:text-rose-300"
              >
                Reject
              </button>
              <button
                type="button"
                aria-label="Start next task"
                disabled={!nextTask}
                onClick={() => nextTask && onNextTask(nextTask.id)}
                className="min-h-12 rounded-xl border border-slate-300 px-3 py-2 text-base font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="py-3 text-base text-slate-500">No current task</div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">In-Progress</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {queued.length}
          </span>
        </div>
        <div className="space-y-2">
          {queued.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTaskId(task.id)}
              className="min-h-14 w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-base font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100"
            >
              {task.title || 'Untitled Task'}
            </button>
          ))}
          {queued.length === 0 && (
            <div className="py-4 text-center text-base text-slate-400">No tasks up next</div>
          )}
        </div>
      </section>
    </div>
  );
}

export function KanbanBoard({
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
  startResize,
  onToggleLane,
  onMoveTask,
  onReorderTask
}) {
  const [moveAnnouncement, setMoveAnnouncement] = useState('');
  const layoutPreset =
    settings.layoutPreset === 'standard' ? 'three-column' : settings.layoutPreset || 'compact';
  const resizeVisible = settings.resizeHandleVisible !== false;
  const order = boardOrder(settings);
  const columnProps = {
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
    announceMove: (task, status, direction) => {
      setMoveAnnouncement(
        direction
          ? `${task.title || 'Task'} moved ${direction}.`
          : `${task.title || 'Task'} moved to ${statusLabels[status]}.`
      );
    }
  };
  const column = (status) => <TaskColumn key={status} status={status} {...columnProps} />;
  const verticalHandle = (left, right) =>
    resizeVisible ? (
      <ResizeHandle
        key={'handle-' + left + '-' + right}
        id={'columns:' + left + ':' + right}
        startResize={startResize}
        title={'Resize ' + statusLabels[left] + ' and ' + statusLabels[right]}
      />
    ) : null;
  const stackHandle = (top, bottom, containerId) =>
    resizeVisible ? (
      <ResizeHandle
        key={'handle-' + top + '-' + bottom}
        id={'stack:' + top + ':' + bottom + ':' + containerId}
        orientation="horizontal"
        startResize={startResize}
        title={'Resize ' + statusLabels[top] + ' and ' + statusLabels[bottom]}
      />
    ) : null;

  return (
    <div
      id="kanban-board"
      data-testid="kanban-board"
      data-layout-preset={layoutPreset}
      className="min-h-0 flex-1 overflow-y-auto sm:overflow-hidden"
    >
      {layoutPreset === 'full' && (
        <div
          className="kanban-board-grid min-h-full gap-3 pb-3 sm:h-full sm:pb-0"
          style={cssVars({
            '--kanban-grid-template': gridTemplate(
              order.full.map((status) => columnTrack(settings, status)),
              resizeVisible
            )
          })}
        >
          {order.full.flatMap((status, index) => [
            column(status),
            index < order.full.length - 1 ? verticalHandle(status, order.full[index + 1]) : null
          ])}
        </div>
      )}

      {layoutPreset === 'three-column' && (
        <div
          className="kanban-board-grid min-h-full gap-3 pb-3 sm:h-full sm:pb-0"
          style={cssVars({
            '--kanban-grid-template': gridTemplate(
              [
                columnTrack(settings, order.threeColumn[0]),
                columnTrack(settings, order.threeColumn[1]),
                String(
                  columnWidth(settings, order.threeColumn[2]) + columnWidth(settings, order.threeColumn[3])
                ) + 'fr'
              ],
              resizeVisible
            )
          })}
        >
          {column(order.threeColumn[0])}
          {verticalHandle(order.threeColumn[0], order.threeColumn[1])}
          {column(order.threeColumn[1])}
          {resizeVisible && (
            <ResizeHandle
              id={
                'columns-group:' +
                order.threeColumn[1] +
                ':' +
                order.threeColumn[2] +
                ',' +
                order.threeColumn[3]
              }
              startResize={startResize}
              title={'Resize ' + statusLabels[order.threeColumn[1]] + ' and outcomes'}
            />
          )}
          <div
            id="three-outcomes-col"
            className="kanban-stack min-h-[28rem] gap-3 sm:min-h-0"
            style={cssVars({
              '--kanban-stack-template': stackTemplate(
                settings,
                [order.threeColumn[2], order.threeColumn[3]],
                resizeVisible
              )
            })}
          >
            {column(order.threeColumn[2])}
            {stackHandle(order.threeColumn[2], order.threeColumn[3], 'three-outcomes-col')}
            {column(order.threeColumn[3])}
          </div>
        </div>
      )}

      {layoutPreset === 'compact' && (
        <div
          className="kanban-board-grid min-h-full gap-3 pb-3 sm:h-full sm:pb-0"
          style={cssVars({
            '--kanban-grid-template': gridTemplate(
              [
                String(settings.compactColumnWidths?.left || 50) + 'fr',
                String(settings.compactColumnWidths?.right || 50) + 'fr'
              ],
              resizeVisible
            )
          })}
        >
          <div
            id="compact-left-col"
            className="kanban-stack min-h-[28rem] gap-3 sm:min-h-0"
            style={cssVars({
              '--kanban-stack-template': stackTemplate(settings, order.compactActive, resizeVisible)
            })}
          >
            {column(order.compactActive[0])}
            {stackHandle(order.compactActive[0], order.compactActive[1], 'compact-left-col')}
            {column(order.compactActive[1])}
          </div>
          {resizeVisible && (
            <ResizeHandle
              id="compact-horizontal"
              startResize={startResize}
              title="Resize active and outcome lanes"
            />
          )}
          <div
            id="compact-right-col"
            className="kanban-stack min-h-[28rem] gap-3 sm:min-h-0"
            style={cssVars({
              '--kanban-stack-template': stackTemplate(settings, order.compactDone, resizeVisible)
            })}
          >
            {column(order.compactDone[0])}
            {stackHandle(order.compactDone[0], order.compactDone[1], 'compact-right-col')}
            {column(order.compactDone[1])}
          </div>
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {moveAnnouncement}
      </div>
    </div>
  );
}
