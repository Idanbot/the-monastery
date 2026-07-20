import { describe, expect, it } from 'vitest';
import { normalizeTask } from './tasks';
import { buildActivitySummary } from './activityTracking';

describe('activity tracking', () => {
  it('counts tracked time, completed subtasks, and completed tasks', () => {
    const now = new Date('2026-07-17T12:00:00.000Z').getTime();
    const active = normalizeTask({
      id: 'active',
      title: 'Active work',
      status: 'in-progress',
      logs: [{ start: '2026-07-17T10:00:00.000Z', end: '2026-07-17T11:00:00.000Z' }],
      activeLogStart: '2026-07-17T11:30:00.000Z',
      subtasks: [
        {
          id: 'subtask',
          title: 'Validate rollout',
          status: 'done',
          logs: [{ start: '2026-07-17T09:00:00.000Z', end: '2026-07-17T09:30:00.000Z' }],
          activeLogStart: null,
          tags: []
        }
      ],
      activity: [
        {
          id: 'subtask-done',
          type: 'system',
          kind: 'subtask-completed',
          text: 'Completed subtask: Validate rollout',
          timestamp: '2026-07-17T09:30:00.000Z'
        }
      ]
    });
    const done = normalizeTask({
      id: 'done',
      title: 'Finished work',
      status: 'done',
      activity: [
        {
          id: 'task-done',
          type: 'system',
          kind: 'task-completed',
          text: 'Marked done',
          timestamp: '2026-07-17T08:00:00.000Z'
        }
      ]
    });

    const summary = buildActivitySummary([active, done], { now, days: 7 });

    expect(summary.totalTrackedMs).toBe(2 * 60 * 60 * 1000);
    expect(summary.completedSubtasks).toBe(1);
    expect(summary.completedTasks).toBe(1);
    expect(summary.days.at(-1)).toMatchObject({
      date: '2026-07-17',
      trackedMs: 2 * 60 * 60 * 1000,
      completedSubtasks: 1,
      completedTasks: 1
    });
  });

  it('splits tracked time across day boundaries', () => {
    const task = normalizeTask({
      id: 'overnight',
      logs: [{ start: '2026-07-16T23:30:00.000Z', end: '2026-07-17T00:30:00.000Z' }]
    });

    const summary = buildActivitySummary([task], {
      now: new Date('2026-07-17T12:00:00.000Z').getTime(),
      days: 2
    });

    expect(summary.days).toEqual([
      expect.objectContaining({ date: '2026-07-16', trackedMs: 30 * 60 * 1000 }),
      expect.objectContaining({ date: '2026-07-17', trackedMs: 30 * 60 * 1000 })
    ]);
  });

  it('hides activity before a persisted clear cutoff without deleting task history', () => {
    const task = normalizeTask({
      id: 'retained-history',
      status: 'done',
      logs: [
        { start: '2026-07-17T09:00:00.000Z', end: '2026-07-17T10:00:00.000Z' },
        { start: '2026-07-17T11:00:00.000Z', end: '2026-07-17T12:00:00.000Z' }
      ],
      activity: [
        {
          id: 'done-before-clear',
          type: 'system',
          kind: 'task-completed',
          text: 'Marked done',
          timestamp: '2026-07-17T09:30:00.000Z'
        }
      ]
    });

    const summary = buildActivitySummary([task], {
      now: new Date('2026-07-17T13:00:00.000Z').getTime(),
      days: 1,
      clearedBefore: '2026-07-17T10:30:00.000Z'
    });

    expect(summary.totalTrackedMs).toBe(60 * 60 * 1000);
    expect(summary.completedTasks).toBe(0);
    expect(task.logs).toHaveLength(2);
    expect(task.activity).toHaveLength(1);
  });
});
