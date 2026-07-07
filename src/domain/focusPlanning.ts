import type { RoleDefinition, Task } from './types';
import { getEffectiveTags } from './tasks';

export type FocusPlanSuggestion = {
  taskId: string;
  title: string;
  status: Task['status'];
  urgency: number;
  tags: string[];
  roleNames: string[];
  estimatedMinutes: number;
  scheduledStart: string;
  scheduledEnd: string;
};

export type FocusPlan = {
  date: string;
  startMinutes: number;
  endMinutes: number;
  availableMinutes: number;
  totalEstimatedMinutes: number;
  overCapacityMinutes: number;
  suggestions: FocusPlanSuggestion[];
  roleCounts: Record<string, number>;
  warnings: string[];
};

type FocusPlanOptions = {
  date: string;
  startMinutes: number;
  endMinutes?: number;
  maxTasks?: number;
  tasks: Task[];
  roles?: RoleDefinition[];
};

const clockTime = (minutes: number) => {
  const clamped = Math.max(0, Math.min(1439, minutes));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

const estimateTaskMinutes = (task: Task) => {
  const subtaskBoost = Math.min(45, (task.subtasks || []).length * 15);
  const urgencyBoost = task.urgency >= 8 ? 15 : 0;
  return Math.min(120, Math.max(30, 45 + subtaskBoost + urgencyBoost));
};

const taskRoleNames = (task: Task, roles: RoleDefinition[]) => {
  const tags = new Set(getEffectiveTags(task).map((tag) => tag.toLowerCase()));
  return roles
    .filter((role) => (role.tags || []).some((tag) => tags.has(tag.toLowerCase())))
    .map((role) => role.name);
};

export const buildFocusPlan = ({
  tasks,
  roles = [],
  date,
  startMinutes,
  endMinutes = 17 * 60,
  maxTasks = 5
}: FocusPlanOptions): FocusPlan => {
  const normalizedStart = Math.max(0, Math.min(23 * 60, startMinutes));
  const normalizedEnd = Math.max(normalizedStart, Math.min(24 * 60, endMinutes));
  const availableMinutes = Math.max(0, normalizedEnd - normalizedStart);

  const candidates = tasks
    .filter((task) => ['backlog', 'in-progress'].includes(task.status))
    .filter((task) => !task.scheduledDate || task.scheduledDate === date)
    .filter((task) => !task.scheduledStart)
    .sort(
      (left, right) =>
        (left.status === 'in-progress' ? 0 : 1) - (right.status === 'in-progress' ? 0 : 1) ||
        right.urgency - left.urgency ||
        left.createdAt.localeCompare(right.createdAt)
    )
    .slice(0, Math.max(1, maxTasks));

  let cursor = normalizedStart;
  const roleCounts: Record<string, number> = {};
  const suggestions = candidates.map((task) => {
    const estimatedMinutes = estimateTaskMinutes(task);
    const roleNames = taskRoleNames(task, roles);
    roleNames.forEach((roleName) => {
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });
    const scheduledStart = clockTime(cursor);
    cursor += estimatedMinutes;
    const scheduledEnd = clockTime(cursor);
    cursor += 15;
    return {
      taskId: task.id,
      title: task.title || 'Untitled task',
      status: task.status,
      urgency: task.urgency,
      tags: getEffectiveTags(task),
      roleNames,
      estimatedMinutes,
      scheduledStart,
      scheduledEnd
    };
  });

  const totalEstimatedMinutes = suggestions.reduce(
    (total, suggestion) => total + suggestion.estimatedMinutes,
    0
  );
  const overCapacityMinutes = Math.max(0, totalEstimatedMinutes - availableMinutes);
  const warnings = [
    suggestions.length === 0 ? 'No backlog or in-progress tasks are ready to plan.' : '',
    overCapacityMinutes > 0
      ? `Planned focus exceeds available time by ${overCapacityMinutes}m. Trim scope before starting.`
      : '',
    suggestions.length > 4 ? 'More than 4 focus tasks can create context switching.' : ''
  ].filter(Boolean);

  return {
    date,
    startMinutes: normalizedStart,
    endMinutes: normalizedEnd,
    availableMinutes,
    totalEstimatedMinutes,
    overCapacityMinutes,
    suggestions,
    roleCounts,
    warnings
  };
};
