import React, { useState } from 'react';

interface TimeSlotProps {
  time: string;
  date: string;
  onDropTask: (taskId: string, date: string, time: string) => void;
  onActivate: (date: string, time: string) => void;
  initialTabStop?: boolean;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  time,
  date,
  onDropTask,
  onActivate,
  initialTabStop = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const taskId =
      event.dataTransfer.getData('text/plain') ||
      window.sessionStorage.getItem('the-monastery-dragged-task-id') ||
      '';
    window.sessionStorage.removeItem('the-monastery-dragged-task-id');
    if (taskId) {
      onDropTask(taskId, date, time);
    }
  };

  // Show a subtle horizontal line for hour/half-hour markers
  const isHour = time.endsWith(':00');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const slots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-calendar-slot="true"]'));
    const dates = Array.from(new Set(slots.map((slot) => slot.dataset.date || '')));
    const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    let targetDate = date;
    let targetMinutes = minutes;

    if (event.key === 'ArrowUp') targetMinutes = Math.max(0, minutes - 30);
    if (event.key === 'ArrowDown') targetMinutes = Math.min(23 * 60 + 30, minutes + 30);
    if (event.key === 'Home') targetMinutes = 0;
    if (event.key === 'End') targetMinutes = 23 * 60 + 30;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const offset = event.key === 'ArrowLeft' ? -1 : 1;
      targetDate = dates[Math.max(0, Math.min(dates.length - 1, dates.indexOf(date) + offset))] || date;
    }

    const targetTime = `${String(Math.floor(targetMinutes / 60)).padStart(2, '0')}:${String(targetMinutes % 60).padStart(2, '0')}`;
    const target = slots.find((slot) => slot.dataset.date === targetDate && slot.dataset.time === targetTime);
    if (!target || target === event.currentTarget) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <button
      type="button"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onActivate(date, time)}
      onKeyDown={handleKeyDown}
      tabIndex={initialTabStop ? 0 : -1}
      aria-label={`${date} at ${time}, create task`}
      data-calendar-slot="true"
      data-date={date}
      data-time={time}
      className={`h-[30px] w-full border-t border-slate-200/40 dark:border-slate-800/40 transition-colors focus-visible:relative focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
        isDragOver
          ? 'bg-indigo-500/10 dark:bg-indigo-500/20'
          : isHour
            ? 'border-t-slate-300 dark:border-t-slate-700'
            : ''
      }`}
      data-testid={`time-slot-${date}-${time}`}
    />
  );
};
