import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
import { KanbanBoard } from './TaskBoard';

const baseProps = (settings = defaultSettings) => ({
  filteredTasks: [
    normalizeTask({ id: 'backlog', title: 'Backlog item', status: 'backlog' }),
    normalizeTask({ id: 'progress', title: 'Progress item', status: 'in-progress' }),
    normalizeTask({ id: 'done', title: 'Done item', status: 'done' }),
    normalizeTask({ id: 'rejected', title: 'Rejected item', status: 'rejected' })
  ],
  settings,
  columnSorts: { backlog: 'none', 'in-progress': 'none', done: 'none', rejected: 'none' },
  cycleSort: vi.fn(),
  draggedTaskId: null,
  dragOverInfo: null,
  setDraggedTaskId: vi.fn(),
  setDragOverInfo: vi.fn(),
  handleDragOver: vi.fn(),
  handleDrop: vi.fn(),
  handleDragStart: vi.fn(),
  setSelectedTaskId: vi.fn(),
  keyboardFocusedTaskId: null,
  now: Date.now(),
  startResize: vi.fn()
});

describe('KanbanBoard layout controls', () => {
  it('renders compact split order and resize handles from settings', () => {
    const props = baseProps({
      ...defaultSettings,
      layoutPreset: 'compact',
      boardColumnOrder: {
        ...defaultSettings.boardColumnOrder,
        compactActive: ['in-progress', 'backlog'],
        compactDone: ['rejected', 'done']
      }
    });

    render(<KanbanBoard {...props} />);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(['In-Progress', 'Backlog', 'Rejected', 'Done']);
    expect(
      screen.getByTestId('board-resizer-stack:in-progress:backlog:compact-left-col')
    ).toBeInTheDocument();
    expect(screen.getByTestId('board-resizer-compact-horizontal')).toBeInTheDocument();
    expect(screen.getByTestId('board-resizer-stack:rejected:done:compact-right-col')).toBeInTheDocument();
  });

  it('renders 3-column and full layout resize handles and honors hide setting', () => {
    const threeColumnProps = baseProps({
      ...defaultSettings,
      layoutPreset: 'three-column',
      boardColumnOrder: {
        ...defaultSettings.boardColumnOrder,
        threeColumn: ['in-progress', 'backlog', 'rejected', 'done']
      }
    });
    const { rerender } = render(<KanbanBoard {...threeColumnProps} />);

    expect(screen.getByTestId('kanban-board')).toHaveAttribute('data-layout-preset', 'three-column');
    expect(screen.getByTestId('board-resizer-columns:in-progress:backlog')).toBeInTheDocument();
    expect(screen.getByTestId('board-resizer-columns-group:backlog:rejected,done')).toBeInTheDocument();
    expect(screen.getByTestId('board-resizer-stack:rejected:done:three-outcomes-col')).toBeInTheDocument();

    rerender(<KanbanBoard {...baseProps({ ...defaultSettings, layoutPreset: 'full' })} />);
    expect(screen.getByTestId('board-resizer-columns:backlog:in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('board-resizer-columns:in-progress:done')).toBeInTheDocument();
    expect(screen.getByTestId('board-resizer-columns:done:rejected')).toBeInTheDocument();

    rerender(
      <KanbanBoard {...baseProps({ ...defaultSettings, layoutPreset: 'full', resizeHandleVisible: false })} />
    );
    expect(within(screen.getByTestId('kanban-board')).queryByTestId(/board-resizer/)).not.toBeInTheDocument();
  });
});
