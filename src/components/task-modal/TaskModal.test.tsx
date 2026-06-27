import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { TaskModal } from './TaskModal';

const baseTask = () =>
  normalizeTask({
    id: 'task-1',
    title: 'Design importer',
    urgency: 4,
    tags: ['import'],
    scheduledDate: '2026-06-23',
    scheduledStart: '09:00',
    scheduledEnd: '10:00',
    activity: [{ id: 'a-1', type: 'note', text: 'Existing note', timestamp: '2026-06-23T08:00:00.000Z' }]
  });

const defaultProps = (overrides = {}) => ({
  draftTask: baseTask(),
  draftNote: '',
  setDraftNote: vi.fn(),
  draftIsDirty: false,
  draftSavedAt: null,
  modalSections: { timer: false, notes: false, activity: false },
  setModalSections: vi.fn(),
  now: new Date('2026-06-23T09:30:00.000Z').getTime(),
  clockFormat: '24h' as const,
  updateDraftTask: vi.fn(),
  closeTaskModal: vi.fn(),
  saveDraftTask: vi.fn(),
  closeAfterSave: vi.fn(),
  showDeleteTaskPrompt: false,
  setShowDeleteTaskPrompt: vi.fn(),
  deleteDraftTask: vi.fn(),
  showDirtyClosePrompt: false,
  setShowDirtyClosePrompt: vi.fn(),
  discardDraftTask: vi.fn(),
  tagPool: ['import', 'backend'],
  ...overrides
});

describe('TaskModal', () => {
  it('shows save state and saves then closes from the header', async () => {
    const user = userEvent.setup();
    const saveDraftTask = vi.fn();
    const closeAfterSave = vi.fn();

    render(<TaskModal {...defaultProps({ draftIsDirty: true, saveDraftTask, closeAfterSave })} />);

    expect(screen.getByTestId('task-save-state')).toHaveTextContent(/unsaved changes/i);
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(saveDraftTask).toHaveBeenCalledTimes(1);
    expect(closeAfterSave).toHaveBeenCalledTimes(1);
  });

  it('offers explicit status transition actions', async () => {
    const user = userEvent.setup();
    const updateDraftTask = vi.fn();

    render(<TaskModal {...defaultProps({ updateDraftTask })} />);

    await user.click(screen.getByRole('button', { name: /move task to in-progress/i }));
    expect(updateDraftTask).toHaveBeenCalledWith({ status: 'in-progress' });
  });

  it('adds a note through the notes section without opening activity by default', async () => {
    const user = userEvent.setup();
    const updateDraftTask = vi.fn();
    const setDraftNote = vi.fn();

    render(
      <TaskModal
        {...defaultProps({
          draftNote: 'Remember the rollback plan',
          modalSections: { timer: false, notes: true, activity: false },
          updateDraftTask,
          setDraftNote
        })}
      />
    );

    expect(screen.queryByText(/existing note/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add note/i }));

    expect(updateDraftTask).toHaveBeenCalledWith({
      activity: expect.arrayContaining([
        expect.objectContaining({ type: 'note', text: 'Remember the rollback plan' })
      ])
    });
    expect(setDraftNote).toHaveBeenCalledWith('');
  });

  it('routes close, dirty discard, and delete confirmations to their callbacks', async () => {
    const user = userEvent.setup();
    const closeTaskModal = vi.fn();
    const discardDraftTask = vi.fn();
    const deleteDraftTask = vi.fn();

    render(
      <TaskModal
        {...defaultProps({
          closeTaskModal,
          discardDraftTask,
          deleteDraftTask,
          showDirtyClosePrompt: true,
          showDeleteTaskPrompt: true
        })}
      />
    );

    await user.click(screen.getByTitle(/close/i));
    expect(closeTaskModal).toHaveBeenCalledWith({ promptToSave: true });

    await user.click(screen.getAllByRole('button', { name: /^discard$/i }).at(-1)!);
    expect(discardDraftTask).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^delete task$/i }));
    expect(deleteDraftTask).toHaveBeenCalledTimes(1);
  });
});
