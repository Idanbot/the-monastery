import { expect, it } from 'vitest';
import { normalizeTask } from './tasks';
import { calculateProjectSummaries } from './projects';

it('summarizes project progress, tracked time, and the next action', () => {
  const tasks = [
    normalizeTask({
      id: 'done',
      title: 'Finish network design',
      status: 'done',
      logs: [{ start: '2026-07-03T08:00:00.000Z', end: '2026-07-03T09:00:00.000Z' }]
    }),
    normalizeTask({
      id: 'next',
      title: 'Present migration plan',
      status: 'backlog',
      logs: [{ start: '2026-07-03T09:00:00.000Z', end: '2026-07-03T09:30:00.000Z' }]
    })
  ];
  const [summary] = calculateProjectSummaries(
    [
      {
        id: 'cloud',
        name: 'Cloud Architect',
        description: '',
        status: 'active',
        tags: ['cloud'],
        taskIds: ['done', 'next'],
        milestones: [
          { id: 'm1', title: 'Architecture review', completed: true },
          { id: 'm2', title: 'Migration demo', completed: false }
        ]
      }
    ],
    tasks,
    new Date('2026-07-03T10:00:00.000Z').getTime()
  );

  expect(summary).toMatchObject({
    completedItems: 2,
    totalItems: 4,
    progressPercent: 50,
    trackedMs: 90 * 60_000
  });
  expect(summary.nextTask).toMatchObject({ id: 'next', title: 'Present migration plan' });
});
