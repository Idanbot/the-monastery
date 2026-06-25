import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../domain/tasks';
import { downloadJson } from '../lib/download';
import { backupHistoryStorageKey } from '../lib/storage';
import { apiRequest } from '../lib/api';
import { useBackupActions } from './useBackupActions';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

vi.mock('../lib/download', () => ({
  downloadJson: vi.fn()
}));

vi.mock('../lib/api', () => ({
  apiRequest: vi.fn()
}));

const task = normalizeTask({ id: 'task-1', title: 'Backup task', status: 'backlog' });

const setup = (options: { isBackendAvailable?: boolean } = {}) => {
  const setTasks = vi.fn();
  const setSettings = vi.fn();
  const setSelectedTaskId = vi.fn();
  const setIsSettingsOpen = vi.fn();
  const hook = renderHook(() =>
    useBackupActions({
      tasks: [task],
      setTasks,
      settings: { ...defaultSettings, visualTheme: 'liquid-glass' },
      setSettings,
      activeProfile: { id: 'profile-1', name: 'Main profile' },
      activeProfileId: 'profile-1',
      isBackendAvailable: options.isBackendAvailable ?? false,
      setSelectedTaskId,
      setIsSettingsOpen
    })
  );
  return { ...hook, setTasks, setSettings, setSelectedTaskId, setIsSettingsOpen };
};

describe('useBackupActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('exports tasks, schema, and theme recipe JSON files', () => {
    const { result } = setup();

    act(() => result.current.exportTasks());
    expect(downloadJson).toHaveBeenCalledWith(
      'the-monastery-tasks.json',
      expect.objectContaining({ tasks: [expect.objectContaining({ id: 'task-1' })] })
    );

    act(() => result.current.exportTaskSchema());
    expect(downloadJson).toHaveBeenCalledWith('the-monastery-task.schema.json', expect.any(Object));

    act(() => result.current.exportThemeRecipe());
    expect(downloadJson).toHaveBeenCalledWith(
      expect.stringMatching(/^the-monastery-theme-/),
      expect.objectContaining({ css: expect.stringContaining('--theme-main') })
    );
  });

  it('creates local and backend backups while retaining local history', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.backupData();
    });

    expect(downloadJson).toHaveBeenCalledWith(
      expect.stringMatching(/^the-monastery-backup-/),
      expect.objectContaining({ profiles: [expect.objectContaining({ id: 'profile-1' })] })
    );
    expect(JSON.parse(localStorage.getItem(backupHistoryStorageKey) || '[]')).toHaveLength(1);

    vi.mocked(apiRequest).mockResolvedValueOnce({ schemaVersion: 1, profiles: [] });
    const backend = setup({ isBackendAvailable: true });
    await act(async () => {
      await backend.result.current.backupData();
    });

    expect(apiRequest).toHaveBeenCalledWith('/api/backup');
    expect(downloadJson).toHaveBeenLastCalledWith(
      expect.stringMatching(/^the-monastery-backup-/),
      expect.objectContaining({ schemaVersion: 1 })
    );
  });

  it('restores and removes local backups', () => {
    const saved = {
      id: 'backup-1',
      label: 'Saved backup',
      createdAt: new Date().toISOString(),
      taskCount: 1,
      profileName: 'Main profile',
      settings: { ...defaultSettings, visualTheme: 'obsidian-glass' },
      tasks: [{ id: 'restored', title: 'Restored task', status: 'new' }]
    };
    localStorage.setItem(backupHistoryStorageKey, JSON.stringify([saved]));
    const { result, setTasks, setSettings, setSelectedTaskId, setIsSettingsOpen } = setup();

    act(() => result.current.restoreLocalBackup('backup-1'));
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ visualTheme: 'obsidian-glass' }));
    expect(setTasks).toHaveBeenCalledWith([expect.objectContaining({ id: 'restored', status: 'backlog' })]);
    expect(setSelectedTaskId).toHaveBeenCalledWith(null);
    expect(setIsSettingsOpen).toHaveBeenCalledWith(false);

    act(() => result.current.removeLocalBackup('backup-1'));
    expect(result.current.localBackups).toEqual([]);
  });
});
