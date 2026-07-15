import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { Task } from '../../domain/types';

interface ActivityGraphProps {
  tasks: Task[];
  compact?: boolean;
}

export function ActivityGraph({ tasks, compact = false }: ActivityGraphProps) {
  const activityData = useMemo(() => {
    const days = 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = new Map<string, number>();

    // Collect all task logs
    tasks.forEach((task) => {
      task.logs.forEach((log) => {
        if (log.start && log.end) {
          const date = new Date(log.start);
          const dateString = date.toISOString().split('T')[0];
          counts.set(dateString, (counts.get(dateString) || 0) + 1);
        }
      });
      // Also check completion dates as activity
      if (task.status === 'done' && task.activity.length > 0) {
        const lastActivity = task.activity[task.activity.length - 1];
        if (lastActivity) {
          const dateString = new Date(lastActivity.timestamp).toISOString().split('T')[0];
          counts.set(dateString, (counts.get(dateString) || 0) + 1);
        }
      }
    });

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      data.push({
        date: dateString,
        count: counts.get(dateString) || 0
      });
    }

    return data;
  }, [tasks]);

  const visibleActivity = compact ? activityData.slice(-28) : activityData;
  const maxCount = Math.max(1, ...visibleActivity.map((d) => d.count));

  const getColorClass = (count: number) => {
    if (count === 0) return 'border border-[var(--ui-border-subtle)] bg-[var(--ui-control)]';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40';
    if (intensity < 0.5) return 'bg-emerald-300 dark:bg-emerald-800/60';
    if (intensity < 0.75) return 'bg-emerald-400 dark:bg-emerald-600/80';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = activityData.length - 1; i >= 0; i--) {
      if (activityData[i].count > 0) {
        streak++;
      } else {
        // if today is 0, don't break streak yet
        if (i === activityData.length - 1) continue;
        break;
      }
    }
    return streak;
  }, [activityData]);

  return (
    <div className="ui-surface w-full rounded-2xl border p-4 shadow-sm sm:rounded-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold">Activity</h3>
        <span className="ui-muted-chip inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ui-success)]">
          <Flame size={14} /> {currentStreak} day streak
        </span>
      </div>
      <div
        className={
          compact ? 'grid grid-cols-[repeat(7,1rem)] justify-end gap-1.5' : 'flex flex-wrap justify-end gap-1'
        }
        data-testid="activity-days"
      >
        {visibleActivity.map((day, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-[3px] transition-colors ${getColorClass(day.count)}`}
            title={`${day.date}: ${day.count} activities`}
          />
        ))}
      </div>
    </div>
  );
}
