import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeTask } from '../domain/tasks';
import { useAppShortcuts } from './useAppShortcuts';

const options = (overrides = {}) => ({
  filteredTasks: [normalizeTask({ id: 'one', title: 'One' }), normalizeTask({ id: 'two', title: 'Two' })],
  isCommandOpen: false,
  selectedTaskId: null,
  keyboardFocusedTaskId: null,
  setKeyboardFocusedTaskId: vi.fn(),
  setSelectedTaskId: vi.fn(),
  toggleCommandPalette: vi.fn(),
  closeCommandPalette: vi.fn(),
  addBacklogTask: vi.fn(),
  startFocusTask: vi.fn(),
  planDay: vi.fn(),
  showAnalytics: vi.fn(),
  showBoard: vi.fn(),
  showShortcuts: vi.fn(),
  toggleMonkMode: vi.fn(),
  showList: vi.fn(),
  ...overrides
});

describe('useAppShortcuts', () => {
  it('opens the command palette globally and navigates visible tasks', () => {
    const handlers = options();
    renderHook(() => useAppShortcuts(handlers));

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(handlers.toggleCommandPalette).toHaveBeenCalledOnce();
    expect(handlers.setKeyboardFocusedTaskId).toHaveBeenCalledWith('two');
    expect(handlers.setSelectedTaskId).toHaveBeenCalledWith('one');
  });

  it('ignores task shortcuts while typing', () => {
    const handlers = options();
    renderHook(() => useAppShortcuts(handlers));
    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 'n' });

    expect(handlers.addBacklogTask).not.toHaveBeenCalled();
    input.remove();
  });
});
