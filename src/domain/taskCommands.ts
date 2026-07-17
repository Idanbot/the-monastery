import type { ActivityKind, Task, TaskStatus } from './types';
import { generateId } from './tasks';

type CommandOptions = { now?: string; ids?: () => string };

export type TaskCommand =
  | { type: 'create'; task: Task }
  | { type: 'delete'; taskId: string }
  | { type: 'start'; taskId: string }
  | { type: 'toggle-timer'; taskId: string }
  | { type: 'move'; taskId: string; status: TaskStatus }
  | { type: 'complete'; taskId: string; promoteNext?: boolean }
  | { type: 'plan-day'; date: string; startMinutes: number }
  | { type: 'apply-focus-plan'; date: string; taskIds: string[]; startMinutes: number; slotMinutes?: number }
  | { type: 'record-focus'; taskId: string; minutes: number };

export type TaskCommandEffect = { type: 'task-promoted'; taskId: string };

const activity = (text: string, timestamp: string, ids: () => string, kind?: ActivityKind) => ({
  id: ids(),
  type: 'system' as const,
  ...(kind ? { kind } : {}),
  text,
  timestamp
});

const stopTimer = (task: Task, timestamp: string, ids: () => string, label = 'Timer stopped'): Task => {
  if (!task.activeLogStart) return task;
  return {
    ...task,
    activeLogStart: null,
    logs: [...task.logs, { start: task.activeLogStart, end: timestamp }],
    activity: [...task.activity, activity(label, timestamp, ids)]
  };
};

const clockTime = (minutes: number) => {
  const clamped = Math.max(0, Math.min(1439, minutes));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

export const executeTaskCommand = (
  tasks: Task[],
  command: TaskCommand,
  options: CommandOptions = {}
): { tasks: Task[]; effects: TaskCommandEffect[] } => {
  const timestamp = options.now || new Date().toISOString();
  const ids = options.ids || generateId;
  const effects: TaskCommandEffect[] = [];

  if (command.type === 'create') return { tasks: [command.task, ...tasks], effects };
  if (command.type === 'delete') {
    return { tasks: tasks.filter((task) => task.id !== command.taskId), effects };
  }

  if (command.type === 'toggle-timer') {
    return {
      effects,
      tasks: tasks.map((task) => {
        if (task.id !== command.taskId) return stopTimer(task, timestamp, ids);
        if (task.activeLogStart) return stopTimer(task, timestamp, ids);
        return {
          ...task,
          activeLogStart: timestamp,
          activity: [...task.activity, activity('Timer started', timestamp, ids)]
        };
      })
    };
  }

  if (command.type === 'start') {
    return {
      effects,
      tasks: tasks.map((task) => {
        if (task.id !== command.taskId) return stopTimer(task, timestamp, ids);
        if (task.status === 'done' || task.status === 'rejected') return task;
        return {
          ...task,
          status: 'in-progress',
          activeLogStart: task.activeLogStart || timestamp,
          activity: [
            ...task.activity,
            activity(task.status === 'backlog' ? 'Started from Backlog' : 'Timer started', timestamp, ids)
          ]
        };
      })
    };
  }

  if (command.type === 'move') {
    return {
      effects,
      tasks: tasks.map((task) => {
        if (task.id !== command.taskId || task.status === command.status) return task;
        const moved =
          command.status === 'done' || command.status === 'rejected' ? stopTimer(task, timestamp, ids) : task;
        return {
          ...moved,
          status: command.status,
          activity: [
            ...moved.activity,
            activity(
              `Status changed to ${command.status}`,
              timestamp,
              ids,
              command.status === 'done' ? 'task-completed' : undefined
            )
          ]
        };
      })
    };
  }

  if (command.type === 'complete') {
    const next = command.promoteNext
      ? [...tasks]
          .filter((task) => task.id !== command.taskId && task.status === 'backlog')
          .sort(
            (left, right) => right.urgency - left.urgency || left.createdAt.localeCompare(right.createdAt)
          )[0]
      : undefined;
    if (next) effects.push({ type: 'task-promoted', taskId: next.id });

    return {
      effects,
      tasks: tasks.map((task) => {
        if (task.id === command.taskId) {
          const stopped = stopTimer(task, timestamp, ids);
          return {
            ...stopped,
            status: 'done',
            activity: [...stopped.activity, activity('Marked done', timestamp, ids, 'task-completed')]
          };
        }
        if (task.id === next?.id) {
          return {
            ...task,
            status: 'in-progress',
            activity: [...task.activity, activity('Promoted to In-Progress', timestamp, ids)]
          };
        }
        return task;
      })
    };
  }

  if (command.type === 'plan-day') {
    let slot = command.startMinutes;
    return {
      effects,
      tasks: tasks.map((task) => {
        if (task.status !== 'in-progress' || (task.scheduledDate && task.scheduledStart)) return task;
        const start = Math.min(slot, 22 * 60);
        slot = start + 60;
        return {
          ...task,
          scheduledDate: command.date,
          scheduledStart: clockTime(start),
          scheduledEnd: clockTime(start + 45),
          activity: [...task.activity, activity('Planned into today', timestamp, ids)]
        };
      })
    };
  }

  if (command.type === 'apply-focus-plan') {
    let slot = command.startMinutes;
    const slotMinutes = command.slotMinutes || 45;
    const selected = new Set(command.taskIds);
    return {
      effects,
      tasks: tasks.map((task) => {
        if (!selected.has(task.id) || !['backlog', 'in-progress'].includes(task.status)) return task;
        const start = Math.min(slot, 23 * 60);
        slot = start + slotMinutes + 15;
        return {
          ...task,
          status: 'in-progress',
          scheduledDate: command.date,
          scheduledStart: clockTime(start),
          scheduledEnd: clockTime(start + slotMinutes),
          activity: [...task.activity, activity('Added to focus plan', timestamp, ids)]
        };
      })
    };
  }

  const start = new Date(new Date(timestamp).getTime() - command.minutes * 60_000).toISOString();
  return {
    effects,
    tasks: tasks.map((task) =>
      task.id === command.taskId
        ? {
            ...task,
            logs: [...task.logs, { start, end: timestamp }],
            activity: [
              ...task.activity,
              activity(`Completed ${command.minutes}m focus session`, timestamp, ids, 'focus-session')
            ]
          }
        : task
    )
  };
};
