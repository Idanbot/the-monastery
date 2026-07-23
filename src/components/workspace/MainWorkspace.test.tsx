import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { renderWithProviders } from '../../test/renderWithProviders';
import { MainWorkspace } from './MainWorkspace';

describe('MainWorkspace', () => {
  beforeEach(() => localStorage.clear());

  it('renders four equal quarters with paired utilities and opens Kanban on a shared surface', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'the-monastery_tasks_v1',
      JSON.stringify([normalizeTask({ id: 'focus-task', title: 'Focus task', status: 'in-progress' })])
    );

    renderWithProviders(<MainWorkspace />);

    expect(screen.getByTestId('main-workspace')).toBeInTheDocument();
    const grid = screen.getByTestId('main-view-grid');
    expect(within(grid).getAllByTestId(/^main-view-slot-/)).toHaveLength(4);
    expect(screen.getByTestId('main-focus-module')).toHaveAttribute('data-slot', 'topLeft');
    expect(screen.getByTestId('main-activity-module')).toHaveAttribute('data-slot', 'topRight');
    expect(screen.getByTestId('main-calendar-module')).toHaveAttribute('data-slot', 'bottomLeft');
    expect(screen.getByTestId('main-media-module')).toHaveAttribute('data-slot', 'bottomLeft');
    expect(screen.getByTestId('main-clock-module')).toHaveAttribute('data-slot', 'bottomRight');
    expect(screen.getByTestId('main-timeline-module')).toHaveAttribute('data-slot', 'bottomRight');

    await user.click(screen.getByRole('button', { name: 'Open Kanban' }));
    const dialog = screen.getByRole('dialog', { name: 'Kanban board' });
    expect(dialog).toHaveAttribute('data-surface', 'modal');
    expect(dialog).toHaveAttribute('data-material', 'modal');
    expect(dialog).toHaveAttribute('data-visual-theme', 'liquid-glass');
    expect(dialog.style.getPropertyValue('--modal-surface-rgb')).not.toBe('');
    expect(within(dialog).getByTestId('kanban-board')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'In-Progress' })).toBeInTheDocument();
  });

  it('renders persisted replacement modules in their selected quarters', () => {
    localStorage.setItem(
      'the-monastery_settings_v1',
      JSON.stringify({
        mainViewSlots: {
          topLeft: 'calendar',
          topRight: 'media',
          bottomLeft: 'activity',
          bottomRight: 'timeline'
        }
      })
    );
    renderWithProviders(<MainWorkspace />);

    expect(screen.getByTestId('main-calendar-module')).toHaveAttribute('data-slot', 'topLeft');
    expect(screen.getByTestId('main-media-module')).toHaveAttribute('data-slot', 'topRight');
    expect(screen.getByTestId('main-activity-module')).toHaveAttribute('data-slot', 'bottomLeft');
    expect(screen.getByTestId('main-timeline-module')).toHaveAttribute('data-slot', 'bottomRight');
    expect(screen.queryByTestId('main-focus-module')).not.toBeInTheDocument();
  });

  it('exposes resizable grid separators and can minimize and restore any quarter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MainWorkspace />);

    expect(screen.getByRole('separator', { name: 'Resize main view columns' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Resize main view rows' })).toBeInTheDocument();

    const slot = screen.getByTestId('main-view-slot-topLeft');
    const controls = within(slot).getByRole('group', { name: 'Top left controls' });
    expect(within(controls).getByRole('button', { name: 'Customize Top left' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collapse Top left' }));
    expect(slot).toHaveAttribute('data-collapsed', 'true');
    expect(within(slot).queryByTestId('main-focus-module')).not.toBeInTheDocument();
    expect(within(slot).getByText('Monk mode')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand Top left' }));
    expect(slot).toHaveAttribute('data-collapsed', 'false');
    expect(within(slot).getByTestId('main-focus-module')).toBeInTheDocument();
  });

  it('keeps monk mode task-free unless a current-work combination is selected', () => {
    localStorage.setItem(
      'the-monastery_settings_v1',
      JSON.stringify({
        mainViewSlots: {
          topLeft: 'focus-current',
          topRight: 'activity-current',
          bottomLeft: 'clock-media-timeline',
          bottomRight: 'focus'
        }
      })
    );
    localStorage.setItem(
      'the-monastery_tasks_v1',
      JSON.stringify([normalizeTask({ id: 'focus-task', title: 'Focus task', status: 'in-progress' })])
    );

    renderWithProviders(<MainWorkspace />);

    expect(screen.getAllByTestId('current-task-pin')).toHaveLength(2);
    expect(
      within(screen.getByTestId('main-view-slot-bottomRight')).queryByTestId('current-task-pin')
    ).toBeNull();
    expect(screen.getByTestId('main-clock-module')).toHaveAttribute('data-slot', 'bottomLeft');
    expect(screen.getByTestId('main-media-module')).toHaveAttribute('data-slot', 'bottomLeft');
    expect(screen.getByTestId('main-timeline-module')).toHaveAttribute('data-slot', 'bottomLeft');
  });
});
