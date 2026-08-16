import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPendingProfileMutation } from '../domain/profileMutationQueue';
import { useProfileResourceSave } from './useProfileResourceSave';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('useProfileResourceSave', () => {
  beforeEach(() => localStorage.clear());

  it('treats the loaded value as a baseline and persists only later changes', async () => {
    const save = vi.fn().mockResolvedValue({ revision: 2 });
    const { result, rerender } = renderHook(
      ({ value }) =>
        useProfileResourceSave({
          activeProfileId: 'default',
          resource: 'settings',
          value,
          ready: true,
          isBackendAvailable: true,
          reloadVersion: 0,
          delayMs: 1,
          save,
          errorMessage: 'Could not save settings.',
          onError: vi.fn(),
          onConflict: vi.fn()
        }),
      { initialProps: { value: { dailyGoal: '' } } }
    );

    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(save).not.toHaveBeenCalled();

    rerender({ value: { dailyGoal: 'Refactor' } });
    await waitFor(() => expect(save).toHaveBeenCalledWith({ dailyGoal: '' }, { dailyGoal: 'Refactor' }));
    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(getPendingProfileMutation('default', 'settings')).toBeUndefined();
  });

  it('keeps failed conflict payloads queued for explicit resolution', async () => {
    const error = new Error('Profile changed elsewhere.');
    const onConflict = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) =>
        useProfileResourceSave({
          activeProfileId: 'default',
          resource: 'tasks',
          value,
          ready: true,
          isBackendAvailable: true,
          reloadVersion: 0,
          delayMs: 1,
          save: vi.fn().mockRejectedValue(error),
          errorMessage: 'Could not save tasks.',
          onError: vi.fn(),
          onConflict
        }),
      { initialProps: { value: [] as { id: string }[] } }
    );

    await waitFor(() => expect(result.current.status).toBe('saved'));
    act(() => rerender({ value: [{ id: 'task-1' }] }));
    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(onConflict).toHaveBeenCalledWith(
      expect.objectContaining({ resource: 'tasks', payload: [{ id: 'task-1' }] }),
      'Profile changed elsewhere.'
    );
    expect(getPendingProfileMutation('default', 'tasks')).toBeDefined();
  });
});
