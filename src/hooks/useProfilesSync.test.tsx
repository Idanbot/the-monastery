import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../lib/api';
import { defaultSettings, normalizeTask } from '../domain/tasks';
import { useProfilesSync } from './useProfilesSync';
import type { Task } from '../domain/types';

vi.mock('../lib/api', () => ({
  shouldUseBackend: () => true,
  apiRequest: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('useProfilesSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(apiRequest).mockImplementation(async (path, options) => {
      if (path === '/api/profiles') {
        return { profiles: [{ id: 'default', name: 'Default', taskCount: 0 }] };
      }
      if (path.endsWith('/tasks') && !options?.method) return { tasks: [], revision: 3 };
      if (path.endsWith('/settings') && !options?.method) return { settings: null, revision: 3 };
      return { ok: true, revision: 4 };
    });
  });

  it('does not write loaded profile data and saves the next mutation with its revision', async () => {
    const { result } = renderHook(() => {
      const [tasks, setTasks] = useState<Task[]>([]);
      const [settings, setSettings] = useState(defaultSettings);
      const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
      const sync = useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId });
      return { ...sync, tasks, setTasks, selectedTaskId };
    });

    await waitFor(() => expect(result.current.persistenceStatus).toBe('saved'));
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(vi.mocked(apiRequest).mock.calls.filter(([, options]) => options?.method)).toHaveLength(0);

    act(() => {
      result.current.setTasks([normalizeTask({ id: 'new-task', title: 'New task' })]);
    });

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/profiles/default/tasks',
        expect.objectContaining({ method: 'POST' })
      )
    );
    const saveCall = vi.mocked(apiRequest).mock.calls.find(([, options]) => options?.method === 'POST');
    expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({ baseRevision: 3 });
  });

  it('uses the settings revision (not the tasks revision) for settings saves', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path, options) => {
      if (path === '/api/profiles') {
        return { profiles: [{ id: 'default', name: 'Default', taskCount: 0 }] };
      }
      if (path.endsWith('/tasks') && !options?.method) return { tasks: [], revision: 7 };
      if (path.endsWith('/settings') && !options?.method) return { settings: null, revision: 2 };
      return { ok: true, revision: 3 };
    });

    const { result } = renderHook(() => {
      const [tasks, setTasks] = useState<Task[]>([]);
      const [settings, setSettings] = useState(defaultSettings);
      const [, setSelectedTaskId] = useState<string | null>(null);
      const sync = useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId });
      return { ...sync, tasks, setTasks, settings, setSettings };
    });

    await waitFor(() => expect(result.current.persistenceStatus).toBe('saved'));
    await new Promise((resolve) => setTimeout(resolve, 500));

    act(() => {
      result.current.setSettings({ ...result.current.settings, dailyGoal: 'Ship the refactor' });
    });

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/profiles/default/settings',
        expect.objectContaining({ method: 'PUT' })
      )
    );
    const saveCall = vi.mocked(apiRequest).mock.calls.find(([, options]) => options?.method === 'PUT');
    expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({ baseRevision: 2 });
  });

  it('surfaces a 409 conflict as a persistence error', async () => {
    vi.mocked(apiRequest).mockImplementation(async (path, options) => {
      if (path === '/api/profiles') {
        return { profiles: [{ id: 'default', name: 'Default', taskCount: 0 }] };
      }
      if (path.endsWith('/tasks') && !options?.method) return { tasks: [], revision: 1 };
      if (path.endsWith('/settings') && !options?.method) return { settings: null, revision: 1 };
      if (options?.method === 'POST') {
        const error = new Error('Profile changed elsewhere.');
        throw error;
      }
      return { ok: true, revision: 2 };
    });

    const { result } = renderHook(() => {
      const [tasks, setTasks] = useState<Task[]>([]);
      const [settings, setSettings] = useState(defaultSettings);
      const [, setSelectedTaskId] = useState<string | null>(null);
      const sync = useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId });
      return { ...sync, tasks, setTasks };
    });

    await waitFor(() => expect(result.current.persistenceStatus).toBe('saved'));
    await new Promise((resolve) => setTimeout(resolve, 500));

    act(() => {
      result.current.setTasks([normalizeTask({ id: 'conflict-task', title: 'Conflict' })]);
    });

    await waitFor(() => expect(result.current.persistenceStatus).toBe('error'));
    expect(result.current.profileError).toBe('Profile changed elsewhere.');
  });
});
