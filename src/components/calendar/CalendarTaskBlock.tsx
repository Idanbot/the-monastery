import React from 'react';
import type { Task } from '../../domain/types';
import { UrgencyBadge } from '../UrgencyBadge';

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

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    window.sessionStorage.setItem('the-monastery-dragged-task-id', task.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task.id)}
      className="absolute left-1 right-1 rounded-lg p-2 text-xs cursor-grab active:cursor-grabbing overflow-hidden border transition-all shadow-sm hover:z-30 hover:shadow-md bg-white/95 dark:bg-slate-800/95 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 select-none flex flex-col justify-between"
      style={{ top: `${top}px`, height: `${duration}px` }}
      data-testid={`calendar-task-${task.title || 'Untitled'}`}
    >
      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
        {task.title || 'Untitled'}
      </div>

      {duration >= 45 && (
        <div className="flex items-center justify-between gap-2 mt-1">
          <UrgencyBadge urgency={task.urgency} />
          {task.tags && task.tags.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 truncate max-w-[50%]">
              {task.tags[0]}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
