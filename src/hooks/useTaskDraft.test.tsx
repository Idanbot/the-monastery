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

  it('records a subtask completion once when it is marked done', async () => {
    const original = normalizeTask({
      id: 'task-1',
      title: 'Migration plan',
      subtasks: [
        {
          id: 'subtask-1',
          title: 'Validate routes',
          status: 'in-progress',
          logs: [],
          activeLogStart: null,
          tags: []
        }
      ]
    });
    const { result } = renderHook(() => {
      const [tasks, setTasks] = useState([original]);
      const [selectedTaskId, setSelectedTaskId] = useState<string | null>(original.id);
      const draft = useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId });
      return { ...draft, tasks };
    });

    await waitFor(() => expect(result.current.draftTask?.subtasks[0]?.status).toBe('in-progress'));
    act(() =>
      result.current.updateDraftTask({
        subtasks: result.current.draftTask?.subtasks.map((subtask) => ({ ...subtask, status: 'done' }))
      })
    );
    await waitFor(() => expect(result.current.draftTask?.subtasks[0]?.status).toBe('done'));
    act(() => result.current.saveDraftTask());

    expect(result.current.tasks[0].activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'subtask-completed',
          text: 'Completed subtask: Validate routes'
        })
      ])
    );
    act(() => result.current.saveDraftTask());
    expect(
      result.current.tasks[0].activity.filter((entry) => entry.kind === 'subtask-completed')
    ).toHaveLength(1);
  });

  it('records a task completion once when its modal status is changed to done', async () => {
    const original = normalizeTask({
      id: 'task-1',
      title: 'Finish migration',
      status: 'in-progress',
      activeLogStart: '2026-07-17T08:00:00.000Z'
    });
    const { result } = renderHook(() => {
      const [tasks, setTasks] = useState([original]);
      const [selectedTaskId, setSelectedTaskId] = useState<string | null>(original.id);
      const draft = useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId });
      return { ...draft, tasks };
    });

    await waitFor(() => expect(result.current.draftTask?.status).toBe('in-progress'));
    act(() => result.current.updateDraftTask({ status: 'done' }));
    await waitFor(() => expect(result.current.draftTask?.status).toBe('done'));
    act(() => result.current.saveDraftTask());

    expect(result.current.tasks[0]).toMatchObject({ status: 'done', activeLogStart: null });
    expect(result.current.tasks[0].activity.at(-1)).toMatchObject({
      kind: 'task-completed',
      text: 'Status changed to done'
    });
    act(() => result.current.saveDraftTask());
    expect(result.current.tasks[0].activity.filter((entry) => entry.kind === 'task-completed')).toHaveLength(
      1
    );
  });
});
