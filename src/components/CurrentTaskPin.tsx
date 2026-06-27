import { CheckCircle2, Play, Plus, Square } from 'lucide-react';
import type { Task } from '../domain/types';
import { calculateTotalDuration, formatDurationString, formatLiveTimer } from '../domain/tasks';
import { UrgencyBadge } from './UrgencyBadge';

type Props = {
  task: Task | null;
  now: number;
  onOpen: (taskId: string) => void;
  onAdd: () => void;
  onToggleTimer: (taskId: string) => void;
  onComplete: (taskId: string) => void;
};

export function CurrentTaskPin({ task, now, onOpen, onAdd, onToggleTimer, onComplete }: Props) {
  if (!task) {
    return (
      <section
        data-testid="current-task-pin"
        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Now</div>
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">No active task pinned.</div>
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={15} /> Backlog task
        </button>
      </section>
    );
  }

  const trackedLabel = task.activeLogStart
    ? formatLiveTimer(task.activeLogStart, now)
    : formatDurationString(calculateTotalDuration(task.logs));

  return (
    <section
      data-testid="current-task-pin"
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Now</div>
        <button
          onClick={() => onOpen(task.id)}
          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open
        </button>
      </div>
      <button onClick={() => onOpen(task.id)} className="group block w-full text-left">
        <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
          {task.title || 'Untitled task'}
        </h2>
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">{trackedLabel}</span>
        <UrgencyBadge urgency={task.urgency} />
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <button
          onClick={() => onToggleTimer(task.id)}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white ${task.activeLogStart ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {task.activeLogStart ? <Square size={14} /> : <Play size={14} />}
          {task.activeLogStart ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={() => onComplete(task.id)}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800"
        >
          <CheckCircle2 size={14} /> Done
        </button>
      </div>
    </section>
  );
}
