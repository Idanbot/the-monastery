import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimeSlot } from './TimeSlot';

describe('TimeSlot keyboard accessibility', () => {
  it('moves focus with arrow keys and activates task creation', () => {
    const onActivate = vi.fn();
    const onDropTask = vi.fn();

    render(
      <>
        <TimeSlot
          date="2026-07-01"
          time="00:00"
          onActivate={onActivate}
          onDropTask={onDropTask}
          initialTabStop
        />
        <TimeSlot date="2026-07-01" time="00:30" onActivate={onActivate} onDropTask={onDropTask} />
      </>
    );

    const midnight = screen.getByRole('button', { name: /2026-07-01 at 00:00/i });
    const halfPast = screen.getByRole('button', { name: /2026-07-01 at 00:30/i });
    midnight.focus();
    fireEvent.keyDown(midnight, { key: 'ArrowDown' });
    expect(halfPast).toHaveFocus();

    fireEvent.click(halfPast);
    expect(onActivate).toHaveBeenCalledWith('2026-07-01', '00:30');
  });
});
