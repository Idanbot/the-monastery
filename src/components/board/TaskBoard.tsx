import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDownUp, CheckSquare, Clock, Flame, GripHorizontal, Play, Repeat } from 'lucide-react';
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

const statusColorClass = (status) =>
  status === 'backlog'
    ? 'bg-indigo-500'
    : status === 'in-progress'
      ? 'bg-sky-500'
      : status === 'done'
        ? 'bg-emerald-500'
        : 'bg-rose-500';

function TaskColumn({
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
  now
}) {
  const filtered = filteredTasks.filter((task) => task.status === status);
  const sortType = columnSorts[status] || 'none';

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
      className="flex h-full min-h-[14rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-200/50 dark:border-slate-800/60 dark:bg-slate-800/40 sm:min-h-0"
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
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
            title={`Sort: ${sortType}`}
          >
            {sortType === 'urgency' && <Flame size={12} className="text-orange-500" />}
            {sortType === 'time' && <Clock size={12} className="text-blue-500" />}
            {sortType === 'none' && <ArrowDownUp size={12} />}
          </button>
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {filtered.length}
        </span>
      </div>

      <div className="custom-scrollbar relative flex-1 space-y-2 overflow-y-auto p-2">
        {filtered.map((task) => {
          const isActive = task.activeLogStart || task.subtasks.some((subtask) => subtask.activeLogStart);
          const isDragOverTop = dragOverInfo?.id === task.id && dragOverInfo?.position === 'top';
          const isDragOverBottom = dragOverInfo?.id === task.id && dragOverInfo?.position === 'bottom';
          const isDragging = draggedTaskId === task.id;
          const isKeyboardFocused = keyboardFocusedTaskId === task.id;
          const taskTags = getEffectiveTags(task);

          return (
            <div key={task.id} onDragOver={(e) => handleDragOver(e, status, task.id)} className="relative">
              {isDragOverTop && (
                <div className="relative z-10 mx-1 mb-2 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
              )}

              <div
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={() => {
                  setDraggedTaskId(null);
                  setDragOverInfo(null);
                }}
                onClick={() => setSelectedTaskId(task.id)}
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
    </div>
  );
}

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
const gridTemplate = (tracks, resizeVisible) =>
  tracks
    .flatMap((track, index) =>
      resizeVisible && index < tracks.length - 1 ? [track, 'var(--resize-handle-thickness, 4px)'] : [track]
    )
    .join(' ');
const stackTemplate = (settings, pair, resizeVisible) =>
  resizeVisible
    ? String(stackHeight(settings, pair[0])) +
      'fr var(--resize-handle-thickness, 4px) ' +
      String(stackHeight(settings, pair[1])) +
      'fr'
    : String(stackHeight(settings, pair[0])) + 'fr ' + String(stackHeight(settings, pair[1])) + 'fr';

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

export function TaskListView({ filteredTasks, setSelectedTaskId, now }) {
  const orderedStatuses = taskStatuses;
  const parentRef = useRef(null);
  const rowCount = useMemo(
    () => orderedStatuses.length + filteredTasks.length,
    [filteredTasks, orderedStatuses.length]
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual manages its own measurement callbacks.
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92,
    overscan: 8
  });

  return (
    <div
      ref={parentRef}
      role="list"
      aria-label="Task list"
      data-testid="virtualized-task-list"
      data-virtual-items={virtualizer.getVirtualItems().length}
      className="custom-scrollbar h-full space-y-4 overflow-y-auto pb-3"
    >
      {orderedStatuses.map((status) => {
        const statusTasks = filteredTasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <span className={`h-2 w-2 rounded-full ${statusColorClass(status)}`}></span>
                {statusLabels[status]}
              </h2>
              <span className="text-xs font-medium text-slate-500">{statusTasks.length}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {statusTasks.map((task) => {
                const taskTags = getEffectiveTags(task);
                const totalMs =
                  calculateTotalDuration(task.logs || []) +
                  (task.activeLogStart ? Math.max(0, now - new Date(task.activeLogStart).getTime()) : 0);
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
                );
              })}
              {statusTasks.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-slate-400">No tasks found</div>
              )}
            </div>
          </section>
        );
      })}
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
  startResize
}) {
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
    now
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
              order.full.map((status) => String(columnWidth(settings, status)) + 'fr'),
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
                String(columnWidth(settings, order.threeColumn[0])) + 'fr',
                String(columnWidth(settings, order.threeColumn[1])) + 'fr',
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
    </div>
  );
}
