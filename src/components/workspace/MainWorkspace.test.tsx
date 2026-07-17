import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { renderWithProviders } from '../../test/renderWithProviders';
import { MainWorkspace } from './MainWorkspace';

describe('MainWorkspace', () => {
  beforeEach(() => localStorage.clear());

  it('renders the requested center and utility modules and opens Kanban on demand', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'the-monastery_tasks_v1',
      JSON.stringify([normalizeTask({ id: 'focus-task', title: 'Focus task', status: 'in-progress' })])
    );

    renderWithProviders(<MainWorkspace />);

    expect(screen.getByTestId('main-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('main-focus-module')).toHaveAttribute('data-area', 'center');
    expect(screen.getByTestId('main-activity-module')).toHaveAttribute('data-area', 'center');
    expect(screen.getByTestId('main-calendar-module')).toHaveAttribute('data-area', 'right');
    expect(screen.getByTestId('main-media-module')).toHaveAttribute('data-area', 'right');
    expect(screen.getByTestId('main-clock-module')).toHaveAttribute('data-area', 'right');

    await user.click(screen.getByRole('button', { name: 'Open Kanban' }));
    const dialog = screen.getByRole('dialog', { name: 'Kanban board' });
    expect(within(dialog).getByTestId('kanban-board')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'In-Progress' })).toBeInTheDocument();
  });

  it('customizes module visibility and placement', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MainWorkspace />);

    await user.click(screen.getByRole('button', { name: 'Customize main view' }));
    const customizer = screen.getByTestId('main-view-customizer');
    await user.click(within(customizer).getByRole('checkbox', { name: 'Show Media' }));
    expect(screen.queryByTestId('main-media-module')).not.toBeInTheDocument();

    await user.selectOptions(within(customizer).getByLabelText('Activity placement'), 'right');
    expect(screen.getByTestId('main-activity-module')).toHaveAttribute('data-area', 'right');
  });
});
