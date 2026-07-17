import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { ActivityGraph } from './ActivityGraph';

describe('ActivityGraph', () => {
  it('shows time and completion totals with detailed daily activity', () => {
    const now = new Date('2026-07-17T12:00:00.000Z').getTime();
    const task = normalizeTask({
      id: 'tracked',
      status: 'done',
      logs: [{ start: '2026-07-17T10:00:00.000Z', end: '2026-07-17T11:00:00.000Z' }],
      subtasks: [
        {
          id: 'subtask',
          title: 'Verify',
          status: 'done',
          logs: [],
          activeLogStart: null,
          tags: []
        }
      ],
      activity: [
        {
          id: 'subtask-done',
          type: 'system',
          kind: 'subtask-completed',
          text: 'Completed subtask: Verify',
          timestamp: '2026-07-17T10:30:00.000Z'
        },
        {
          id: 'task-done',
          type: 'system',
          kind: 'task-completed',
          text: 'Marked done',
          timestamp: '2026-07-17T11:00:00.000Z'
        }
      ]
    });

    render(<ActivityGraph tasks={[task]} now={now} compact />);

    expect(screen.getByTestId('activity-tracked-time')).toHaveTextContent('1h 0m');
    expect(screen.getByTestId('activity-subtasks-completed')).toHaveTextContent('1');
    expect(screen.getByTestId('activity-tasks-completed')).toHaveTextContent('1');
    expect(
      screen.getByLabelText(/2026-07-17: 1h 0m tracked, 1 subtask completed, 1 task completed/i)
    ).toBeInTheDocument();
  });
});
