import type { Project, Task, TimeLog } from './types';

const logDuration = (logs: TimeLog[], now: number) =>
  logs.reduce((total, log) => {
    const start = new Date(log.start).getTime();
    const end = log.end ? new Date(log.end).getTime() : now;
    return Number.isFinite(start) && Number.isFinite(end) ? total + Math.max(0, end - start) : total;
  }, 0);

export type ProjectSummary = Project & {
  tasks: Task[];
  nextTask: Task | null;
  completedItems: number;
  totalItems: number;
  progressPercent: number;
  trackedMs: number;
};

export const calculateProjectSummaries = (
  projects: Project[],
  tasks: Task[],
  now = Date.now()
): ProjectSummary[] => {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  return projects.map((project) => {
    const projectTasks = project.taskIds
      .map((id) => taskById.get(id))
      .filter((task): task is Task => Boolean(task));
    const completedItems =
      projectTasks.filter((task) => task.status === 'done').length +
      project.milestones.filter((milestone) => milestone.completed).length;
    const totalItems = projectTasks.length + project.milestones.length;
    const nextTask =
      projectTasks.find((task) => task.status === 'in-progress') ||
      projectTasks.find((task) => task.status === 'backlog') ||
      null;
    const trackedMs = projectTasks.reduce(
      (total, task) =>
        total +
        logDuration(task.logs || [], now) +
        (task.subtasks || []).reduce(
          (subtotal, subtask) => subtotal + logDuration(subtask.logs || [], now),
          0
        ),
      0
    );
    return {
      ...project,
      tasks: projectTasks,
      nextTask,
      completedItems,
      totalItems,
      progressPercent: totalItems ? Math.round((completedItems / totalItems) * 100) : 0,
      trackedMs
    };
  });
};
