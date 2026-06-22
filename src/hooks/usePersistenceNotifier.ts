import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { PersistenceStatus } from '../domain/persistenceStatus';

export function usePersistenceNotifier(status: PersistenceStatus, lastSavedAt: Date | null) {
  const previousStatusRef = useRef<PersistenceStatus | null>(null);
  const previousSavedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const savedAt = lastSavedAt?.getTime() || null;

    if (status === 'offline' && previousStatus !== 'offline') {
      toast.warning('Offline: changes are stored locally until sync returns.', { id: 'persistence-status' });
    }

    if (status === 'error' && previousStatus !== 'error') {
      toast.error('Save failed. Your latest local changes are still available.', {
        id: 'persistence-status'
      });
    }

    if (
      status === 'saved' &&
      savedAt &&
      previousSavedAtRef.current !== savedAt &&
      (previousStatus === 'saving' || previousStatus === 'error' || previousStatus === 'offline')
    ) {
      toast.success('Changes saved.', { id: 'persistence-status', duration: 1400 });
    }

    previousStatusRef.current = status;
    if (savedAt) previousSavedAtRef.current = savedAt;
  }, [lastSavedAt, status]);
}
