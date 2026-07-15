import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { MobileCalendarAgenda } from './MobileCalendarAgenda';

describe('MobileCalendarAgenda', () => {
  it('shows the selected day as a time-ordered, readable agenda', () => {
    const onSelectTask = vi.fn();
    render(
      <MobileCalendarAgenda
        currentDate={new Date(2026, 6, 15, 12, 0, 0)}
        tasks={[
          normalizeTask({
            id: 'afternoon',
            title: 'Architecture review',
            scheduledDate: '2026-07-15',
            scheduledStart: '14:00',
            scheduledEnd: '15:30',
            tags: ['architecture']
          }),
          normalizeTask({
            id: 'morning',
            title: 'Platform planning',
            scheduledDate: '2026-07-15',
            scheduledStart: '09:30',
            scheduledEnd: '10:00',
            tags: ['platform']
          }),
          normalizeTask({ id: 'unscheduled', title: 'Read later' })
        ]}
        now={new Date(2026, 6, 15, 8, 0, 0).getTime()}
        clockFormat="12h"
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        onToday={vi.fn()}
        onSelectTask={onSelectTask}
        onCreateTask={vi.fn()}
        onAddUnscheduled={vi.fn()}
      />
    );

    const agenda = screen.getByTestId('mobile-calendar-agenda');
    expect(within(agenda).getByRole('heading', { name: 'Wednesday, July 15' })).toBeInTheDocument();
    expect(within(agenda).getByText('9:30 AM')).toBeInTheDocument();
    expect(within(agenda).getByText('2:00 PM')).toBeInTheDocument();
    const scheduledTasks = within(agenda).getAllByRole('button', { name: /open scheduled task/i });
    expect(scheduledTasks.map((button) => button.textContent)).toEqual([
      expect.stringContaining('Platform planning'),
      expect.stringContaining('Architecture review')
    ]);

    fireEvent.click(scheduledTasks[0]);
    expect(onSelectTask).toHaveBeenCalledWith('morning');
  });

  it('keeps unscheduled work behind a clear tab and exposes large day actions', () => {
    const onPreviousDay = vi.fn();
    const onNextDay = vi.fn();
    const onToday = vi.fn();
    const onCreateTask = vi.fn();
    const onAddUnscheduled = vi.fn();
    const onSelectTask = vi.fn();
    render(
      <MobileCalendarAgenda
        currentDate={new Date(2026, 6, 15, 12, 0, 0)}
        tasks={[
          normalizeTask({
            id: 'scheduled',
            title: 'Scheduled focus',
            scheduledDate: '2026-07-15',
            scheduledStart: '11:00'
          }),
          normalizeTask({ id: 'unscheduled', title: 'Read later' })
        ]}
        now={new Date(2026, 6, 15, 8, 0, 0).getTime()}
        clockFormat="24h"
        onPreviousDay={onPreviousDay}
        onNextDay={onNextDay}
        onToday={onToday}
        onSelectTask={onSelectTask}
        onCreateTask={onCreateTask}
        onAddUnscheduled={onAddUnscheduled}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(onPreviousDay).toHaveBeenCalledOnce();
    expect(onToday).toHaveBeenCalledOnce();
    expect(onNextDay).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Unscheduled, 1 task' }));
    expect(screen.getByText('Read later')).toBeInTheDocument();
    expect(screen.queryByText('Scheduled focus')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open unscheduled task Read later' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add unscheduled task' }));
    expect(onSelectTask).toHaveBeenCalledWith('unscheduled');
    expect(onAddUnscheduled).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Agenda, 1 task' }));
    fireEvent.click(screen.getByRole('button', { name: 'Schedule task' }));
    expect(onCreateTask).toHaveBeenCalledWith('2026-07-15', '09:00');
  });
});
