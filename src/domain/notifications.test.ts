import { describe, expect, it } from 'vitest';
import { normalizeTask } from './tasks';
import { getTaskNotifications } from './notifications';

describe('task notifications', () => {
  it('detects scheduled starts, overdue tasks, and long-running timers', () => {
    const now = new Date('2026-07-01T10:00:30').getTime();
    const tasks = [
      normalizeTask({
        id: 'starting',
        title: 'Starting task',
        scheduledDate: '2026-07-01',
        scheduledStart: '10:00'
      }),
      normalizeTask({
        id: 'overdue',
        title: 'Overdue task',
        scheduledDate: '2026-07-01',
        scheduledEnd: '09:30'
      }),
      normalizeTask({
        id: 'timer',
        title: 'Timer task',
        status: 'in-progress',
        activeLogStart: '2026-07-01T08:30:00'
      }),
      normalizeTask({
        id: 'done',
        title: 'Done task',
        status: 'done',
        scheduledDate: '2026-07-01',
        scheduledEnd: '09:00'
      })
    ];

    expect(getTaskNotifications(tasks, now).map((notification) => notification.title)).toEqual([
      'Task starting now',
      'Task overdue',
      'Timer running for one hour'
    ]);
  });
});
