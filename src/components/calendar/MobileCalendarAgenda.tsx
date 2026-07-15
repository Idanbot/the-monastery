import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Inbox, Plus } from 'lucide-react';
import type { AppSettings, Task } from '../../domain/types';
import { formatDateInputValue, getEffectiveTags } from '../../domain/tasks';
import { formatClockTime, getTasksForDate, getUnscheduledTasks } from '../../domain/calendarView';
import { UrgencyBadge } from '../UrgencyBadge';

type Props = {
  currentDate: Date;
  tasks: Task[];
  now: number;
  clockFormat: AppSettings['clockFormat'];
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onSelectTask: (taskId: string) => void;
  onCreateTask: (date: string, time: string) => void;
  onAddUnscheduled: () => void;
};

const dateHeading = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);

export function MobileCalendarAgenda({
  currentDate,
  tasks,
  now,
  clockFormat,
  onPreviousDay,
  onNextDay,
  onToday,
  onSelectTask,
  onCreateTask,
  onAddUnscheduled
}: Props) {
  const [activeTab, setActiveTab] = useState<'agenda' | 'unscheduled'>('agenda');
  const date = formatDateInputValue(currentDate);
  const scheduledTasks = [...getTasksForDate(tasks, date)].sort((left, right) =>
    left.scheduledStart.localeCompare(right.scheduledStart)
  );
  const unscheduledTasks = getUnscheduledTasks(tasks);
  const currentHour = new Date(now).getHours();
  const suggestedHour =
    date === formatDateInputValue(new Date(now)) ? Math.min(23, Math.max(9, currentHour + 1)) : 9;
  const suggestedStart = `${String(suggestedHour).padStart(2, '0')}:00`;
  const visibleCount = activeTab === 'agenda' ? scheduledTasks.length : unscheduledTasks.length;

  return (
    <section
      data-testid="mobile-calendar-agenda"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden sm:hidden"
    >
      <header className="shrink-0 px-1 pb-3 pt-1">
        <div className="ui-eyebrow">Schedule</div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight text-[var(--ui-text-primary)]">
              {dateHeading(currentDate)}
            </h1>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
              {visibleCount}{' '}
              {activeTab === 'agenda'
                ? visibleCount === 1
                  ? 'scheduled task'
                  : 'scheduled tasks'
                : visibleCount === 1
                  ? 'unscheduled task'
                  : 'unscheduled tasks'}
            </p>
          </div>
          <CalendarDays size={22} className="mt-1 shrink-0 text-[var(--ui-info)]" />
        </div>

        <div className="mt-3 grid grid-cols-[3rem_1fr_3rem] gap-2" aria-label="Choose calendar day">
          <button
            type="button"
            aria-label="Previous day"
            onClick={onPreviousDay}
            className="ui-control ui-focus-ring flex min-h-12 items-center justify-center rounded-xl"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="ui-control ui-focus-ring min-h-12 rounded-xl px-4 text-sm font-semibold"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next day"
            onClick={onNextDay}
            className="ui-control ui-focus-ring flex min-h-12 items-center justify-center rounded-xl"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Calendar tasks"
          className="ui-control mt-2 grid grid-cols-2 gap-1 rounded-xl p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'agenda'}
            aria-label={`Agenda, ${scheduledTasks.length} ${scheduledTasks.length === 1 ? 'task' : 'tasks'}`}
            onClick={() => setActiveTab('agenda')}
            className={`ui-focus-ring min-h-11 rounded-lg px-3 text-sm font-semibold ${
              activeTab === 'agenda'
                ? 'bg-[var(--ui-surface-raised)] text-[var(--ui-info)] shadow-sm'
                : 'text-[var(--ui-text-secondary)]'
            }`}
          >
            Agenda <span className="ml-1 opacity-70">{scheduledTasks.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'unscheduled'}
            aria-label={`Unscheduled, ${unscheduledTasks.length} ${unscheduledTasks.length === 1 ? 'task' : 'tasks'}`}
            onClick={() => setActiveTab('unscheduled')}
            className={`ui-focus-ring min-h-11 rounded-lg px-3 text-sm font-semibold ${
              activeTab === 'unscheduled'
                ? 'bg-[var(--ui-surface-raised)] text-[var(--ui-info)] shadow-sm'
                : 'text-[var(--ui-text-secondary)]'
            }`}
          >
            Unscheduled <span className="ml-1 opacity-70">{unscheduledTasks.length}</span>
          </button>
        </div>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-3">
        {activeTab === 'agenda' ? (
          <div className="space-y-2">
            {scheduledTasks.map((task) => {
              const tags = getEffectiveTags(task);
              return (
                <button
                  key={task.id}
                  type="button"
                  aria-label={`Open scheduled task ${task.title || 'Untitled task'}`}
                  onClick={() => onSelectTask(task.id)}
                  className="ui-surface ui-focus-ring grid min-h-20 w-full grid-cols-[4.75rem_1fr] gap-3 rounded-2xl border p-3 text-left shadow-sm active:brightness-95"
                >
                  <span className="flex flex-col border-r border-[var(--ui-border-subtle)] pr-3">
                    <span className="text-base font-semibold tabular-nums text-[var(--ui-text-primary)]">
                      {formatClockTime(task.scheduledStart, clockFormat)}
                    </span>
                    {task.scheduledEnd && (
                      <span className="mt-0.5 text-xs tabular-nums text-[var(--ui-text-secondary)]">
                        {formatClockTime(task.scheduledEnd, clockFormat)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold leading-snug text-[var(--ui-text-primary)]">
                      {task.title || 'Untitled task'}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <UrgencyBadge urgency={task.urgency} />
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="task-tag max-w-28 truncate rounded-md px-2 py-0.5 text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}

            {scheduledTasks.length === 0 && (
              <div className="ui-surface flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
                <Clock3 size={24} className="text-[var(--ui-text-secondary)]" />
                <h2 className="mt-3 text-base font-semibold">Your day is open</h2>
                <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Schedule one focused block.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {unscheduledTasks.map((task) => {
              const tags = getEffectiveTags(task);
              return (
                <button
                  key={task.id}
                  type="button"
                  aria-label={`Open unscheduled task ${task.title || 'Untitled task'}`}
                  onClick={() => onSelectTask(task.id)}
                  className="ui-surface ui-focus-ring flex min-h-18 w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-sm active:brightness-95"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ui-control)] text-[var(--ui-info)]">
                    <Inbox size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold leading-snug text-[var(--ui-text-primary)]">
                      {task.title || 'Untitled task'}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <UrgencyBadge urgency={task.urgency} />
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="task-tag max-w-28 truncate rounded-md px-2 py-0.5 text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}
            {unscheduledTasks.length === 0 && (
              <div className="ui-surface flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
                <Inbox size={24} className="text-[var(--ui-text-secondary)]" />
                <h2 className="mt-3 text-base font-semibold">Nothing waiting</h2>
                <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">Every active task has a time.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label={activeTab === 'agenda' ? 'Schedule task' : 'Add unscheduled task'}
        onClick={() => (activeTab === 'agenda' ? onCreateTask(date, suggestedStart) : onAddUnscheduled())}
        className="ui-accent-button ui-focus-ring mb-1 flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold"
      >
        <Plus size={19} /> {activeTab === 'agenda' ? 'Schedule task' : 'Add task'}
      </button>
    </section>
  );
}
