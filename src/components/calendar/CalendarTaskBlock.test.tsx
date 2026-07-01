import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { CalendarTaskBlock } from './CalendarTaskBlock';

describe('CalendarTaskBlock', () => {
  it('shows only the task title inside the calendar event', () => {
    const task = normalizeTask({
      id: 'calendar-task',
      title: 'Calendar focus task',
      urgency: 9,
      tags: ['deep-work'],
      scheduledStart: '09:00',
      scheduledEnd: '10:00'
    });

    render(<CalendarTaskBlock clockFormat="24h" task={task} onSelect={vi.fn()} />);

    const event = screen.getByTestId('calendar-task-Calendar focus task');
    expect(event).toHaveTextContent(/^Calendar focus task$/);
    expect(event).toHaveAttribute('title', 'Calendar focus task');
    expect(event).not.toHaveTextContent('deep-work');
    expect(event).not.toHaveTextContent('9');
  });
  it('formats event times with the selected 12-hour clock', () => {
    const task = normalizeTask({
      id: 'afternoon-task',
      title: 'Afternoon focus',
      scheduledDate: '2026-07-02',
      scheduledStart: '13:00',
      scheduledEnd: '14:30'
    });

    render(<CalendarTaskBlock clockFormat="12h" task={task} onSelect={vi.fn()} />);

    expect(screen.getByTestId('calendar-task-Afternoon focus')).toHaveAccessibleName(
      'Afternoon focus, 2026-07-02 from 1:00 PM to 2:30 PM'
    );
  });
});
