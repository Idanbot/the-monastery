import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeTask } from '../domain/tasks';
import { CurrentTaskPin } from './CurrentTaskPin';

const props = () => ({ onOpen: vi.fn(), onAdd: vi.fn(), onToggleTimer: vi.fn(), onComplete: vi.fn() });

describe('CurrentTaskPin', () => {
  it('offers one creation action when no task is active', () => {
    const actions = props();
    render(<CurrentTaskPin task={null} now={Date.now()} {...actions} />);
    fireEvent.click(screen.getByRole('button', { name: /backlog task/i }));
    expect(actions.onAdd).toHaveBeenCalled();
  });

  it('opens, times, and completes the active task', () => {
    const actions = props();
    const task = normalizeTask({ id: 'active', title: 'Focused work', status: 'in-progress' });
    render(<CurrentTaskPin task={task} now={Date.now()} {...actions} />);
    fireEvent.click(screen.getByRole('button', { name: /focused work/i }));
    fireEvent.click(screen.getByRole('button', { name: /^start$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(actions.onOpen).toHaveBeenCalledWith('active');
    expect(actions.onToggleTimer).toHaveBeenCalledWith('active');
    expect(actions.onComplete).toHaveBeenCalledWith('active');
  });
});
