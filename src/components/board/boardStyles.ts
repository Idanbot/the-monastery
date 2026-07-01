import type { TaskStatus } from '../../domain/types';

export const statusColorClass = (status: TaskStatus) =>
  status === 'backlog'
    ? 'bg-indigo-500'
    : status === 'in-progress'
      ? 'bg-sky-500'
      : status === 'done'
        ? 'bg-emerald-500'
        : 'bg-rose-500';
