import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { usePersistenceNotifier } from './usePersistenceNotifier';
import type { PersistenceStatus } from '../domain/persistenceStatus';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() }
}));

describe('usePersistenceNotifier', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not toast for routine successful saves', () => {
    const { rerender } = renderHook(
      ({ status, savedAt }: { status: PersistenceStatus; savedAt: Date | null }) =>
        usePersistenceNotifier(status, savedAt),
      { initialProps: { status: 'saving' as PersistenceStatus, savedAt: null as Date | null } }
    );
    rerender({ status: 'saved', savedAt: new Date('2026-06-27T09:00:00.000Z') });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('keeps failure and offline notifications', () => {
    const { rerender } = renderHook(
      ({ status }: { status: PersistenceStatus }) => usePersistenceNotifier(status, null),
      { initialProps: { status: 'idle' as PersistenceStatus } }
    );
    rerender({ status: 'offline' });
    rerender({ status: 'error' });
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
