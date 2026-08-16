import { taskStatusIds } from '../../shared/settingsContract';
import type { TaskStatus } from './types';

export const validStatuses: TaskStatus[] = [...taskStatusIds];
export const taskStatuses = validStatuses;
export const activeTaskStatuses: TaskStatus[] = ['in-progress'];
export const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In-Progress',
  done: 'Done',
  rejected: 'Rejected'
};

export const defaultBoardColumnOrder = {
  compactActive: ['backlog', 'in-progress'] as TaskStatus[],
  compactDone: ['done', 'rejected'] as TaskStatus[],
  threeColumn: [...validStatuses],
  full: [...validStatuses]
};

export const normalizeBoardColumnOrder = (saved) => {
  const normalizeOrder = (value, fallback: TaskStatus[]) => {
    const order = Array.isArray(value) ? value.filter((status) => validStatuses.includes(status)) : [];
    return [...new Set([...order, ...fallback])] as TaskStatus[];
  };

  return {
    compactActive: normalizeOrder(saved?.compactActive, defaultBoardColumnOrder.compactActive).filter(
      (status) => defaultBoardColumnOrder.compactActive.includes(status)
    ),
    compactDone: normalizeOrder(saved?.compactDone, defaultBoardColumnOrder.compactDone).filter((status) =>
      defaultBoardColumnOrder.compactDone.includes(status)
    ),
    threeColumn: normalizeOrder(saved?.threeColumn, defaultBoardColumnOrder.threeColumn).slice(0, 4),
    full: normalizeOrder(saved?.full, defaultBoardColumnOrder.full).slice(0, 4)
  };
};

export const normalizeTaskStatus = (status): TaskStatus => {
  if (status === 'new') return 'backlog';
  return validStatuses.includes(status) ? status : 'backlog';
};
