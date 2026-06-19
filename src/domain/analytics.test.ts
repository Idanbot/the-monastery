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
        {
          id: 'devops',
          name: 'DevOps',
          tags: ['python'],
          dailyTargetHours: 0,
          weeklyTargetHours: 5,
          monthlyTargetHours: 0
        },
        {
          id: 'backend',
          name: 'Backend',
          tags: ['python'],
          dailyTargetHours: 0,
          weeklyTargetHours: 5,
          monthlyTargetHours: 0
        }
      ]
    });

    expect(analytics.tagRows).toMatchObject([{ tag: 'python', hours: 1 }]);
    expect(analytics.roleRows.map((role) => [role.name, role.hours])).toEqual([
      ['DevOps', 1],
      ['Backend', 1]
    ]);
    expect(analytics.roleRows[0].weeklyBalanceHours).toBe(4);
  });

  it('attaches tag goal progress', () => {
    const start = new Date('2026-06-17T10:00:00.000Z').toISOString();
    const end = new Date('2026-06-17T11:30:00.000Z').toISOString();
    const analytics = calculateAnalytics({
      tasks: [normalizeTask({ title: 'Study', tags: ['python'], logs: [{ start, end }] })],
      now: new Date(end).getTime(),
      roles: [],
      tagGoals: [
        { id: 'tag-python', tag: 'python', dailyTargetHours: 1, weeklyTargetHours: 5, monthlyTargetHours: 20 }
      ]
    });

    expect(analytics.tagRows[0]).toMatchObject({ tag: 'python', hours: 1.5, weeklyTargetHours: 5 });
  });
});
