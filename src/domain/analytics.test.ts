import { describe, expect, it } from 'vitest';
import { calculateAnalytics } from './analytics';
import { normalizeTask } from './tasks';

describe('calculateAnalytics', () => {
  it('credits one tagged hour to every matching role', () => {
    const start = new Date('2026-06-17T10:00:00.000Z').toISOString();
    const end = new Date('2026-06-17T11:00:00.000Z').toISOString();
    const tasks = [
      normalizeTask({ title: 'Python study', status: 'done', tags: ['python'], logs: [{ start, end }] })
    ];
    const analytics = calculateAnalytics({
      tasks,
      now: new Date(end).getTime(),
      roles: [
        { id: 'devops', name: 'DevOps', tags: ['python'], weeklyTargetHours: 5 },
        { id: 'backend', name: 'Backend', tags: ['python'], weeklyTargetHours: 5 }
      ]
    });

    expect(analytics.tagRows).toMatchObject([{ tag: 'python', hours: 1 }]);
    expect(analytics.roleRows.map((role) => [role.name, role.hours])).toEqual([
      ['DevOps', 1],
      ['Backend', 1]
    ]);
  });
});
