import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings, defaultTasks } from '../domain/tasks';
import { useLocalFallbackPersistence } from './useLocalFallbackPersistence';
import * as api from '../lib/api';

vi.mock('../lib/api', () => ({
  shouldUseBackend: vi.fn(() => false),
  apiRequest: vi.fn()
}));

vi.mock('../lib/storage', () => ({
  hasIndexedDb: () => true,
  settingsStorageKey: 'settings',
  tasksStorageKey: 'tasks',
  parseStoredJson: (_key: string, fallback: unknown) => fallback,
  getIndexedDbValue: vi.fn(),
  setIndexedDbValue: vi.fn(() => Promise.resolve()),
  writeStoredJson: vi.fn(() => true)
}));

const { getIndexedDbValue } = await import('../lib/storage');

describe('useLocalFallbackPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads from IndexedDB when the backend is unavailable', async () => {
    vi.mocked(api.shouldUseBackend).mockReturnValue(false);
    vi.mocked(getIndexedDbValue).mockImplementation(async (key: string) =>
      key === 'tasks' ? [{ id: 'local-task', title: 'Local' }] : { ...defaultSettings, dailyGoal: 'local' }
    );

    const setTasks = vi.fn();
    const setSettings = vi.fn();

    const { result } = renderHook(() =>
      useLocalFallbackPersistence({
        tasks: defaultTasks,
        setTasks,
        settings: defaultSettings,
        setSettings,
        isProfileReady: true
      })
    );

    await waitFor(() => expect(result.current.isStorageReady).toBe(true));
    expect(setTasks).toHaveBeenCalled();
    expect(setSettings).toHaveBeenCalled();
  });

  it('does NOT read from IndexedDB when the backend is available (avoids clobbering server data)', async () => {
    vi.mocked(api.shouldUseBackend).mockReturnValue(true);
    vi.mocked(getIndexedDbValue).mockResolvedValue([{ id: 'stale-local-task' }]);

    const setTasks = vi.fn();
    const setSettings = vi.fn();

    const { result } = renderHook(() =>
      useLocalFallbackPersistence({
        tasks: defaultTasks,
        setTasks,
        settings: defaultSettings,
        setSettings,
        isProfileReady: true
      })
    );

    await waitFor(() => expect(result.current.isStorageReady).toBe(true));
    expect(getIndexedDbValue).not.toHaveBeenCalled();
    expect(setTasks).not.toHaveBeenCalled();
    expect(setSettings).not.toHaveBeenCalled();
  });
});
