import { useMemo, useState, type CSSProperties } from 'react';
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
  clearedBefore?: string;
}

type ActivityRange = 28 | 90 | 365;

const activityRanges = [
  { days: 28, shortLabel: '4W', label: '4 weeks' },
  { days: 90, shortLabel: '3M', label: '3 months' },
  { days: 365, shortLabel: '1Y', label: '1 year' }
] as const satisfies readonly { days: ActivityRange; shortLabel: string; label: string }[];
const weekdayLabels = ['M', '', 'W', '', 'F', '', ''];
const streakMilestones = [3, 7, 14, 30, 60, 100, 365];
const petName = (petId: ActivityPetId) => petId.charAt(0).toUpperCase() + petId.slice(1);
const activityCellSizes: Record<ActivityRange, { size: string; gap: string }> = {
  28: { size: '1rem', gap: '0.375rem' },
  90: { size: '0.75rem', gap: '0.25rem' },
  365: { size: '0.5rem', gap: '0.1875rem' }
};

export function ActivityGraph({
  tasks,
  compact = false,
  fill = false,
  now = Date.now(),
  petId = 'aurelius',
  showPet = true,
  animateFlame = true,
  animatePet = true,
  clearedBefore
}: ActivityGraphProps) {
  const [activeDay, setActiveDay] = useState<ReturnType<typeof buildActivitySummary>['days'][number] | null>(
    null
  );
  const [rangeDays, setRangeDays] = useState<ActivityRange>(compact ? 28 : 90);
  const [petDetailsOpen, setPetDetailsOpen] = useState(false);
  const summary = useMemo(
    () => buildActivitySummary(tasks, { now, days: rangeDays, clearedBefore }),
    [tasks, now, rangeDays, clearedBefore]
  );
  const visibleActivity = summary.days;
  const maxScore = Math.max(1, ...visibleActivity.map((day) => day.score));
  const firstWeekday = visibleActivity[0]
    ? (new Date(`${visibleActivity[0].date}T00:00:00.000Z`).getUTCDay() + 6) % 7
    : 0;
  const nextMilestone =
    streakMilestones.find((milestone) => milestone > summary.currentStreak) || summary.currentStreak + 100;
  const milestoneRemaining = nextMilestone - summary.currentStreak;
  const cellDimensions = activityCellSizes[rangeDays];
  const heatmapStyle = {
    '--activity-cell-size': cellDimensions.size,
    '--activity-cell-gap': cellDimensions.gap
  } as CSSProperties;

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
        <span className="ui-muted-chip inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ui-success)]">
          {animateFlame && summary.currentStreak > 0 ? (
            <MajesticFlame />
          ) : (
            <Flame data-testid="streak-flame" data-animated="false" size={14} />
          )}{' '}
          {summary.currentStreak} day streak
        </span>
      </div>
      <div
        data-testid="activity-metrics"
        className="activity-metrics mb-3 grid grid-cols-3 gap-1.5 sm:mb-4 sm:gap-2"
      >
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
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Activity range"
          className="ui-control inline-flex shrink-0 rounded-lg p-0.5"
        >
          {activityRanges.map((range) => (
            <button
              key={range.days}
              type="button"
              aria-label={'Show ' + range.label}
              aria-pressed={rangeDays === range.days}
              onClick={() => {
                setRangeDays(range.days);
                setActiveDay(null);
              }}
              className={
                'ui-focus-ring min-h-7 rounded-md px-2 text-[11px] font-semibold transition-colors ' +
                (rangeDays === range.days
                  ? 'bg-[var(--ui-surface-raised)] text-[var(--ui-info)] shadow-sm'
                  : 'text-[var(--ui-text-secondary)]')
              }
            >
              {range.shortLabel}
            </button>
          ))}
        </div>
        <div
          data-testid="activity-intensity-legend"
          className="flex min-w-0 items-center gap-1 text-[10px] text-[var(--ui-text-secondary)]"
        >
          <span>Less</span>
          <span className="size-2 rounded-[2px] border border-[var(--ui-border-subtle)] bg-[var(--ui-control)]" />
          <span className="size-2 rounded-[2px] bg-emerald-200 dark:bg-emerald-900/40" />
          <span className="size-2 rounded-[2px] bg-emerald-400 dark:bg-emerald-600/80" />
          <span className="size-2 rounded-[2px] bg-emerald-500" />
          <span>More</span>
        </div>
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
        <div data-testid="activity-companion-row" className="flex min-w-0 items-end gap-3">
          {showPet && (
            <div className="relative shrink-0">
              <button
                type="button"
                data-testid="activity-pet-trigger"
                aria-label={'Show ' + petName(petId) + ' streak progress'}
                aria-expanded={petDetailsOpen}
                className="ui-focus-ring block rounded-lg"
                onFocus={() => setPetDetailsOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget))
                    setPetDetailsOpen(false);
                }}
                onClick={() => setPetDetailsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setPetDetailsOpen(false);
                    event.currentTarget.blur();
                  }
                }}
              >
                <ActivityPet
                  petId={petId}
                  streakActive={summary.currentStreak > 0}
                  activityScore={Math.min(100, (summary.days.at(-1)?.score || 0) * 20)}
                  animated={animatePet}
                />
              </button>
              {petDetailsOpen && (
                <div
                  role="status"
                  aria-label="Streak milestone"
                  className="ui-surface absolute bottom-full left-0 z-30 mb-2 w-48 rounded-lg border p-2.5 text-left shadow-lg"
                >
                  <div className="text-xs font-semibold text-[var(--ui-text-primary)]">
                    {petName(petId)} · {summary.currentStreak} day streak
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--ui-text-secondary)]">
                    {milestoneRemaining} {milestoneRemaining === 1 ? 'day' : 'days'} to {nextMilestone}-day
                    milestone
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Streak milestone progress"
                    aria-valuemin={0}
                    aria-valuemax={nextMilestone}
                    aria-valuenow={summary.currentStreak}
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ui-control)]"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--ui-success)]"
                      style={{ width: Math.min(100, (summary.currentStreak / nextMilestone) * 100) + '%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-1">
              <div
                data-testid="activity-weekdays"
                aria-hidden="true"
                className="activity-weekdays grid shrink-0 text-[9px] font-medium leading-none text-[var(--ui-text-secondary)]"
                style={heatmapStyle}
              >
                {weekdayLabels.map((label, index) => (
                  <span key={index} className="flex items-center justify-center">
                    {label}
                  </span>
                ))}
              </div>
              <div className="custom-scrollbar min-w-0 flex-1 overflow-x-auto">
                <div
                  className="activity-heatmap-grid grid w-max grid-flow-col"
                  data-testid="activity-days"
                  style={heatmapStyle}
                >
                  {Array.from({ length: firstWeekday }, (_, index) => (
                    <span key={'empty-' + index} aria-hidden="true" />
                  ))}
                  {visibleActivity.map((day) => (
                    <span
                      key={day.date}
                      role="img"
                      tabIndex={day.score > 0 ? 0 : -1}
                      aria-label={detailLabel(day)}
                      className={
                        'size-[var(--activity-cell-size)] rounded-[3px] transition-colors focus:outline-2 focus:outline-offset-1 focus:outline-[var(--ui-focus-ring)] ' +
                        getColorClass(day.score)
                      }
                      title={detailLabel(day)}
                      onMouseEnter={() => setActiveDay(day)}
                      onMouseLeave={() => setActiveDay(null)}
                      onFocus={() => setActiveDay(day)}
                      onBlur={() => setActiveDay(null)}
                    />
                  ))}
                </div>
              </div>
            </div>
            {summary.days.every((day) => day.score === 0) && (
              <div className="mt-1 text-right text-[10px] text-[var(--ui-text-secondary)]">
                No activity in this range
              </div>
            )}
          </div>
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
    <div
      className="activity-metric ui-control min-h-14 min-w-0 rounded-lg px-2 py-2 sm:rounded-xl sm:px-2.5"
      data-testid={testId}
    >
      <div className="flex items-center gap-1 truncate text-[10px] font-semibold uppercase text-[var(--ui-text-secondary)]">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-1 truncate font-mono text-sm font-bold tabular-nums text-[var(--ui-text-primary)]">
        {value}
      </div>
    </div>
  );
}
