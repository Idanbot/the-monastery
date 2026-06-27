import { useEffect, useState } from 'react';
import { defaultSettings, defaultTasks } from '../domain/tasks';
import { createStoredEnvelope, migrateStoredSettings, migrateStoredTasks } from '../domain/dataMigrations';
import { shouldUseBackend } from '../lib/api';
import {
  getIndexedDbValue,
  hasIndexedDb,
  parseStoredJson,
  setIndexedDbValue,
  settingsStorageKey,
  tasksStorageKey
} from '../lib/storage';

export const loadInitialLocalTasks = () => {
  try {
    return migrateStoredTasks(parseStoredJson(tasksStorageKey, defaultTasks));
  } catch {
    return defaultTasks;
  }
};

export const loadInitialLocalSettings = () =>
  migrateStoredSettings(parseStoredJson(settingsStorageKey, defaultSettings));

export function useLocalFallbackPersistence({ tasks, setTasks, settings, setSettings, isProfileReady }) {
  const [isStorageReady, setIsStorageReady] = useState(() => !hasIndexedDb());

  // The async IDB read is a *fallback* for offline/test mode. When the backend
  // is in use the server load is canonical, so we deliberately do NOT also read
  // from IDB on mount — that previously raced the server load and could clobber
  // fresh server data with a stale local snapshot. The synchronous
  // `loadInitialLocal*` initialisers above still provide a starting point, and
  // the IDB write effects below keep mirroring for offline recovery.
  useEffect(() => {
    if (!hasIndexedDb() || shouldUseBackend()) {
      setIsStorageReady(true);
      return;
    }

    let cancelled = false;

    const loadStoredData = async () => {
      try {
        const [storedTasks, storedSettings] = await Promise.all([
          getIndexedDbValue(tasksStorageKey),
          getIndexedDbValue(settingsStorageKey)
        ]);

        if (cancelled) return;
        if (storedTasks) setTasks(migrateStoredTasks(storedTasks));
        if (storedSettings) setSettings(migrateStoredSettings(storedSettings));
      } catch {
        // Local state already starts from localStorage fallback data.
      } finally {
        if (!cancelled) setIsStorageReady(true);
      }
    };

    loadStoredData();

    return () => {
      cancelled = true;
    };
  }, [setSettings, setTasks]);

  useEffect(() => {
    if (!isStorageReady || !isProfileReady) return;
    const storedTasks = createStoredEnvelope(tasks);
    localStorage.setItem(tasksStorageKey, JSON.stringify(storedTasks));
    setIndexedDbValue(tasksStorageKey, storedTasks).catch(() => {});
  }, [tasks, isStorageReady, isProfileReady]);

  useEffect(() => {
    if (!isStorageReady || !isProfileReady) return;
    const storedSettings = createStoredEnvelope(settings);
    localStorage.setItem(settingsStorageKey, JSON.stringify(storedSettings));
    setIndexedDbValue(settingsStorageKey, storedSettings).catch(() => {});
  }, [settings, isStorageReady, isProfileReady]);

  return { isStorageReady };
}
