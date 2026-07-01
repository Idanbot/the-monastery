import React, { useState, useCallback } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import { CalendarHeader } from './CalendarHeader';
import { DayColumn } from './DayColumn';
import { UnscheduledSidebar } from './UnscheduledSidebar';
import { formatTime } from '../../domain/tasks';
import { getWeekDates, clockTimeToMinutes, minutesToClockTime } from '../../domain/calendarView';

export const CalendarView: React.FC = () => {
  const { settings } = useSettingsContext();
  const { tasks, setTasks, setSelectedTaskId, addTask } = useTaskContext();
  const { now } = useUIContext();

  const [currentDate, setCurrentDate] = useState(() => new Date(now));
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const weekDates = getWeekDates(currentDate);
  const displayDates = viewMode === 'week' ? weekDates : [currentDate];

  const handleDropTask = useCallback(
    (taskId: string, date: string, time: string) => {
      setTasks((previous) =>
        previous.map((task) => {
          if (task.id !== taskId) return task;

          let duration = 60;
          if (task.scheduledStart && task.scheduledEnd) {
            const start = clockTimeToMinutes(task.scheduledStart);
            const end = clockTimeToMinutes(task.scheduledEnd);
            duration = Math.max(15, end - start);
          }

          const startMinutes = clockTimeToMinutes(time);
          const endMinutes = startMinutes + duration;

          return {
            ...task,
            scheduledDate: date,
            scheduledStart: time,
            scheduledEnd: minutesToClockTime(endMinutes)
          };
        })
      );
    },
    [setTasks]
  );

  const handleAddUnscheduled = () => {
    addTask('backlog', {
      title: '',
      urgency: 5,
      scheduledDate: '',
      scheduledStart: '',
      scheduledEnd: ''
    });
  };

  const handleCreateScheduledTask = (date: string, time: string) => {
    const startMinutes = clockTimeToMinutes(time);
    addTask(
      'backlog',
      {
        title: '',
        scheduledDate: date,
        scheduledStart: time,
        scheduledEnd: minutesToClockTime(startMinutes + 60)
      },
      (task) => setSelectedTaskId(task.id)
    );
  };

  return (
    <div
      className="flex-1 min-h-0 flex flex-col md:flex-row rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-sm overflow-hidden"
      data-testid="calendar-view"
    >
      {/* Left Main View (Header + Calendar Grid) */}
      <div className="flex-1 flex flex-col p-4 min-w-0">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Calendar Scroll Area */}
        <div
          data-testid="calendar-scroll-area"
          role="region"
          aria-label="Calendar schedule"
          className="flex-1 overflow-auto relative flex border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 custom-scrollbar"
        >
          {/* Side Time Ruler */}
          <div className="sticky left-0 z-30 w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 select-none">
            <div className="h-14 border-b border-slate-200 dark:border-slate-800" aria-hidden="true" />
            <div data-testid="calendar-time-ruler" className="relative h-[1440px] shrink-0">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  data-testid="calendar-hour-label"
                  className={`absolute right-0 pr-2 text-[10px] font-medium text-slate-700 dark:text-slate-200 ${i === 0 ? 'translate-y-0' : '-translate-y-1/2'}`}
                  style={{ top: `${i * 60}px` }}
                >
                  {formatTime(new Date(new Date().setHours(i, 0, 0, 0)), settings.clockFormat)}
                </div>
              ))}
            </div>
          </div>

          {/* Day Columns View Container */}
          <div className="flex flex-1 min-w-0">
            {displayDates.map((date, index) => (
              <DayColumn
                key={date.toISOString()}
                date={date}
                tasks={tasks}
                onDropTask={handleDropTask}
                onCreateTask={handleCreateScheduledTask}
                onSelectTask={setSelectedTaskId}
                now={now}
                clockFormat={settings.clockFormat}
                initialTabStop={index === 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Unscheduled Tasks Sidebar */}
      <UnscheduledSidebar tasks={tasks} onAddTask={handleAddUnscheduled} onSelectTask={setSelectedTaskId} />
    </div>
  );
};
export default CalendarView;
