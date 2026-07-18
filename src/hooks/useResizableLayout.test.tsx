import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResizableLayout } from './useResizableLayout';

const baseSettings = () => ({
  sidebarWidth: 320,
  clockHeight: 160,
  mainViewColumnSplit: 50,
  mainViewRowSplit: 50,
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
  it('resizes the main view tracks in both directions with bounded proportions', () => {
    const grid = document.createElement('div');
    grid.id = 'main-view-grid';
    Object.defineProperties(grid, {
      clientWidth: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 800 }
    });
    document.body.appendChild(grid);
    const { result, getSettings } = setup();

    act(() => result.current.startResize('main-view-columns'));
    fireEvent.mouseMove(window, { movementX: 100 });
    expect(getSettings().mainViewColumnSplit).toBe(60);
    expect(document.body.style.cursor).toBe('col-resize');

    act(() => result.current.startResize('main-view-rows'));
    fireEvent.mouseMove(window, { movementY: 80 });
    expect(getSettings().mainViewRowSplit).toBe(60);
    expect(document.body.style.cursor).toBe('row-resize');

    fireEvent.mouseMove(window, { movementY: 800 });
    expect(getSettings().mainViewRowSplit).toBe(80);
    grid.remove();
  });

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
    const compactLeft = document.createElement('div');
    compactLeft.id = 'compact-left-col';
    Object.defineProperty(compactLeft, 'clientHeight', { configurable: true, value: 600 });
    document.body.appendChild(compactLeft);
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

    act(() => result.current.startResize('columns-group:in-progress:done,rejected'));
    fireEvent.mouseMove(window, { movementX: 20 });
    expect(getSettings().columnWidths).toMatchObject({ inProgress: 26, done: 24, rejected: 20 });

    act(() => result.current.startResize('compact-horizontal'));
    fireEvent.mouseMove(window, { movementX: 100 });
    expect(getSettings().compactColumnWidths).toMatchObject({ left: 60, right: 40 });

    act(() => result.current.startResize('stack:backlog:in-progress:compact-left-col'));
    fireEvent.mouseMove(window, { movementY: 60 });
    expect(getSettings().compactHeights).toMatchObject({ backlog: 60, inProgress: 40 });

    act(() => result.current.startResize('compact-vertical'));
    fireEvent.mouseMove(window, { movementY: 60 });
    expect(getSettings().compactHeights).toMatchObject({ done: 60, rejected: 40 });

    board.remove();
    compactLeft.remove();
    compactRight.remove();
  });
});
