import { describe, expect, it } from 'vitest';
import {
  getNextRecurringDate,
  mergeSettings,
  normalizeTask,
  normalizeTasksPayload,
  taskMatchesSearch
} from './tasks';

describe('task domain helpers', () => {
  it('normalizes partial task input with safe defaults', () => {
    expect(normalizeTask({ title: 'Study', urgency: 99 })).toMatchObject({
      title: 'Study',
      status: 'new',
      urgency: 10,
      tags: [],
      recurrence: 'none',
      recurrenceRootId: null
    });
  });

  it('normalizes export payloads', () => {
    const tasks = normalizeTasksPayload({ tasks: [{ id: 'a', title: 'A' }] });

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: 'a', title: 'A' });
  });

  it('calculates next recurring dates without UTC day drift', () => {
    expect(getNextRecurringDate('2026-06-17', 'daily')).toBe('2026-06-18');
    expect(getNextRecurringDate('2026-06-17', 'weekly')).toBe('2026-06-24');
    expect(getNextRecurringDate('2026-06-17', 'monthly')).toBe('2026-07-17');
  });

  it('searches task, activity, and subtask text', () => {
    const task = normalizeTask({
      title: 'Backend API',
      tags: ['node'],
      activity: [{ id: 'a', type: 'note', text: 'OAuth detail', timestamp: new Date().toISOString() }],
      subtasks: [
        { id: 's', title: 'SQL migration', status: 'new', logs: [], activeLogStart: null, tags: ['db'] }
      ]
    });

    expect(taskMatchesSearch(task, 'oauth')).toBe(true);
    expect(taskMatchesSearch(task, 'migration')).toBe(true);
    expect(taskMatchesSearch(task, 'frontend')).toBe(false);
  });

  it('merges settings with role target defaults', () => {
    const settings = mergeSettings({ roles: [{ id: 'r', name: 'Role', tags: ['x'] }] });

    expect(settings.roles[0]).toEqual({ id: 'r', name: 'Role', tags: ['x'], weeklyTargetHours: 0 });
  });
});
