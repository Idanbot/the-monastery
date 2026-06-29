import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPendingProfileMutation,
  profileMutationQueueStorageKey,
  queueProfileMutation,
  removeProfileMutation
} from './profileMutationQueue';

describe('profile mutation persistence', () => {
  beforeEach(() => localStorage.clear());

  it('keeps only the latest snapshot for each profile resource', () => {
    queueProfileMutation('profile', 'tasks', [{ id: 'first' }]);
    const latest = queueProfileMutation('profile', 'tasks', [{ id: 'latest' }]);
    queueProfileMutation('profile', 'settings', { theme: 'dark' });

    expect(getPendingProfileMutation('profile', 'tasks')).toEqual(latest);
    expect(JSON.parse(localStorage.getItem(profileMutationQueueStorageKey) || '[]')).toHaveLength(2);
  });

  it('does not remove a newer snapshot when an older request completes', () => {
    const first = queueProfileMutation('profile', 'tasks', [{ id: 'first' }]);
    const latest = queueProfileMutation('profile', 'tasks', [{ id: 'latest' }]);
    removeProfileMutation(first);

    expect(getPendingProfileMutation('profile', 'tasks')).toEqual(latest);
  });
});
