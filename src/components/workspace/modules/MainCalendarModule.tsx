import { CalendarDays } from 'lucide-react';
import { activeTaskStatuses } from '../../../domain/taskStatus';
import { formatDateInputValue } from '../../../domain/dateTime';
import type { MainViewSlotId, Task } from '../../../domain/types';

export function MainCalendarModule({
  slot,
  tasks,
  now,
  onOpenCalendar,
  onOpenTask
}: {
  slot: MainViewSlotId;
  tasks: Task[];
  now: number;
  onOpenCalendar: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const today = formatDateInputValue(new Date(now));
  const scheduled = tasks
    .filter(
      (task) =>
        task.scheduledDate === today &&
        activeTaskStatuses.includes(task.status) &&
        Boolean(task.scheduledStart)
    )
    .sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart))
    .slice(0, 5);

  return (
    <section
      data-testid="main-calendar-module"
      data-slot={slot}
      className="ui-surface custom-scrollbar h-full min-h-0 overflow-y-auto rounded-[var(--ui-radius-panel)] border p-4 shadow-[var(--ui-shadow-sm)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="ui-eyebrow text-[var(--ui-info)]">Calendar</div>
          <h3 className="mt-1 text-sm font-semibold text-[var(--ui-text-primary)]">
            {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(
              now
            )}
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="ui-icon-button ui-control"
          aria-label="Open calendar view"
        >
          <CalendarDays size={16} />
        </button>
      </div>
      <div className="mt-3 space-y-1.5">
        {scheduled.length > 0 ? (
          scheduled.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask(task.id)}
              className="ui-control ui-focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
            >
              <span className="w-11 shrink-0 font-mono text-xs text-[var(--ui-info)]">
                {task.scheduledStart}
              </span>
              <span className="truncate text-sm font-medium">{task.title || 'Untitled task'}</span>
            </button>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--ui-border-subtle)] px-3 py-4 text-center text-xs text-[var(--ui-text-secondary)]">
            No scheduled focus blocks today.
          </p>
        )}
      </div>
    </section>
  );
}
