import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette, type CommandPaletteGroup } from './CommandPalette';

const renderPalette = (groups: CommandPaletteGroup[]) => {
  const onOpenChange = vi.fn();
  render(<CommandPalette open={true} onOpenChange={onOpenChange} groups={groups} />);
  return { onOpenChange };
};

describe('CommandPalette', () => {
  it('renders the supplied command groups and runs actions on click', async () => {
    const user = userEvent.setup();
    const createTask = vi.fn();
    const enterMonkMode = vi.fn();

    renderPalette([
      {
        heading: 'Actions',
        commands: [
          { value: 'create backlog task', label: 'Create backlog task', onSelect: createTask },
          { value: 'enter monk mode', label: 'Enter Monk Mode', onSelect: enterMonkMode }
        ]
      }
    ]);

    await user.click(screen.getByText(/create backlog task/i));
    expect(createTask).toHaveBeenCalled();
  });

  it('closes via Escape and reports onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderPalette([
      {
        heading: 'Actions',
        commands: [{ value: 'plan my day', label: 'Plan my day', onSelect: vi.fn() }]
      }
    ]);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
