import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
import { MobileLaneBoard } from './MobileLaneBoard';

describe('MobileLaneBoard', () => {
  it('shows one lane at a time, defaults to active work, and exposes task counts', async () => {
    const user = userEvent.setup();
    render(
      <MobileLaneBoard
        filteredTasks={[
          normalizeTask({ id: 'backlog', title: 'Backlog item', status: 'backlog' }),
          normalizeTask({ id: 'progress', title: 'Progress item', status: 'in-progress' }),
          normalizeTask({ id: 'done', title: 'Done item', status: 'done' })
        ]}
        settings={defaultSettings}
        columnSorts={{ backlog: 'none', 'in-progress': 'none', done: 'none', rejected: 'none' }}
        cycleSort={vi.fn()}
        draggedTaskId={null}
        dragOverInfo={null}
        setDraggedTaskId={vi.fn()}
        setDragOverInfo={vi.fn()}
        handleDragOver={vi.fn()}
        handleDrop={vi.fn()}
        handleDragStart={vi.fn()}
        setSelectedTaskId={vi.fn()}
        keyboardFocusedTaskId={null}
        now={Date.now()}
        onToggleLane={vi.fn()}
        onMoveTask={vi.fn()}
        onReorderTask={vi.fn()}
      />
    );

    expect(screen.getByRole('tab', { name: 'In-Progress, 1 task' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/progress item, in-progress/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/backlog item, backlog/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Backlog, 1 task' }));
    expect(screen.getByLabelText(/backlog item, backlog/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/progress item, in-progress/i)).not.toBeInTheDocument();
  });
});
