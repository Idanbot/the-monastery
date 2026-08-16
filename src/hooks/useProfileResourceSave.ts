import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  queueProfileMutation,
  removeProfileMutation,
  type PendingProfileMutation,
  type ProfileMutationResource
} from '../domain/profileMutationQueue';
import { ApiError } from '../lib/api';
import { deepEqual } from '../lib/deepEqual';
import type { PersistenceStatus } from '../domain/persistenceStatus';

export type { PersistenceStatus } from '../domain/persistenceStatus';

export const getPersistenceErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const isProfileConflictError = (error: unknown): boolean => {
  if (error instanceof ApiError) return error.status === 409;
  return /conflict|changed elsewhere/i.test(getPersistenceErrorMessage(error, ''));
};

type UseProfileResourceSaveArgs<T> = {
  activeProfileId: string;
  resource: ProfileMutationResource;
  value: T;
  ready: boolean;
  isBackendAvailable: boolean;
  reloadVersion: number;
  delayMs: number;
  save: (previousValue: T, nextValue: T) => Promise<unknown>;
  errorMessage: string;
  onError: (message: string) => void;
  onConflict: (entry: PendingProfileMutation, message: string) => void;
};

export function useProfileResourceSave<T>({
  activeProfileId,
  resource,
  value,
  ready,
  isBackendAvailable,
  reloadVersion,
  delayMs,
  save,
  errorMessage,
  onError,
  onConflict
}: UseProfileResourceSaveArgs<T>) {
  const [status, setStatus] = useState<PersistenceStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const baselineRef = useRef(value);
  const initializedRef = useRef(false);
  const pendingWritesRef = useRef(0);
  const generationRef = useRef(0);

  useEffect(() => {
    initializedRef.current = false;
    pendingWritesRef.current = 0;
    generationRef.current += 1;
    setStatus(isBackendAvailable ? 'loading' : 'offline');
  }, [activeProfileId, isBackendAvailable, reloadVersion]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !ready) return;
    if (!initializedRef.current) {
      baselineRef.current = value;
      initializedRef.current = true;
      setStatus('saved');
      return;
    }
    if (deepEqual(baselineRef.current, value)) {
      setStatus((current) => (current === 'saving' ? current : 'saved'));
      return;
    }

    setStatus('saving');
    const saveTimer = window.setTimeout(() => {
      const generation = generationRef.current;
      const previousValue = baselineRef.current;
      const queuedMutation = queueProfileMutation(activeProfileId, resource, value);
      pendingWritesRef.current += 1;
      save(previousValue, value)
        .then(() => {
          if (generation !== generationRef.current) return;
          pendingWritesRef.current -= 1;
          baselineRef.current = value;
          removeProfileMutation(queuedMutation);
          setLastSavedAt(Date.now());
          setStatus(pendingWritesRef.current > 0 ? 'saving' : 'saved');
          onError('');
        })
        .catch((error) => {
          if (generation !== generationRef.current) return;
          pendingWritesRef.current -= 1;
          const message = getPersistenceErrorMessage(error, errorMessage);
          if (isProfileConflictError(error)) onConflict(queuedMutation, message);
          setStatus('error');
          onError(message);
          toast.error(message);
        });
    }, delayMs);

    return () => window.clearTimeout(saveTimer);
  }, [
    activeProfileId,
    delayMs,
    errorMessage,
    isBackendAvailable,
    onConflict,
    onError,
    ready,
    resource,
    save,
    value
  ]);

  const acceptSavedValue = useCallback((nextValue: T) => {
    baselineRef.current = nextValue;
    initializedRef.current = true;
    setLastSavedAt(Date.now());
    setStatus('saved');
  }, []);

  return { status, lastSavedAt, acceptSavedValue, markStatus: setStatus };
}

const statusPriority: PersistenceStatus[] = ['error', 'saving', 'loading', 'offline', 'saved', 'idle'];

export const combinePersistenceStatuses = (
  statuses: PersistenceStatus[],
  isBackendAvailable: boolean
): PersistenceStatus => {
  if (!isBackendAvailable) return 'offline';
  return statusPriority.find((status) => statuses.includes(status)) || 'idle';
};
