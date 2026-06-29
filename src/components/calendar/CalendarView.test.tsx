import React from 'react';
import { describe, expect, it } from 'vitest';
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

    // Unscheduled sidebar
    expect(screen.getByTestId('unscheduled-sidebar')).toBeInTheDocument();
  });
});
