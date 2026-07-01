import React from 'react';
import type { Task } from '../../domain/types';

interface CalendarTaskBlockProps {
  task: Task;
  onSelect: (taskId: string) => void;
}

export const CalendarTaskBlock: React.FC<CalendarTaskBlockProps> = ({ task, onSelect }) => {
  const [startH, startM] = task.scheduledStart.split(':').map(Number);
  const top = (startH || 0) * 60 + (startM || 0);

  let duration = 60;
  if (task.scheduledEnd) {
    const [endH, endM] = task.scheduledEnd.split(':').map(Number);
    duration = Math.max(15, (endH || 0) * 60 + (endM || 0) - top);
  }

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    window.sessionStorage.setItem('the-monastery-dragged-task-id', task.id);
  };

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task.id)}
      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 text-left text-xs cursor-grab active:cursor-grabbing overflow-hidden border transition-all shadow-sm hover:z-30 hover:shadow-md bg-white/95 dark:bg-slate-800/95 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 select-none focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      style={{ top: `${top}px`, height: `${duration}px` }}
      data-testid={`calendar-task-${task.title || 'Untitled'}`}
      title={task.title || 'Untitled'}
      aria-label={`${task.title || 'Untitled task'}, ${task.scheduledDate} from ${task.scheduledStart}${task.scheduledEnd ? ` to ${task.scheduledEnd}` : ''}`}
    >
      <div className="font-semibold leading-snug text-slate-800 dark:text-slate-200 line-clamp-3 break-words">
        {task.title || 'Untitled'}
      </div>
    </button>
  );
};
