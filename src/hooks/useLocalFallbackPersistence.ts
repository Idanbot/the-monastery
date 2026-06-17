import { useEffect, useState } from 'react';
import { defaultSettings, defaultTasks, mergeSettings, normalizeTasksPayload } from '../domain/tasks';
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
    return normalizeTasksPayload(parseStoredJson(tasksStorageKey, defaultTasks));
  } catch {
    return defaultTasks;
  }
};

export const loadInitialLocalSettings = () =>
  mergeSettings(parseStoredJson(settingsStorageKey, defaultSettings));

export function useLocalFallbackPersistence({
  tasks,
  setTasks,
  settings,
  setSettings,
  isBackendAvailable,
  isProfileReady
}) {
  const [isStorageReady, setIsStorageReady] = useState(() => !hasIndexedDb());

  useEffect(() => {
    if (!hasIndexedDb()) return;

    let cancelled = false;

    const loadStoredData = async () => {
      try {
        const [storedTasks, storedSettings] = await Promise.all([
          getIndexedDbValue(tasksStorageKey),
          getIndexedDbValue(settingsStorageKey)
        ]);

        if (cancelled) return;
        if (storedTasks) setTasks(normalizeTasksPayload(storedTasks));
        if (storedSettings) setSettings(mergeSettings(storedSettings));
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
    if (!isStorageReady || isBackendAvailable || !isProfileReady) return;
    localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
    setIndexedDbValue(tasksStorageKey, tasks).catch(() => {});
  }, [tasks, isStorageReady, isBackendAvailable, isProfileReady]);

  useEffect(() => {
    if (!isStorageReady || isBackendAvailable || !isProfileReady) return;
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    setIndexedDbValue(settingsStorageKey, settings).catch(() => {});
  }, [settings, isStorageReady, isBackendAvailable, isProfileReady]);

  return { isStorageReady };
}
