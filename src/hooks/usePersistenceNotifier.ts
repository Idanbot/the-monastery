import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { PersistenceStatus } from '../domain/persistenceStatus';

export function usePersistenceNotifier(status: PersistenceStatus, lastSavedAt: Date | null) {
  const previousStatusRef = useRef<PersistenceStatus | null>(null);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    if (status === 'offline' && previousStatus !== 'offline') {
      toast.warning('Offline: changes are stored locally until sync returns.', { id: 'persistence-status' });
    }

    if (status === 'error' && previousStatus !== 'error') {
      toast.error('Save failed. Your latest local changes are still available.', {
        id: 'persistence-status'
      });
    }

    previousStatusRef.current = status;
  }, [lastSavedAt, status]);
}
