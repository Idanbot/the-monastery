import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { ActivityGraph } from './ActivityGraph';

describe('ActivityGraph', () => {
  it('shows time and completion totals with detailed daily activity', async () => {
    const user = userEvent.setup();
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

    render(<ActivityGraph tasks={[task]} now={now} compact petId="aurelius" showPet animateFlame />);

    expect(screen.getByTestId('activity-tracked-time')).toHaveTextContent('1h 0m');
    expect(screen.getByTestId('activity-subtasks-completed')).toHaveTextContent('1');
    expect(screen.getByTestId('activity-tasks-completed')).toHaveTextContent('1');
    const activeDay = screen.getByLabelText(
      /2026-07-17: 1h 0m tracked, 1 subtask completed, 1 task completed/i
    );
    await user.hover(activeDay);
    expect(screen.getByRole('tooltip')).toHaveTextContent('17.07.26');
    expect(screen.getByRole('tooltip')).toHaveTextContent('1h 0m focused');
    expect(screen.getByTestId('streak-flame')).toHaveAttribute('data-animated', 'true');
    expect(screen.getByTestId('streak-flame-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-pet-id', 'aurelius');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-streak-active', 'true');
  });

  it('keeps the pet sleepy and the flame static when there is no current streak', () => {
    render(<ActivityGraph tasks={[]} now={new Date('2026-07-17T12:00:00.000Z').getTime()} />);

    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-pet-state', 'dormant');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'sleep');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-streak-active', 'false');
    expect(screen.getByTestId('streak-flame')).toHaveAttribute('data-animated', 'false');
  });
});
