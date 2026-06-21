import { useMemo } from 'react';
import { Task } from '../../domain/types';

interface ActivityGraphProps {
  tasks: Task[];
}

export function ActivityGraph({ tasks }: ActivityGraphProps) {
  const activityData = useMemo(() => {
    const days = 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = new Map<string, number>();

    // Collect all task logs
    tasks.forEach(task => {
      task.logs.forEach(log => {
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

  const maxCount = Math.max(1, ...activityData.map(d => d.count));

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/50';
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
    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold">Activity</h3>
        <span className="text-sm font-medium px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400">
          {currentStreak} Day Streak 🔥
        </span>
      </div>
      <div className="flex gap-[3px] flex-wrap justify-end">
        {activityData.map((day, i) => (
          <div
            key={i}
            className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] transition-colors ${getColorClass(day.count)}`}
            title={`${day.date}: ${day.count} activities`}
          />
        ))}
      </div>
    </div>
  );
}
