import { AlertTriangle, CalendarCheck, Clock3, Target } from 'lucide-react';
import { buildFocusPlan } from '../../domain/focusPlanning';
import { formatDateInputValue } from '../../domain/tasks';
import type { AppSettings, Task } from '../../domain/types';

type FocusPlanningPanelProps = {
  tasks: Task[];
  settings: AppSettings;
  now: number;
  onApply: (date: string, taskIds: string[], startMinutes: number) => void;
  onClose: () => void;
};

const formatHours = (minutes: number) => `${Math.round((minutes / 60) * 10) / 10}h`;

export function FocusPlanningPanel({ tasks, settings, now, onApply, onClose }: FocusPlanningPanelProps) {
  const nowDate = new Date(now);
  const date = formatDateInputValue(nowDate);
  const nextHour = Math.min(21, Math.max(9, nowDate.getHours() + 1));
  const plan = buildFocusPlan({
    tasks,
    roles: settings.roles || [],
    date,
    startMinutes: nextHour * 60,
    endMinutes: 17 * 60
  });
  const roleSummary = Object.entries(plan.roleCounts)
    .map(([role, count]) => `${role} ${count}`)
    .join(' · ');

  return (
    <section
      aria-label="Focus planning"
      className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/30"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100">
            <Target size={16} />
            Focus planning
          </div>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/75">
            Pick 3-5 tasks, keep context switches low, and schedule only what fits today.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-950/50">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock3 size={12} /> Available
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {formatHours(plan.availableMinutes)}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-950/50">
            <div className="text-slate-500 dark:text-slate-400">Planned</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {formatHours(plan.totalEstimatedMinutes)}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-950/50">
            <div className="text-slate-500 dark:text-slate-400">Tasks</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{plan.suggestions.length}</div>
          </div>
        </div>
      </div>

      {plan.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {plan.warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 grid gap-2 lg:grid-cols-5" data-testid="focus-plan-suggestions">
        {plan.suggestions.map((suggestion) => (
          <article
            key={suggestion.taskId}
            className="rounded-xl border border-white/70 bg-white/85 p-3 dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <span>{suggestion.status === 'in-progress' ? 'Current' : 'Backlog'}</span>
              <span>
                {suggestion.scheduledStart}-{suggestion.scheduledEnd}
              </span>
            </div>
            <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">
              {suggestion.title}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestion.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-xs text-emerald-800/80 dark:text-emerald-200/75">
          {roleSummary ? `Role balance: ${roleSummary}` : 'Role balance: no role tags matched yet.'}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-800 hover:border-emerald-400 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-100"
          >
            Close
          </button>
          <button
            type="button"
            disabled={plan.suggestions.length === 0}
            onClick={() =>
              onApply(
                plan.date,
                plan.suggestions.map((suggestion) => suggestion.taskId),
                plan.startMinutes
              )
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarCheck size={14} />
            Apply focus plan
          </button>
        </div>
      </div>
    </section>
  );
}
