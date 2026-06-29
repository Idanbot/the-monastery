import React, { useState } from 'react';

interface TimeSlotProps {
  time: string;
  date: string;
  onDropTask: (taskId: string, date: string, time: string) => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ time, date, onDropTask }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-[30px] w-full border-t border-slate-200/40 dark:border-slate-800/40 transition-colors ${
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
