import { describe, expect, it } from 'vitest';
import { normalizeTask } from './tasks';
import { buildFocusPlan } from './focusPlanning';

describe('buildFocusPlan', () => {
  it('prioritizes in-progress work, caps the day, and summarizes role balance', () => {
    const plan = buildFocusPlan({
      date: '2026-07-07',
      startMinutes: 9 * 60,
      tasks: [
        normalizeTask({
          id: 'backlog-cloud',
          title: 'Cloud migration review',
          status: 'backlog',
          urgency: 9,
          tags: ['gcp'],
          createdAt: '2026-07-07T08:00:00.000Z'
        }),
        normalizeTask({
          id: 'current-backend',
          title: 'Backend incident follow-up',
          status: 'in-progress',
          urgency: 4,
          tags: ['backend'],
          createdAt: '2026-07-07T09:00:00.000Z'
        }),
        normalizeTask({
          id: 'done',
          title: 'Already done',
          status: 'done',
          tags: ['backend']
        })
      ],
      roles: [
        {
          id: 'role-cloud',
          name: 'Cloud Architect',
          tags: ['gcp'],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        },
        {
          id: 'role-backend',
          name: 'Senior Backend',
          tags: ['backend'],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ]
    });

    expect(plan.suggestions.map((suggestion) => suggestion.taskId)).toEqual([
      'current-backend',
      'backlog-cloud'
    ]);
    expect(plan.suggestions[0]).toMatchObject({ scheduledStart: '09:00', scheduledEnd: '09:45' });
    expect(plan.roleCounts).toEqual({ 'Senior Backend': 1, 'Cloud Architect': 1 });
    expect(plan.warnings).toEqual([]);
  });

  it('warns when suggested work exceeds remaining focus capacity', () => {
    const plan = buildFocusPlan({
      date: '2026-07-07',
      startMinutes: 16 * 60,
      endMinutes: 17 * 60,
      tasks: [
        normalizeTask({
          id: 'large',
          title: 'Large migration plan',
          status: 'backlog',
          urgency: 9,
          subtasks: [
            { id: 'one', title: 'One', status: 'backlog', logs: [], activeLogStart: null, tags: [] },
            { id: 'two', title: 'Two', status: 'backlog', logs: [], activeLogStart: null, tags: [] },
            { id: 'three', title: 'Three', status: 'backlog', logs: [], activeLogStart: null, tags: [] }
          ]
        })
      ]
    });

    expect(plan.totalEstimatedMinutes).toBe(105);
    expect(plan.overCapacityMinutes).toBe(45);
    expect(plan.warnings[0]).toMatch(/exceeds available time/i);
  });
});
