import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
import { KanbanBoard, MobileFocusView, TaskListView } from './TaskBoard';

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
  startResize: vi.fn(),
  onToggleLane: vi.fn(),
  onMoveTask: vi.fn(),
  onReorderTask: vi.fn()
});

describe('KanbanBoard layout controls', () => {
  it('hides and restores every lane body when its collapse button is toggled', () => {
    const Harness = () => {
      const [settings, setSettings] = useState({ ...defaultSettings, layoutPreset: 'full' as const });

      return (
        <KanbanBoard
          {...baseProps(settings)}
          onToggleLane={(status) =>
            setSettings((previous) => ({
              ...previous,
              collapsedBoardLanes: previous.collapsedBoardLanes.includes(status)
                ? previous.collapsedBoardLanes.filter((item) => item !== status)
                : [...previous.collapsedBoardLanes, status]
            }))
          }
        />
      );
    };

    render(<Harness />);

    for (const [status, label, taskTitle] of [
      ['backlog', 'Backlog', 'Backlog item'],
      ['in-progress', 'In-Progress', 'Progress item'],
      ['done', 'Done', 'Done item'],
      ['rejected', 'Rejected', 'Rejected item']
    ]) {
      const column = screen.getByTestId(`board-column-${status}`);

      fireEvent.click(screen.getByRole('button', { name: `Collapse ${label} lane` }));
      expect(column).toHaveAttribute('data-collapsed', 'true');
      expect(within(column).queryByText(taskTitle)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: `Expand ${label} lane` }));
      expect(column).toHaveAttribute('data-collapsed', 'false');
      expect(within(column).getByText(taskTitle)).toBeInTheDocument();
    }
  });

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
  it('collapses a lane and delegates header toggles for persistence', () => {
    const onToggleLane = vi.fn();
    const { rerender } = render(
      <KanbanBoard
        {...baseProps({ ...defaultSettings, collapsedBoardLanes: ['done'] })}
        onToggleLane={onToggleLane}
      />
    );

    expect(screen.getByTestId('board-column-done')).toHaveAttribute('data-collapsed', 'true');
    expect(within(screen.getByTestId('board-column-done')).queryByText('Done item')).not.toBeInTheDocument();
    expect(
      (document.querySelector('#compact-right-col') as HTMLElement).style.getPropertyValue(
        '--kanban-stack-template'
      )
    ).toBe('var(--collapsed-lane-size, 3.5rem) var(--resize-handle-thickness, 4px) 50fr');
    fireEvent.click(screen.getByRole('button', { name: /expand done lane/i }));
    expect(onToggleLane).toHaveBeenCalledWith('done');

    rerender(<KanbanBoard {...baseProps({ ...defaultSettings, collapsedBoardLanes: [] })} />);
    expect(
      (document.querySelector('#compact-right-col') as HTMLElement).style.getPropertyValue(
        '--kanban-stack-template'
      )
    ).toBe('50fr var(--resize-handle-thickness, 4px) 50fr');
  });

  it('minimizes a full-layout column and restores its configured width when expanded', () => {
    const configuredSettings = {
      ...defaultSettings,
      layoutPreset: 'full' as const,
      columnWidths: { ...defaultSettings.columnWidths, backlog: 37 }
    };
    const { rerender } = render(
      <KanbanBoard {...baseProps({ ...configuredSettings, collapsedBoardLanes: ['backlog'] })} />
    );

    const backlogColumn = screen.getByTestId('board-column-backlog');
    expect(within(backlogColumn).getByText('Backlog')).toHaveClass('truncate');
    expect(backlogColumn).toHaveClass('h-auto');
    expect(within(backlogColumn).queryByText('Backlog item')).not.toBeInTheDocument();

    expect(
      (screen.getByTestId('kanban-board').firstElementChild as HTMLElement).style.getPropertyValue(
        '--kanban-grid-template'
      )
    ).toBe(
      '37fr var(--resize-handle-thickness, 4px) 25fr var(--resize-handle-thickness, 4px) 25fr var(--resize-handle-thickness, 4px) 25fr'
    );

    rerender(<KanbanBoard {...baseProps({ ...configuredSettings, collapsedBoardLanes: [] })} />);
    expect(
      (screen.getByTestId('kanban-board').firstElementChild as HTMLElement).style.getPropertyValue(
        '--kanban-grid-template'
      )
    ).toBe(
      '37fr var(--resize-handle-thickness, 4px) 25fr var(--resize-handle-thickness, 4px) 25fr var(--resize-handle-thickness, 4px) 25fr'
    );
  });

  it('offers keyboard and touch-friendly alternatives to dragging tasks', () => {
    const onMoveTask = vi.fn();
    const onReorderTask = vi.fn();
    render(<KanbanBoard {...baseProps()} onMoveTask={onMoveTask} onReorderTask={onReorderTask} />);

    const backlogCard = screen.getByLabelText(/backlog item, backlog/i);
    backlogCard.focus();
    fireEvent.keyDown(backlogCard, { key: 'ArrowRight', altKey: true });
    expect(onMoveTask).toHaveBeenCalledWith('backlog', 'in-progress');
    expect(screen.getByRole('status')).toHaveTextContent('Backlog item moved to In-Progress');

    fireEvent.click(screen.getByRole('button', { name: /move backlog item later/i }));
    expect(onReorderTask).toHaveBeenCalledWith('backlog', 'later');

    const laneSelect = screen.getByRole('combobox', { name: /move backlog item to lane/i });
    fireEvent.change(laneSelect, { target: { value: 'done' } });
    expect(onMoveTask).toHaveBeenCalledWith('backlog', 'done');
  });

  it('keeps task cards scannable by limiting visible tags', () => {
    const props = baseProps();
    props.filteredTasks = [
      normalizeTask({
        id: 'tagged-task',
        title: 'Review platform architecture',
        status: 'backlog',
        tags: ['architecture', 'platform', 'kubernetes', 'security']
      })
    ];

    render(<KanbanBoard {...props} />);

    const card = screen.getByLabelText(/review platform architecture, backlog/i);
    expect(within(card).getByText('architecture')).toBeInTheDocument();
    expect(within(card).getByText('platform')).toBeInTheDocument();
    expect(within(card).queryByText('kubernetes')).not.toBeInTheDocument();
    expect(within(card).getByText('+2')).toBeInTheDocument();
  });
});

