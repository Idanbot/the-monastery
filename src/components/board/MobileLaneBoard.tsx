import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { TaskStatus } from '../../domain/types';
import { statusLabels, taskStatuses } from '../../domain/tasks';
import { TaskColumn } from './TaskColumn';

const compactStatusLabel: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'Doing',
  done: 'Done',
  rejected: 'Rejected'
};

type MobileLaneBoardProps = Omit<ComponentProps<typeof TaskColumn>, 'status' | 'announceMove'>;

export function MobileLaneBoard({ filteredTasks, onMoveTask, ...columnProps }: MobileLaneBoardProps) {
  const [activeStatus, setActiveStatus] = useState<TaskStatus>(() =>
    filteredTasks.some((task) => task.status === 'in-progress') ? 'in-progress' : 'backlog'
  );
  const [announcement, setAnnouncement] = useState('');
  const counts = Object.fromEntries(
    taskStatuses.map((status) => [status, filteredTasks.filter((task) => task.status === status).length])
  ) as Record<TaskStatus, number>;

  return (
    <div data-testid="mobile-lane-board" className="flex h-full min-h-0 flex-col sm:hidden">
      <div
        role="tablist"
        aria-label="Board lanes"
        data-testid="mobile-lane-tabs"
        className="mb-2 grid shrink-0 grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {taskStatuses.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            id={`mobile-lane-tab-${status}`}
            aria-controls={`mobile-lane-panel-${status}`}
            aria-selected={activeStatus === status}
            aria-label={`${statusLabels[status]}, ${counts[status]} ${counts[status] === 1 ? 'task' : 'tasks'}`}
            onClick={() => setActiveStatus(status)}
            className={`min-w-0 rounded-lg px-1 py-2 text-[11px] font-semibold ${
              activeStatus === status
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span className="block truncate">{compactStatusLabel[status]}</span>
            <span className="mt-0.5 block text-[10px] opacity-80">{counts[status]}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`mobile-lane-panel-${activeStatus}`}
        aria-labelledby={`mobile-lane-tab-${activeStatus}`}
        data-testid="mobile-active-lane"
        className="min-h-0 flex-1"
      >
        <TaskColumn
          {...columnProps}
          filteredTasks={filteredTasks}
          status={activeStatus}
          onMoveTask={(taskId, status) => {
            onMoveTask(taskId, status);
            setActiveStatus(status);
          }}
          announceMove={(task, status, direction) => {
            setAnnouncement(
              direction
                ? `${task.title || 'Task'} moved ${direction}.`
                : `${task.title || 'Task'} moved to ${statusLabels[status]}.`
            );
          }}
        />
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
