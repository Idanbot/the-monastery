import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../domain/tasks';
import { ClockWidget } from './ClockWidget';

describe('ClockWidget', () => {
  it('renders the digital clock with the current time', () => {
    const now = new Date(2026, 5, 27, 9, 30, 0).getTime();
    render(<ClockWidget settings={defaultSettings} now={now} onOpenSettings={vi.fn()} />);

    expect(screen.getByTestId('clock-time')).toBeInTheDocument();
    expect(screen.getByText(/friday|saturday|sunday|monday|tuesday|wednesday|thursday/i)).toBeInTheDocument();
  });

  it('renders the analog clock and second hand when configured', () => {
    const now = new Date(2026, 5, 27, 9, 30, 0).getTime();
    render(
      <ClockWidget
        settings={{ ...defaultSettings, clockDisplayMode: 'analog', showSeconds: true }}
        now={now}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByTestId('clock-analog')).toBeInTheDocument();
    expect(screen.getByTestId('clock-second-hand')).toBeInTheDocument();
  });

  it('opens the time settings section from the controls', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onOpenSettings = vi.fn();
    render(<ClockWidget settings={defaultSettings} now={Date.now()} onOpenSettings={onOpenSettings} />);

    await user.click(screen.getByRole('button', { name: /open clock settings/i }));
    expect(onOpenSettings).toHaveBeenCalledWith('time');
  });
});
