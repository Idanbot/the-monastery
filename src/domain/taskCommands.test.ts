import { describe, expect, it } from 'vitest';
import { normalizeTask } from './tasks';
import { executeTaskCommand } from './taskCommands';

const now = '2026-06-27T09:00:00.000Z';
const ids = () => 'activity-id';
const task = (id: string, overrides = {}) => normalizeTask({ id, title: id, ...overrides });

describe('executeTaskCommand', () => {
  it('creates and deletes tasks through the command interface', () => {
    const created = executeTaskCommand([task('existing')], { type: 'create', task: task('new') });
    expect(created.tasks.map((item) => item.id)).toEqual(['new', 'existing']);
    expect(executeTaskCommand(created.tasks, { type: 'delete', taskId: 'existing' }).tasks).toHaveLength(1);
  });

  it('keeps one active timer and closes the previous task log', () => {
    const tasks = [
      task('first', { status: 'in-progress', activeLogStart: '2026-06-27T08:00:00.000Z' }),
      task('second', { status: 'in-progress' })
    ];

    const result = executeTaskCommand(tasks, { type: 'toggle-timer', taskId: 'second' }, { now, ids });

    expect(result.tasks[0]).toMatchObject({ activeLogStart: null });
    expect(result.tasks[0].logs).toEqual([{ start: '2026-06-27T08:00:00.000Z', end: now }]);
    expect(result.tasks[1]).toMatchObject({ activeLogStart: now });
  });

  it('completes a task and promotes the highest urgency backlog task', () => {
    const tasks = [
      task('active', { status: 'in-progress', activeLogStart: '2026-06-27T08:00:00.000Z' }),
      task('low', { status: 'backlog', urgency: 2 }),
      task('high', { status: 'backlog', urgency: 9 })
    ];

    const result = executeTaskCommand(
      tasks,
      { type: 'complete', taskId: 'active', promoteNext: true },
      { now, ids }
    );

    expect(result.tasks.find((item) => item.id === 'active')).toMatchObject({
      status: 'done',
      activeLogStart: null
    });
    expect(result.tasks.find((item) => item.id === 'high')?.status).toBe('in-progress');
    expect(result.effects).toEqual([{ type: 'task-promoted', taskId: 'high' }]);
  });

  it('starts a backlog task by promoting it and closing any other active timer', () => {
    const result = executeTaskCommand(
      [
        task('previous', { status: 'in-progress', activeLogStart: '2026-06-27T08:00:00.000Z' }),
        task('next', { status: 'backlog' })
      ],
      { type: 'start', taskId: 'next' },
      { now, ids }
    );

    expect(result.tasks.find((item) => item.id === 'previous')).toMatchObject({ activeLogStart: null });
    expect(result.tasks.find((item) => item.id === 'previous')?.logs).toEqual([
      { start: '2026-06-27T08:00:00.000Z', end: now }
    ]);
    expect(result.tasks.find((item) => item.id === 'next')).toMatchObject({
      status: 'in-progress',
      activeLogStart: now
    });
  });

  it('closes a running timer when moved to a terminal state', () => {
    const result = executeTaskCommand(
      [task('active', { status: 'in-progress', activeLogStart: '2026-06-27T08:00:00.000Z' })],
      { type: 'move', taskId: 'active', status: 'rejected' },
      { now, ids }
    );

    expect(result.tasks[0]).toMatchObject({ status: 'rejected', activeLogStart: null });
    expect(result.tasks[0].logs).toHaveLength(1);
  });

  it('plans only in-progress tasks without a complete schedule', () => {
    const result = executeTaskCommand(
      [
        task('backlog'),
        task('active', { status: 'in-progress' }),
        task('planned', { status: 'in-progress', scheduledDate: '2026-06-27', scheduledStart: '10:00' })
      ],
      { type: 'plan-day', date: '2026-06-27', startMinutes: 9 * 60 },
      { now, ids }
    );

    expect(result.tasks.find((item) => item.id === 'backlog')?.scheduledStart).toBe('');
    expect(result.tasks.find((item) => item.id === 'active')).toMatchObject({
      scheduledStart: '09:00',
      scheduledEnd: '09:45'
    });
    expect(result.tasks.find((item) => item.id === 'planned')?.scheduledStart).toBe('10:00');
  });

  it('applies a focus plan by promoting selected backlog tasks into scheduled in-progress work', () => {
    const result = executeTaskCommand(
      [
        task('first', { status: 'backlog' }),
        task('second', { status: 'in-progress' }),
        task('ignored', { status: 'backlog' })
      ],
      {
        type: 'apply-focus-plan',
        date: '2026-07-07',
        taskIds: ['first', 'second'],
        startMinutes: 10 * 60
      },
      { now, ids }
    );

    expect(result.tasks.find((item) => item.id === 'first')).toMatchObject({
      status: 'in-progress',
      scheduledDate: '2026-07-07',
      scheduledStart: '10:00',
      scheduledEnd: '10:45'
    });
    expect(result.tasks.find((item) => item.id === 'second')).toMatchObject({
      status: 'in-progress',
      scheduledStart: '11:00',
      scheduledEnd: '11:45'
    });
    expect(result.tasks.find((item) => item.id === 'ignored')?.scheduledStart).toBe('');
  });
});
