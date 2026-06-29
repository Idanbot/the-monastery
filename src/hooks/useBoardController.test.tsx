import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeTask } from '../domain/tasks';
import { useBoardController } from './useBoardController';

describe('useBoardController', () => {
  it('cycles lane sorting and moves a dropped task', () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useBoardController(setTasks));

    act(() => result.current.cycleSort('backlog'));
    expect(result.current.columnSorts.backlog).toBe('urgency');

    act(() => result.current.setDraggedTaskId('task'));
    const event = {
      preventDefault: vi.fn(),
      target: { style: { opacity: '0.5' } }
    };
    act(() => result.current.handleDrop(event, 'in-progress'));

    const update = setTasks.mock.lastCall?.[0];
    const tasks = update([normalizeTask({ id: 'task', title: 'Task', status: 'backlog' })]);
    expect(tasks[0].status).toBe('in-progress');
    expect(event.target.style.opacity).toBe('1');
  });

  it('builds a drag preview and tracks pointer position', () => {
    vi.useFakeTimers();
    const setTasks = vi.fn();
    const { result } = renderHook(() => useBoardController(setTasks));
    const card = document.createElement('div');
    const target = document.createElement('div');
    const dataTransfer = { effectAllowed: '', setDragImage: vi.fn() };

    act(() => result.current.handleDragStart({ currentTarget: card, target, dataTransfer }, 'task'));
    expect(dataTransfer.effectAllowed).toBe('move');
    expect(dataTransfer.setDragImage).toHaveBeenCalled();

    act(() =>
      result.current.handleDragOver(
        {
          preventDefault: vi.fn(),
          clientY: 10,
          currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) }
        },
        'done',
        'target'
      )
    );
    expect(result.current.dragOverInfo).toEqual({ status: 'done', id: 'target', position: 'top' });

    act(() => vi.runAllTimers());
    expect(target.style.opacity).toBe('0.5');
    vi.useRealTimers();
  });

  it('inserts a dropped task relative to the hovered task', () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useBoardController(setTasks));
    act(() => {
      result.current.setDraggedTaskId('dragged');
      result.current.setDragOverInfo({ status: 'backlog', id: 'target', position: 'top' });
    });

    act(() =>
      result.current.handleDrop({ preventDefault: vi.fn(), target: { style: { opacity: '0.5' } } }, 'backlog')
    );
    const update = setTasks.mock.lastCall?.[0];
    const tasks = update([
      normalizeTask({ id: 'target', title: 'Target' }),
      normalizeTask({ id: 'dragged', title: 'Dragged' })
    ]);
    expect(tasks.map((task) => task.id)).toEqual(['dragged', 'target']);
  });

  it('moves and reorders tasks without a pointer drag', () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useBoardController(setTasks));
    const initial = [
      normalizeTask({ id: 'first', title: 'First', status: 'backlog' }),
      normalizeTask({ id: 'second', title: 'Second', status: 'backlog' })
    ];

    act(() => result.current.moveTask('first', 'done'));
    expect(setTasks.mock.lastCall?.[0](initial)[0].status).toBe('done');

    act(() => result.current.reorderTask('second', 'earlier'));
    expect(setTasks.mock.lastCall?.[0](initial).map((task) => task.id)).toEqual(['second', 'first']);
  });
});
