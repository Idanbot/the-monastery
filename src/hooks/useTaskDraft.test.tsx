import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { normalizeTask } from '../domain/tasks';
import { useTaskDraft } from './useTaskDraft';

describe('useTaskDraft', () => {
  it('restores the opening snapshot when an autosaved dirty draft is discarded', async () => {
    const original = normalizeTask({ id: 'task-1', title: 'Original title' });
    const { result } = renderHook(() => {
      const [tasks, setTasks] = useState([original]);
      const [selectedTaskId, setSelectedTaskId] = useState<string | null>(original.id);
      const draft = useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId });
      return { ...draft, tasks, selectedTaskId };
    });

    await waitFor(() => expect(result.current.draftTask?.title).toBe('Original title'));

    act(() => result.current.updateDraftTask({ title: 'Discarded title' }));
    act(() => result.current.saveDraftTask());
    expect(result.current.tasks[0].title).toBe('Discarded title');
    expect(result.current.draftIsDirty).toBe(false);

    act(() => result.current.discardDraftTask());
    expect(result.current.tasks[0].title).toBe('Original title');
    expect(result.current.selectedTaskId).toBeNull();
  });
});
