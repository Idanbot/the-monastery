import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResizableLayout } from './useResizableLayout';

const baseSettings = () => ({
  sidebarWidth: 320,
  clockHeight: 160,
  columnWidths: { backlog: 25, inProgress: 25, done: 25, rejected: 25 },
  compactColumnWidths: { left: 50, right: 50 },
  compactHeights: { backlog: 50, inProgress: 50, done: 50, rejected: 50 }
});

const setup = () => {
  let settings = baseSettings();
  const setSettings = vi.fn((next) => {
    settings = typeof next === 'function' ? next(settings) : next;
  });
  const hook = renderHook(() => useResizableLayout(setSettings));
  return { ...hook, getSettings: () => settings, setSettings };
};

describe('useResizableLayout', () => {
  it('resizes the sidebar and clock with clamped dimensions', () => {
    const { result, getSettings } = setup();

    act(() => result.current.startResize('main-sidebar'));
    fireEvent.mouseMove(window, { movementX: 200 });
    expect(getSettings().sidebarWidth).toBe(240);
    expect(document.body.style.cursor).toBe('col-resize');

    fireEvent.mouseUp(window);
    expect(document.body.style.cursor).toBe('');

    act(() => result.current.startResize('sidebar-clock'));
    fireEvent.mouseMove(window, { movementY: 260 });
    expect(getSettings().clockHeight).toBe(360);
    expect(document.body.style.cursor).toBe('row-resize');
  });

  it('resizes full and compact board proportions while preserving minimums', () => {
    const board = document.createElement('div');
    board.id = 'kanban-board';
    Object.defineProperty(board, 'clientWidth', { configurable: true, value: 1000 });
    document.body.appendChild(board);
    const compactRight = document.createElement('div');
    compactRight.id = 'compact-right-col';
    Object.defineProperty(compactRight, 'clientHeight', { configurable: true, value: 600 });
    document.body.appendChild(compactRight);

    const { result, getSettings } = setup();

    act(() => result.current.startResize('backlog-in-progress'));
    fireEvent.mouseMove(window, { movementX: 50 });
    expect(getSettings().columnWidths).toMatchObject({ backlog: 30, inProgress: 20 });

    act(() => result.current.startResize('in-progress-done'));
    fireEvent.mouseMove(window, { movementX: 40 });
    expect(getSettings().columnWidths).toMatchObject({ inProgress: 24, done: 21 });

    act(() => result.current.startResize('done-rejected'));
    fireEvent.mouseMove(window, { movementX: 40 });
    expect(getSettings().columnWidths).toMatchObject({ done: 25, rejected: 21 });

    act(() => result.current.startResize('compact-horizontal'));
    fireEvent.mouseMove(window, { movementX: 100 });
    expect(getSettings().compactColumnWidths).toMatchObject({ left: 60, right: 40 });

    act(() => result.current.startResize('compact-vertical'));
    fireEvent.mouseMove(window, { movementY: 60 });
    expect(getSettings().compactHeights).toMatchObject({ done: 60, rejected: 40 });

    board.remove();
    compactRight.remove();
  });
});
