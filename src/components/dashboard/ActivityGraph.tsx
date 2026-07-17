import { useMemo } from 'react';
import { CheckCheck, CheckCircle2, Clock3, Flame } from 'lucide-react';
import type { Task } from '../../domain/types';
import { formatDurationString } from '../../domain/tasks';
import { buildActivitySummary } from '../../domain/activityTracking';

interface ActivityGraphProps {
  tasks: Task[];
  compact?: boolean;
  now?: number;
}

export function ActivityGraph({ tasks, compact = false, now = Date.now() }: ActivityGraphProps) {
  const summary = useMemo(() => buildActivitySummary(tasks, { now, days: 90 }), [tasks, now]);
  const visibleActivity = compact ? summary.days.slice(-28) : summary.days;
  const maxScore = Math.max(1, ...visibleActivity.map((day) => day.score));

  const getColorClass = (score: number) => {
    if (score === 0) return 'border border-[var(--ui-border-subtle)] bg-[var(--ui-control)]';
    const intensity = score / maxScore;
    if (intensity < 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40';
    if (intensity < 0.5) return 'bg-emerald-300 dark:bg-emerald-800/60';
    if (intensity < 0.75) return 'bg-emerald-400 dark:bg-emerald-600/80';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  const detailLabel = (day: (typeof visibleActivity)[number]) =>
    `${day.date}: ${formatDurationString(day.trackedMs)} tracked, ${day.completedSubtasks} subtask${day.completedSubtasks === 1 ? '' : 's'} completed, ${day.completedTasks} task${day.completedTasks === 1 ? '' : 's'} completed`;

  return (
    <section className="ui-surface w-full rounded-2xl border p-4 shadow-sm sm:rounded-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">Activity</h3>
        <span className="ui-muted-chip inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ui-success)]">
          <Flame size={14} /> {summary.currentStreak} day streak
        </span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <ActivityMetric
          testId="activity-tracked-time"
          icon={Clock3}
          label="Focused"
          value={formatDurationString(summary.totalTrackedMs)}
        />
        <ActivityMetric
          testId="activity-subtasks-completed"
          icon={CheckCheck}
          label="Subtasks"
          value={String(summary.completedSubtasks)}
        />
        <ActivityMetric
          testId="activity-tasks-completed"
          icon={CheckCircle2}
          label="Tasks"
          value={String(summary.completedTasks)}
        />
      </div>
      <div
        className={
          compact ? 'grid grid-cols-[repeat(7,1rem)] justify-end gap-1.5' : 'flex flex-wrap justify-end gap-1'
        }
        data-testid="activity-days"
      >
        {visibleActivity.map((day) => (
          <div
            key={day.date}
            role="img"
            aria-label={detailLabel(day)}
            className={`h-4 w-4 rounded-[3px] transition-colors ${getColorClass(day.score)}`}
            title={detailLabel(day)}
          />
        ))}
      </div>
    </section>
  );
}

function ActivityMetric({
  testId,
  icon: Icon,
  label,
  value
}: {
  testId: string;
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="ui-control min-w-0 rounded-xl px-2.5 py-2" data-testid={testId}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--ui-text-secondary)]">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-1 truncate font-mono text-sm font-bold text-[var(--ui-text-primary)]">{value}</div>
    </div>
  );
}
