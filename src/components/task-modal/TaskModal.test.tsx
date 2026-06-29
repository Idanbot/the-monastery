import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
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

let mockDraftTask: any = null;
let mockDraftNote = '';
let mockDraftIsDirty = false;
let mockDraftSavedAt: any = null;
let mockDraftSaveStatus = 'saved';
let mockShowDirtyClosePrompt = false;
let mockShowDeleteTaskPrompt = false;

const mockSetDraftNote = vi.fn();
const mockSetShowDirtyClosePrompt = vi.fn();
const mockSetShowDeleteTaskPrompt = vi.fn();
const mockUpdateDraftTask = vi.fn();
const mockSaveDraftTask = vi.fn();
const mockCloseTaskModal = vi.fn();
const mockDiscardDraftTask = vi.fn();
const mockDeleteDraftTask = vi.fn();

vi.mock('../../hooks/useTaskDraft', () => ({
  useTaskDraft: () => ({
    draftTask: mockDraftTask,
    draftNote: mockDraftNote,
    setDraftNote: mockSetDraftNote,
    draftIsDirty: mockDraftIsDirty,
    draftSavedAt: mockDraftSavedAt,
    draftSaveStatus: mockDraftSaveStatus,
    showDirtyClosePrompt: mockShowDirtyClosePrompt,
    setShowDirtyClosePrompt: mockSetShowDirtyClosePrompt,
    showDeleteTaskPrompt: mockShowDeleteTaskPrompt,
    setShowDeleteTaskPrompt: mockSetShowDeleteTaskPrompt,
    updateDraftTask: mockUpdateDraftTask,
    saveDraftTask: mockSaveDraftTask,
    closeTaskModal: mockCloseTaskModal,
    discardDraftTask: mockDiscardDraftTask,
    deleteDraftTask: mockDeleteDraftTask,
  })
}));

vi.mock('../../contexts/SettingsContext', () => ({
  useSettingsContext: () => ({
    settings: defaultSettings,
    isDarkMode: false,
  })
}));

vi.mock('../../contexts/TaskContext', () => ({
  useTaskContext: () => ({
    tasks: [],
    setTasks: vi.fn(),
    selectedTaskId: 'task-1',
    setSelectedTaskId: vi.fn(),
    tagPool: ['import', 'backend'],
    registerTags: vi.fn(),
    resolveTaskTags: (t: any) => t,
  })
}));

vi.mock('../../contexts/UIContext', () => ({
  useUIContext: () => ({
    now: new Date('2026-06-23T09:30:00.000Z').getTime(),
  })
}));

const setupMockState = (overrides: any = {}) => {
  mockDraftTask = overrides.draftTask !== undefined ? overrides.draftTask : baseTask();
  mockDraftNote = overrides.draftNote || '';
  mockDraftIsDirty = overrides.draftIsDirty || false;
  mockDraftSavedAt = overrides.draftSavedAt || null;
  mockDraftSaveStatus = overrides.draftSaveStatus || 'saved';
  mockShowDirtyClosePrompt = overrides.showDirtyClosePrompt || false;
  mockShowDeleteTaskPrompt = overrides.showDeleteTaskPrompt || false;

  mockSetDraftNote.mockClear();
  mockSetShowDirtyClosePrompt.mockClear();
  mockSetShowDeleteTaskPrompt.mockClear();
  mockUpdateDraftTask.mockClear();
  mockSaveDraftTask.mockClear();
  mockCloseTaskModal.mockClear();
  mockDiscardDraftTask.mockClear();
  mockDeleteDraftTask.mockClear();
};

describe('TaskModal', () => {
  it('shows save state and saves then closes from the header', async () => {
    const user = userEvent.setup();
    setupMockState({ draftIsDirty: true });

    render(<TaskModal />);

    // In TaskModal.tsx, hasUnsavedChanges triggers "Unsaved modifications" text in the footer.
    expect(screen.getByText(/unsaved modifications/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(mockSaveDraftTask).toHaveBeenCalledTimes(1);
  });

  it('offers explicit status transition actions', async () => {
    const user = userEvent.setup();
    setupMockState();

    render(<TaskModal />);

    await user.click(screen.getByRole('button', { name: /move task to in-progress/i }));
    expect(mockUpdateDraftTask).toHaveBeenCalledWith({ status: 'in-progress' });
  });

  it('adds a note through the notes section without opening activity by default', async () => {
    const user = userEvent.setup();
    setupMockState({
      draftNote: 'Remember the rollback plan',
    });

    render(<TaskModal />);

    // Click on Note input to expand/add
    await user.click(screen.getByRole('button', { name: /add note/i }));

    expect(mockUpdateDraftTask).toHaveBeenCalledWith({
      activity: expect.arrayContaining([
        expect.objectContaining({ type: 'note', text: 'Remember the rollback plan' })
      ])
    });
    expect(mockSetDraftNote).toHaveBeenCalledWith('');
  });

  it('routes close, dirty discard, and delete confirmations to their callbacks', async () => {
    const user = userEvent.setup();
    setupMockState({
      showDirtyClosePrompt: true,
      showDeleteTaskPrompt: true
    });

    render(<TaskModal />);

    // Click close icon in header
    await user.click(screen.getByRole('button', { name: /close task details/i }));
    expect(mockCloseTaskModal).toHaveBeenCalledTimes(1);

    // Discard changes confirmation button
    await user.click(screen.getAllByRole('button', { name: /^discard$/i }).at(-1)!);
    expect(mockDiscardDraftTask).toHaveBeenCalledTimes(1);

    // Delete confirmation button
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(mockDeleteDraftTask).toHaveBeenCalledTimes(1);
  });
});
