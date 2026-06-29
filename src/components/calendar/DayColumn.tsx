import React from 'react';
import type { Task } from '../../domain/types';
import { TimeSlot } from './TimeSlot';
import { CalendarTaskBlock } from './CalendarTaskBlock';
import { formatDateInputValue } from '../../domain/tasks';
import { getTasksForDate } from '../../domain/calendarView';

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  onDropTask: (taskId: string, date: string, time: string) => void;
  onSelectTask: (taskId: string) => void;
  now: number;
}

export const DayColumn: React.FC<DayColumnProps> = ({ date, tasks, onDropTask, onSelectTask, now }) => {
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
    >
      {/* Header */}
      <div
        className={`p-2 border-b border-slate-200 dark:border-slate-800 text-center shrink-0 ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
      >
        <div
          className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
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
      <div className="flex-1 relative h-[1440px] bg-white dark:bg-slate-900/40">
        {/* Time slots */}
        {slots.map((time) => (
          <TimeSlot key={time} time={time} date={dateStr} onDropTask={onDropTask} />
        ))}

        {/* Task Blocks */}
        {scheduledTasks.map((task) => (
          <CalendarTaskBlock key={task.id} task={task} onSelect={onSelectTask} />
        ))}

        {/* Red Current Time Line */}
        {isToday && (
          <div
            data-testid="calendar-now-line"
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
