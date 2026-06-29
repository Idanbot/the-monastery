import { useEffect } from 'react';
import type { Task } from '../domain/types';

type Options = {
  filteredTasks: Task[];
  isCommandOpen: boolean;
  selectedTaskId: string | null;
  keyboardFocusedTaskId: string | null;
  setKeyboardFocusedTaskId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  toggleCommandPalette: () => void;
  closeCommandPalette: () => void;
  addBacklogTask: () => void;
  startFocusTask: () => void;
  planDay: () => void;
  showAnalytics: () => void;
  showBoard: () => void;
  showShortcuts: () => void;
  toggleMonkMode: () => void;
  showList: () => void;
};

export function useAppShortcuts(options: Options) {
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        options.toggleCommandPalette();
        return;
      }

      if ((options.isCommandOpen || options.selectedTaskId) && event.key === 'Escape') {
        options.closeCommandPalette();
      }
      if (isTyping || options.isCommandOpen || options.selectedTaskId) return;

      if (['j', 'k', 'Enter'].includes(event.key)) {
        if (options.filteredTasks.length === 0) return;
        event.preventDefault();
        const currentIndex = Math.max(
          0,
          options.filteredTasks.findIndex((task) => task.id === options.keyboardFocusedTaskId)
        );
        if (event.key === 'Enter') {
          options.setSelectedTaskId(options.filteredTasks[currentIndex]?.id || options.filteredTasks[0].id);
          return;
        }
        const direction = event.key === 'j' ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + options.filteredTasks.length) % options.filteredTasks.length;
        options.setKeyboardFocusedTaskId(options.filteredTasks[nextIndex].id);
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'n') options.addBacklogTask();
      else if (key === 'f') options.startFocusTask();
      else if (key === 'p') options.planDay();
      else if (key === 'd') options.showAnalytics();
      else if (key === 'b') options.showBoard();
      else if (event.key === '?') options.showShortcuts();
      else if (key === 'm') options.toggleMonkMode();
      else if (event.key === '/') options.showList();
      else return;
      event.preventDefault();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [options]);
}
