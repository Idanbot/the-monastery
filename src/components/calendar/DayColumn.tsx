import React from 'react';
import type { AppSettings, Task } from '../../domain/types';
import { TimeSlot } from './TimeSlot';
import { CalendarTaskBlock } from './CalendarTaskBlock';
import { formatDateInputValue } from '../../domain/tasks';
import { getTasksForDate } from '../../domain/calendarView';

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  onDropTask: (taskId: string, date: string, time: string) => void;
  onCreateTask: (date: string, time: string) => void;
  onSelectTask: (taskId: string) => void;
  now: number;
  clockFormat: AppSettings['clockFormat'];
  initialTabStop?: boolean;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  tasks,
  onDropTask,
  onCreateTask,
  onSelectTask,
  now,
  clockFormat,
  initialTabStop = false
}) => {
  const dateStr = formatDateInputValue(date);
  const scheduledTasks = getTasksForDate(tasks, dateStr);

  const todayStr = formatDateInputValue(new Date(now));
  const isToday = dateStr === todayStr;

  const nowObj = new Date(now);
  const currentMinutes = nowObj.getHours() * 60 + nowObj.getMinutes();

  const slots = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
  });

  return (
    <div
      className="flex-1 min-w-[120px] flex flex-col border-r border-slate-200 dark:border-slate-800 last:border-r-0"
      data-testid={`day-column-${dateStr}`}
      role="group"
      aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      {/* Header */}
      <div
        className={`h-14 p-1.5 border-b border-slate-200 dark:border-slate-800 text-center shrink-0 ${isToday ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
      >
        <div
          className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}
        >
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div
          className={`text-base font-extrabold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}
        >
          {date.getDate()}
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative h-[1440px] shrink-0 bg-white dark:bg-slate-900/40">
        {/* Time slots */}
        {slots.map((time) => (
          <TimeSlot
            key={time}
            time={time}
            date={dateStr}
            onDropTask={onDropTask}
            onActivate={onCreateTask}
            clockFormat={clockFormat}
            initialTabStop={initialTabStop && time === '00:00'}
          />
        ))}

        {/* Task Blocks */}
        {scheduledTasks.map((task) => (
          <CalendarTaskBlock key={task.id} task={task} onSelect={onSelectTask} clockFormat={clockFormat} />
        ))}

        {/* Red Current Time Line */}
        {isToday && (
          <div
            data-testid="calendar-now-line"
            aria-hidden="true"
            className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
            style={{ top: `${currentMinutes}px` }}
          >
            <div className="w-full h-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
          </div>
        )}
      </div>
    </div>
  );
};
