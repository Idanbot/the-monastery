import { useMemo, useState } from 'react';
import { CheckCheck, CheckCircle2, Clock3, Flame } from 'lucide-react';
import type { ActivityPetId, Task } from '../../domain/types';
import { formatDurationString } from '../../domain/tasks';
import { buildActivitySummary } from '../../domain/activityTracking';
import { ActivityPet } from './ActivityPet';
import { MajesticFlame } from './MajesticFlame';

interface ActivityGraphProps {
  tasks: Task[];
  compact?: boolean;
  fill?: boolean;
  now?: number;
  petId?: ActivityPetId;
  showPet?: boolean;
  animateFlame?: boolean;
  animatePet?: boolean;
}

export function ActivityGraph({
  tasks,
  compact = false,
  fill = false,
  now = Date.now(),
  petId = 'aurelius',
  showPet = true,
  animateFlame = true,
  animatePet = true
}: ActivityGraphProps) {
  const [activeDay, setActiveDay] = useState<ReturnType<typeof buildActivitySummary>['days'][number] | null>(
    null
  );
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
  const formatActivityDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year.slice(-2)}`;
  };

  return (
    <section
      className={`ui-surface w-full rounded-2xl border p-4 shadow-sm sm:rounded-xl sm:p-5 ${
        fill ? 'custom-scrollbar h-full min-h-0 overflow-y-auto' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">Activity</h3>
        <div className="flex items-center gap-2">
          {showPet && (
            <ActivityPet
              petId={petId}
              streakActive={summary.currentStreak > 0}
              activityScore={Math.min(100, (summary.days.at(-1)?.score || 0) * 20)}
              animated={animatePet}
            />
          )}
          <span className="ui-muted-chip inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ui-success)]">
            {animateFlame && summary.currentStreak > 0 ? (
              <MajesticFlame />
            ) : (
              <Flame data-testid="streak-flame" data-animated="false" size={14} />
            )}{' '}
            {summary.currentStreak} day streak
          </span>
        </div>
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
      <div className="relative">
        {activeDay && (
          <div
            role="tooltip"
            className="ui-surface absolute bottom-full right-0 z-20 mb-2 min-w-40 rounded-lg border px-3 py-2 text-left shadow-lg"
          >
            <div className="font-mono text-xs font-bold text-[var(--ui-text-primary)]">
              {formatActivityDate(activeDay.date)}
            </div>
            <div className="mt-1 text-xs text-[var(--ui-text-secondary)]">
              {formatDurationString(activeDay.trackedMs)} focused
            </div>
            <div className="text-[11px] text-[var(--ui-text-secondary)]">
              {activeDay.completedTasks} tasks / {activeDay.completedSubtasks} subtasks
            </div>
          </div>
        )}
        <div
          className={
            compact
              ? 'grid grid-cols-[repeat(7,1rem)] justify-end gap-1.5'
              : 'flex flex-wrap justify-end gap-1'
          }
          data-testid="activity-days"
        >
          {visibleActivity.map((day) => (
            <span
              key={day.date}
              role="img"
              tabIndex={day.score > 0 ? 0 : -1}
              aria-label={detailLabel(day)}
              className={`h-4 w-4 rounded-[3px] transition-colors focus:outline-2 focus:outline-offset-1 focus:outline-[var(--ui-focus-ring)] ${getColorClass(day.score)}`}
              title={detailLabel(day)}
              onMouseEnter={() => setActiveDay(day)}
              onMouseLeave={() => setActiveDay(null)}
              onFocus={() => setActiveDay(day)}
              onBlur={() => setActiveDay(null)}
            />
          ))}
        </div>
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
