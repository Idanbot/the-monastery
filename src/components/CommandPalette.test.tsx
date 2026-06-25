import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

const renderPalette = (settings = { monkMode: false }) => {
  const setSettings = vi.fn();
  const setMonkMode = vi.fn();
  const setView = vi.fn();
  const openTaskModal = vi.fn();
  render(
    <CommandPalette
      settings={settings}
      setSettings={setSettings}
      setMonkMode={setMonkMode}
      setView={setView}
      openTaskModal={openTaskModal}
    />
  );
  return { setSettings, setMonkMode, setView, openTaskModal };
};

describe('CommandPalette', () => {
  it('opens from keyboard and runs primary task and mode actions', async () => {
    const user = userEvent.setup();
    const actions = renderPalette({ monkMode: false });

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();

    await user.click(screen.getByText(/create backlog task/i));
    expect(actions.openTaskModal).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument());

    await user.keyboard('{Control>}k{/Control}');
    await user.click(screen.getByText(/enter monk mode/i));
    expect(actions.setMonkMode).toHaveBeenCalledWith(true);
  });

  it('runs navigation and theme commands and closes on escape', async () => {
    const user = userEvent.setup();
    const actions = renderPalette({ monkMode: true });

    await user.keyboard('{Control>}k{/Control}');
    await user.click(screen.getByText(/go to analytics/i));
    expect(actions.setView).toHaveBeenCalledWith('dashboard');

    await user.keyboard('{Control>}k{/Control}');
    await user.click(screen.getByText(/go to board/i));
    expect(actions.setView).toHaveBeenCalledWith('board');

    await user.keyboard('{Control>}k{/Control}');
    await user.click(screen.getByText(/set theme: liquid glass/i));
    expect(actions.setSettings).toHaveBeenCalledWith(expect.any(Function));
    const updater = actions.setSettings.mock.calls.at(-1)?.[0];
    expect(updater({ visualTheme: 'zen' })).toMatchObject({ visualTheme: 'liquid-glass' });

    await user.keyboard('{Control>}k{/Control}');
    await user.click(screen.getByText(/set theme: obsidian glass/i));
    const obsidianUpdater = actions.setSettings.mock.calls.at(-1)?.[0];
    expect(obsidianUpdater({ visualTheme: 'zen' })).toMatchObject({ visualTheme: 'obsidian-glass' });

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByText(/exit monk mode/i)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument());
  });
});