describe('MobileFocusView actions', () => {
  it('starts, completes, rejects, and advances focused work', () => {
    const current = normalizeTask({
      id: 'current',
      title: 'Current task',
      status: 'in-progress'
    });
    const next = normalizeTask({
      id: 'next',
      title: 'Next task',
      status: 'in-progress'
    });
    const onStartTask = vi.fn();
    const onCompleteTask = vi.fn();
    const onRejectTask = vi.fn();
    const onNextTask = vi.fn();

    render(
      <MobileFocusView
        filteredTasks={[current, next]}
        currentTask={current}
        setSelectedTaskId={vi.fn()}
        now={Date.now()}
        onStartTask={onStartTask}
        onCompleteTask={onCompleteTask}
        onRejectTask={onRejectTask}
        onNextTask={onNextTask}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start current task/i }));
    fireEvent.click(screen.getByRole('button', { name: /complete current task/i }));
    fireEvent.click(screen.getByRole('button', { name: /reject current task/i }));
    fireEvent.click(screen.getByRole('button', { name: /start next task/i }));

    expect(onStartTask).toHaveBeenCalledWith('current');
    expect(onCompleteTask).toHaveBeenCalledWith('current');
    expect(onRejectTask).toHaveBeenCalledWith('current');
    expect(onNextTask).toHaveBeenCalledWith('next');
  });

  it('presents a concise Today queue instead of an unbounded board', () => {
    const current = normalizeTask({ id: 'current', title: 'Current task', status: 'in-progress' });
    const queued = Array.from({ length: 5 }, (_, index) =>
      normalizeTask({ id: `next-${index}`, title: `Next task ${index + 1}`, status: 'in-progress' })
    );

    render(
      <MobileFocusView
        filteredTasks={[current, ...queued]}
        currentTask={current}
        setSelectedTaskId={vi.fn()}
        now={Date.now()}
        onStartTask={vi.fn()}
        onCompleteTask={vi.fn()}
        onRejectTask={vi.fn()}
        onNextTask={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Next task 3')).toBeInTheDocument();
    expect(screen.queryByText('Next task 4')).not.toBeInTheDocument();
    expect(screen.getByText('2 more in Board')).toBeInTheDocument();
  });
});

describe('TaskListView mobile quick actions', () => {
  it('starts, completes, and rejects active task cards without opening the modal', () => {
    const onStartTask = vi.fn();
    const onCompleteTask = vi.fn();
    const onRejectTask = vi.fn();
    const setSelectedTaskId = vi.fn();
    render(
      <TaskListView
        filteredTasks={[normalizeTask({ id: 'mobile-task', title: 'Mobile task', status: 'backlog' })]}
        setSelectedTaskId={setSelectedTaskId}
        now={Date.now()}
        onStartTask={onStartTask}
        onCompleteTask={onCompleteTask}
        onRejectTask={onRejectTask}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start mobile task/i }));
    fireEvent.click(screen.getByRole('button', { name: /complete mobile task/i }));
    fireEvent.click(screen.getByRole('button', { name: /reject mobile task/i }));

    expect(onStartTask).toHaveBeenCalledWith('mobile-task');
    expect(onCompleteTask).toHaveBeenCalledWith('mobile-task');
    expect(onRejectTask).toHaveBeenCalledWith('mobile-task');
    expect(setSelectedTaskId).not.toHaveBeenCalled();
  });
});

describe('TaskListView virtualization', () => {
  it('mounts only the visible window for a large task list', () => {
    const tasks = Array.from({ length: 120 }, (_, index) =>
      normalizeTask({ id: `task-${index}`, title: `Task ${index}`, status: 'backlog' })
    );
    render(
      <TaskListView
        filteredTasks={tasks}
        setSelectedTaskId={vi.fn()}
        now={Date.now()}
        onStartTask={vi.fn()}
        onCompleteTask={vi.fn()}
        onRejectTask={vi.fn()}
      />
    );

    const list = screen.getByTestId('virtualized-task-list');
    const totalItems = Number(list.getAttribute('data-total-items'));
    const virtualItems = Number(list.getAttribute('data-virtual-items'));
    expect(virtualItems).toBeGreaterThan(0);
    expect(virtualItems).toBeLessThan(totalItems);
    expect(within(list).getByText('Task 0')).toBeInTheDocument();
    expect(within(list).queryByText('Task 119')).not.toBeInTheDocument();
  });
});
