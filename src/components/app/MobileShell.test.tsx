import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MobileShell } from './MobileShell';

describe('MobileShell', () => {
  it('navigates primary views, creates a task, and exposes secondary destinations', async () => {
    const user = userEvent.setup();
    const onToday = vi.fn();
    const onBoard = vi.fn();
    const onCalendar = vi.fn();
    const onAddTask = vi.fn();
    const onNavigate = vi.fn();
    const onOpenMedia = vi.fn();
    render(
      <MobileShell
        view="board"
        focusMode={false}
        activeProfileName="Default"
        onToday={onToday}
        onBoard={onBoard}
        onCalendar={onCalendar}
        onAddTask={onAddTask}
        onNavigate={onNavigate}
        onOpenSettings={() => {}}
        onOpenProfiles={() => {}}
        onOpenSidebar={() => {}}
        onOpenMedia={onOpenMedia}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Today' }));
    await user.click(screen.getByRole('button', { name: 'Board' }));
    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onToday).toHaveBeenCalledOnce();
    expect(onBoard).toHaveBeenCalledOnce();
    expect(onCalendar).toHaveBeenCalledOnce();
    expect(onAddTask).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'More' }));
    expect(screen.getByRole('dialog', { name: 'More' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Projects' }));
    expect(onNavigate).toHaveBeenCalledWith('projects');

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('button', { name: 'Music' }));
    expect(onOpenMedia).toHaveBeenCalledOnce();
  });
});
