import { ArrowDownUp, CheckSquare, Clock, Flame, GripHorizontal, Play, Repeat } from 'lucide-react';
import { UrgencyBadge } from '../UrgencyBadge';
import {
  calculateTotalDuration,
  formatDate,
  formatDurationString,
  formatLiveTimer,
  getEffectiveTags
} from '../../domain/tasks';

const statusColorClass = (status) =>
  status === 'new' ? 'bg-indigo-500' : status === 'done' ? 'bg-emerald-500' : 'bg-rose-500';

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
  now
}) {
  const filtered = filteredTasks.filter((task) => task.status === status);
  const sortType = columnSorts[status];

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
      className="flex flex-col h-full bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden"
      onDragOver={(e) => handleDragOver(e, status)}
      onDrop={(e) => handleDrop(e, status)}
    >
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/80 flex justify-between items-center shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 capitalize flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColorClass(status)}`}></div>
            {status}
          </h2>
          <button
            onClick={() => cycleSort(status)}
            className="p-1 rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Sort: ${columnSorts[status]}`}
          >
            {sortType === 'urgency' && <Flame size={12} className="text-orange-500" />}
            {sortType === 'time' && <Clock size={12} className="text-blue-500" />}
            {sortType === 'none' && <ArrowDownUp size={12} />}
          </button>
        </div>
        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs py-0.5 px-2 rounded-full font-medium">
          {filtered.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar relative">
        {filtered.map((task) => {
          const isActive = task.activeLogStart || task.subtasks.some((subtask) => subtask.activeLogStart);
          const isDragOverTop = dragOverInfo?.id === task.id && dragOverInfo?.position === 'top';
          const isDragOverBottom = dragOverInfo?.id === task.id && dragOverInfo?.position === 'bottom';
          const isDragging = draggedTaskId === task.id;
          const taskTags = getEffectiveTags(task);

          return (
            <div key={task.id} onDragOver={(e) => handleDragOver(e, status, task.id)} className="relative">
              {isDragOverTop && (
                <div className="h-1 bg-indigo-500 rounded-full mb-2 mx-1 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-10 relative"></div>
              )}

              <div
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={() => {
                  setDraggedTaskId(null);
                  setDragOverInfo(null);
                }}
                onClick={() => setSelectedTaskId(task.id)}
                className={`bg-white dark:bg-slate-900 ${settings.collapseTasks ? 'p-2' : 'p-3'} rounded-lg shadow-sm border cursor-pointer transition-all group overflow-hidden ${isDragging ? 'opacity-50 grayscale' : ''}
                  ${isActive ? 'border-indigo-400 ring-1 ring-indigo-400/30' : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600'}
                `}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500 animate-pulse"></div>
                )}

                <div
                  className={`flex justify-between items-start ${settings.collapseTasks ? 'mb-0' : 'mb-1.5'}`}
                >
                  <div className="flex items-center gap-1.5 pr-2 min-w-0">
                    <GripHorizontal
                      size={14}
                      className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0"
                    />
                    <h3
                      className={`font-semibold text-sm leading-tight truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      {task.title || 'Untitled Task'}
                    </h3>
                  </div>
                </div>

                {!settings.collapseTasks && isActive && (
                  <div className="mt-2 mb-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded p-1.5 flex items-center justify-between border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                    <div className="flex items-center gap-1 font-medium text-xs">
                      <Play size={10} className="animate-pulse" fill="currentColor" /> Active
                    </div>
                    <div className="font-mono font-bold text-sm tracking-tight drop-shadow-sm">
                      {task.activeLogStart ? formatLiveTimer(task.activeLogStart, now) : 'Live Subtask'}
                    </div>
                  </div>
                )}

                {!settings.collapseTasks && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <UrgencyBadge urgency={task.urgency} />
                    {task.scheduledStart && (
                      <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 rounded">
                        {task.scheduledStart}
                      </div>
                    )}
                    {task.subtasks?.length > 0 && (
                      <div className="text-[10px] flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 rounded">
                        <CheckSquare size={10} />{' '}
                        {task.subtasks.filter((subtask) => subtask.status === 'done').length}/
                        {task.subtasks.length}
                      </div>
                    )}
                  </div>
                )}

                {!settings.collapseTasks && taskTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {taskTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded truncate max-w-[60px]"
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
                <div className="h-1 bg-indigo-500 rounded-full mt-2 mx-1 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-10 relative"></div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && !dragOverInfo && (
          <div className="h-20 flex flex-col items-center justify-center text-slate-400 text-xs italic opacity-50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg mx-2">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskListView({ filteredTasks, setSelectedTaskId, now }) {
  const orderedStatuses = ['new', 'done', 'rejected'];

  return (
    <div role="list" aria-label="Task list" className="h-full overflow-y-auto custom-scrollbar space-y-4">
      {orderedStatuses.map((status) => {
        const statusTasks = filteredTasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-sm capitalize flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColorClass(status)}`}></span>
                {status}
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
                    className="w-full text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className={`font-semibold text-sm truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}
                        >
                          {task.title || 'Untitled Task'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {taskTags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        <UrgencyBadge urgency={task.urgency} />
                        {totalMs > 0 && (
                          <div className="text-[10px] font-mono text-slate-500">
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
  now,
  startResize
}) {
  return (
    <div
      id="kanban-board"
      className="flex-1 min-h-0 flex flex-col sm:flex-row gap-2 md:gap-4 overflow-hidden relative"
    >
      {settings.layoutPreset === 'standard' ? (
        <>
          <div
            style={{ flex: `${settings.columnWidths.new} 1 0%` }}
            className="h-full min-h-0 min-w-0 flex-1"
          >
            <TaskColumn
              status="new"
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
            />
          </div>
          <div
            className="resize-handle resize-handle-vertical w-1 cursor-col-resize shrink-0 flex items-center justify-center hover:bg-indigo-500/10 group rounded hidden sm:flex"
            onMouseDown={() => startResize('new-done')}
          >
            <div className="resize-grip resize-grip-vertical w-px h-10 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
          </div>
          <div
            style={{ flex: `${settings.columnWidths.done} 1 0%` }}
            className="h-full min-h-0 min-w-0 flex-1"
          >
            <TaskColumn
              status="done"
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
            />
          </div>
          <div
            className="resize-handle resize-handle-vertical w-1 cursor-col-resize shrink-0 flex items-center justify-center hover:bg-indigo-500/10 group rounded hidden sm:flex"
            onMouseDown={() => startResize('done-rejected')}
          >
            <div className="resize-grip resize-grip-vertical w-px h-10 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
          </div>
          <div
            style={{ flex: `${settings.columnWidths.rejected} 1 0%` }}
            className="h-full min-h-0 min-w-0 flex-1"
          >
            <TaskColumn
              status="rejected"
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
            />
          </div>
        </>
      ) : (
        <>
          <div
            style={{ flex: `${settings.compactColumnWidths.left} 1 0%` }}
            className="h-full min-h-0 min-w-0 flex-1"
          >
            <TaskColumn
              status="new"
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
            />
          </div>
          <div
            className="resize-handle resize-handle-vertical w-1 cursor-col-resize shrink-0 flex items-center justify-center hover:bg-indigo-500/10 group rounded hidden sm:flex"
            onMouseDown={() => startResize('compact-horizontal')}
          >
            <div className="resize-grip resize-grip-vertical w-px h-10 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
          </div>
          <div
            id="compact-right-col"
            style={{ flex: `${settings.compactColumnWidths.right} 1 0%` }}
            className="h-full min-h-0 flex flex-col min-w-0 flex-1"
          >
            <div style={{ flex: `${settings.compactHeights.done} 1 0%` }} className="w-full min-h-0 flex-1">
              <TaskColumn
                status="done"
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
              />
            </div>
            <div
              className="resize-handle resize-handle-horizontal h-1 w-full cursor-row-resize shrink-0 flex items-center justify-center hover:bg-indigo-500/10 group rounded"
              onMouseDown={() => startResize('compact-vertical')}
            >
              <div className="resize-grip resize-grip-horizontal h-px w-10 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
            </div>
            <div
              style={{ flex: `${settings.compactHeights.rejected} 1 0%` }}
              className="w-full min-h-0 flex-1"
            >
              <TaskColumn
                status="rejected"
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
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
