import { useEffect, useRef } from 'react';
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
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const current = optionsRef.current;
      const target = event.target;
      const isInteractive =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        current.toggleCommandPalette();
        return;
      }

      if ((current.isCommandOpen || current.selectedTaskId) && event.key === 'Escape') {
        current.closeCommandPalette();
      }
      if (isInteractive || current.isCommandOpen || current.selectedTaskId) return;

      if (['j', 'k', 'Enter'].includes(event.key)) {
        if (current.filteredTasks.length === 0) return;
        event.preventDefault();
        const currentIndex = Math.max(
          0,
          current.filteredTasks.findIndex((task) => task.id === current.keyboardFocusedTaskId)
        );
        if (event.key === 'Enter') {
          current.setSelectedTaskId(current.filteredTasks[currentIndex]?.id || current.filteredTasks[0].id);
          return;
        }
        const direction = event.key === 'j' ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + current.filteredTasks.length) % current.filteredTasks.length;
        current.setKeyboardFocusedTaskId(current.filteredTasks[nextIndex].id);
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'n') current.addBacklogTask();
      else if (key === 'f') current.startFocusTask();
      else if (key === 'p') current.planDay();
      else if (key === 'd') current.showAnalytics();
      else if (key === 'b') current.showBoard();
      else if (event.key === '?') current.showShortcuts();
      else if (key === 'm') current.toggleMonkMode();
      else if (event.key === '/') current.showList();
      else return;
      event.preventDefault();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
}
