import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../domain/tasks';
import { downloadJson } from '../lib/download';
import { useProfileImportExport } from './useProfileImportExport';

vi.mock('../lib/download', () => ({
  downloadJson: vi.fn()
}));

const makeJsonFile = (payload) =>
  new File([JSON.stringify(payload)], 'profile.json', { type: 'application/json' });

const setup = () => {
  const setTasks = vi.fn();
  const setSettings = vi.fn();
  const setSelectedTaskId = vi.fn();
  const input = document.createElement('input');
  input.value = 'profile.json';
  const importProfileInputRef = createRef();
  importProfileInputRef.current = input;
  const hook = renderHook(() =>
    useProfileImportExport({
      tasks: [normalizeTask({ id: 'existing', title: 'Existing task' })],
      setTasks,
      settings: defaultSettings,
      setSettings,
      activeProfile: { id: 'profile-1', name: 'Deep Work' },
      activeProfileId: 'profile-1',
      setSelectedTaskId,
      importProfileInputRef
    })
  );
  return { ...hook, setTasks, setSettings, setSelectedTaskId, input };
};

describe('useProfileImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports the active profile with settings and tasks', () => {
    const { result } = setup();

    act(() => result.current.exportActiveProfile());

    expect(downloadJson).toHaveBeenCalledWith(
      'the-monastery-profile-Deep Work.json',
      expect.objectContaining({
        schemaVersion: 1,
        profile: expect.objectContaining({ id: 'profile-1', name: 'Deep Work' })
      })
    );
  });

  it('previews and confirms imported profile data', async () => {
    const { result, setTasks, setSettings, setSelectedTaskId, input } = setup();

    await act(async () => {
      await result.current.importActiveProfile(
        makeJsonFile({
          profile: {
            name: 'Imported profile',
            settings: { visualTheme: 'liquid-glass' },
            tasks: [{ id: 'imported', title: 'Imported task', status: 'new' }]
          }
        })
      );
    });

    expect(result.current.profileImportPreview).toMatchObject({
      name: 'Imported profile',
      currentTaskCount: 1,
      tasks: [expect.objectContaining({ id: 'imported', status: 'backlog' })]
    });
    expect(input.value).toBe('');

    act(() => result.current.confirmProfileImport());
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ visualTheme: 'liquid-glass' }));
    expect(setTasks).toHaveBeenCalledWith([expect.objectContaining({ id: 'imported' })]);
    expect(setSelectedTaskId).toHaveBeenCalledWith(null);
    expect(result.current.profileImportPreview).toBeNull();
  });

  it('alerts on invalid import JSON and ignores empty files', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = setup();

    await act(async () => {
      await result.current.importActiveProfile(null);
    });
    expect(result.current.profileImportPreview).toBeNull();

    await act(async () => {
      await result.current.importActiveProfile(new File(['{bad'], 'bad.json'));
    });
    expect(alert).toHaveBeenCalled();
  });
});
