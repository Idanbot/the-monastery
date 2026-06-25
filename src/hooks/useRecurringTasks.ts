import { useEffect } from 'react';
import { cloneTask, generateId, getNextRecurringDate } from '../domain/tasks';

export function useRecurringTasks(tasks, setTasks) {
  useEffect(() => {
    setTasks((prev) => {
      const existingRecurringSlots = new Set(
        prev.map((task) => `${task.recurrenceRootId || task.id}:${task.scheduledDate}`)
      );
      const generated = [];

      prev.forEach((task) => {
        if (task.status !== 'done' || !task.recurrence || task.recurrence === 'none') return;

        const recurrenceRootId = task.recurrenceRootId || task.id;
        const nextDate = getNextRecurringDate(task.scheduledDate, task.recurrence);
        if (!nextDate || existingRecurringSlots.has(`${recurrenceRootId}:${nextDate}`)) return;

        generated.push({
          ...cloneTask(task),
          id: generateId(),
          status: 'backlog',
          scheduledDate: nextDate,
          recurrenceRootId,
          logs: [],
          activeLogStart: null,
          subtasks: (task.subtasks || []).map((subtask) => ({
            ...subtask,
            status: 'backlog',
            logs: [],
            activeLogStart: null
          })),
          activity: [
            {
              id: generateId(),
              type: 'system',
              text: `Recurring task created from ${task.title || 'untitled task'}`,
              timestamp: new Date().toISOString()
            }
          ]
        });
        existingRecurringSlots.add(`${recurrenceRootId}:${nextDate}`);
      });

      return generated.length ? [...generated, ...prev] : prev;
    });
  }, [tasks, setTasks]);
}
