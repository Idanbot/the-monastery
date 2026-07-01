import React from 'react';
import { Plus } from 'lucide-react';
import type { Task } from '../../domain/types';
import { UrgencyBadge } from '../UrgencyBadge';
import { getUnscheduledTasks } from '../../domain/calendarView';

interface UnscheduledSidebarProps {
  tasks: Task[];
  onAddTask: () => void;
  onSelectTask: (taskId: string) => void;
}

export const UnscheduledSidebar: React.FC<UnscheduledSidebarProps> = ({ tasks, onAddTask, onSelectTask }) => {
  const unscheduled = getUnscheduledTasks(tasks);

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, taskId: string) => {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
    window.sessionStorage.setItem('the-monastery-dragged-task-id', taskId);
  };

  return (
    <aside
      className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden"
      data-testid="unscheduled-sidebar"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white">Unscheduled</h3>
        <button
          onClick={onAddTask}
          aria-label="Add unscheduled task"
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto p-3 space-y-2">
        {unscheduled.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
            No unscheduled tasks
          </div>
        ) : (
          unscheduled.map((task) => (
            <button
              type="button"
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onClick={() => onSelectTask(task.id)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors shadow-sm text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              data-testid={`unscheduled-task-${task.title || 'Untitled'}`}
            >
              <div className="font-medium text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
                {task.title || 'Untitled'}
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <UrgencyBadge urgency={task.urgency} />
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-w-[70%]">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 truncate"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-[9px] text-slate-400">+{task.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
