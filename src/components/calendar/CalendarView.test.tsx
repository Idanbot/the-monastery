import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { CalendarView } from './CalendarView';

describe('CalendarView component', () => {
  it('renders calendar title and layout elements', () => {
    renderWithProviders(<CalendarView />);

    // Header date display
    expect(screen.getByTestId('calendar-header-title')).toBeInTheDocument();

    // View modes toggle
    expect(screen.getByRole('button', { name: /^day$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^week$/i })).toBeInTheDocument();

    // Today button
    expect(screen.getByRole('button', { name: /^today$/i })).toBeInTheDocument();

    // Side ruler hour marks
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getAllByTestId('calendar-hour-label')).toHaveLength(24);
    expect(screen.getByText('00:00')).toHaveStyle({ top: '0px' });
    expect(screen.getByTestId('calendar-scroll-area')).toHaveProperty('scrollTop', 0);

    // Unscheduled sidebar
    expect(screen.getByTestId('unscheduled-sidebar')).toBeInTheDocument();
  });

  it('uses the agenda instead of the 24-hour grid on a phone', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(max-width: 639px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    renderWithProviders(<CalendarView />);

    expect(screen.getByTestId('mobile-calendar-agenda')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-scroll-area')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unscheduled-sidebar')).not.toBeInTheDocument();
    matchMedia.mockRestore();
  });
});
