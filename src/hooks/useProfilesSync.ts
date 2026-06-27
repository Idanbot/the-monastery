import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { mergeSettings, normalizeTasksPayload } from '../domain/tasks';
import { apiRequest, shouldUseBackend } from '../lib/api';
import { activeProfileStorageKey } from '../lib/storage';
import { createProfileSyncQueue, type ProfileSyncQueue } from '../domain/profileSyncQueue';

const getErrorMessage = (error, fallback) => (error instanceof Error ? error.message : fallback);

function useProfileBootstrap({
  setProfiles,
  setActiveProfileId,
  setIsBackendAvailable,
  setIsProfileReady,
  setProfileError
}) {
  useEffect(() => {
    if (!shouldUseBackend()) return;
    let cancelled = false;

    const loadProfiles = async () => {
      try {
        const data = await apiRequest('/api/profiles');
        if (cancelled) return;

        const nextProfiles = data.profiles || [];
        const savedProfileId = localStorage.getItem(activeProfileStorageKey);
        const nextActiveProfileId = nextProfiles.some((profile) => profile.id === savedProfileId)
          ? savedProfileId
          : nextProfiles[0]?.id || '';

        setProfiles(nextProfiles);
        setActiveProfileId(nextActiveProfileId);
        setIsBackendAvailable(true);
        setProfileError('');
      } catch {
        if (!cancelled) {
          setIsBackendAvailable(false);
          setIsProfileReady(true);
        }
      }
    };

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [setActiveProfileId, setIsBackendAvailable, setIsProfileReady, setProfileError, setProfiles]);
}

function useActiveProfileLoader({
  activeProfileId,
  isBackendAvailable,
  setTasks,
  setSettings,
  setSelectedTaskId,
  setIsProfileReady,
  setIsProfileSettingsReady,
  setProfileError,
  syncQueue,
  reloadVersion
}) {
  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId) return;
    let cancelled = false;

    const loadProfileTasks = async () => {
      setIsProfileReady(false);
      setSelectedTaskId(null);
      localStorage.setItem(activeProfileStorageKey, activeProfileId);

      try {
        const data = await apiRequest(`/api/profiles/${activeProfileId}/tasks`);
        if (!cancelled) {
          syncQueue.setTasksRevision(data.revision);
          setTasks(normalizeTasksPayload(data.tasks || []));
          setProfileError('');
        }
      } catch (error) {
        if (!cancelled) setProfileError(getErrorMessage(error, 'Could not load profile tasks.'));
      } finally {
        if (!cancelled) setIsProfileReady(true);
      }
    };

    loadProfileTasks();

    return () => {
      cancelled = true;
    };
  }, [
    activeProfileId,
    isBackendAvailable,
    reloadVersion,
    setIsProfileReady,
    setProfileError,
    setSelectedTaskId,
    setTasks,
    syncQueue
  ]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId) return;
    let cancelled = false;

    const loadProfileSettings = async () => {
      setIsProfileSettingsReady(false);

      try {
        const data = await apiRequest(`/api/profiles/${activeProfileId}/settings`);
        if (!cancelled) {
          syncQueue.setSettingsRevision(data.revision);
          setSettings(mergeSettings(data.settings));
        }
        if (!cancelled) setProfileError('');
      } catch (error) {
        if (!cancelled) setProfileError(getErrorMessage(error, 'Could not load profile settings.'));
      } finally {
        if (!cancelled) setIsProfileSettingsReady(true);
      }
    };

    loadProfileSettings();

    return () => {
      cancelled = true;
    };
  }, [
    activeProfileId,
    isBackendAvailable,
    reloadVersion,
    setIsProfileSettingsReady,
    setProfileError,
    setSettings,
    syncQueue
  ]);
}

const tasksEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const saveTasksDelta = async (activeProfileId, previousTasks, nextTasks, baseRevision) => {
  const previousById = new Map(previousTasks.map((task) => [task.id, task]));
  const nextById = new Map(nextTasks.map((task) => [task.id, task]));
  const added = nextTasks.filter((task) => !previousById.has(task.id));
  const deleted = previousTasks.filter((task) => !nextById.has(task.id));
  const updated = nextTasks.filter((task) => {
    const previous = previousById.get(task.id);
    return previous && !tasksEqual(previous, task);
  });

  if (added.length === 1 && deleted.length === 0 && updated.length === 0) {
    const task = added[0];
    return apiRequest(`/api/profiles/${activeProfileId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        task,
        position: nextTasks.findIndex((item) => item.id === task.id),
        baseRevision
      })
    });
  }

  if (added.length === 0 && deleted.length === 1 && updated.length === 0) {
    return apiRequest(`/api/profiles/${activeProfileId}/tasks/${deleted[0].id}`, {
      method: 'DELETE',
      body: JSON.stringify({ baseRevision })
    });
  }

  if (added.length === 0 && deleted.length === 0 && updated.length === 1) {
    const task = updated[0];
    return apiRequest(`/api/profiles/${activeProfileId}/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        task,
        position: nextTasks.findIndex((item) => item.id === task.id),
        baseRevision
      })
    });
  }

  return apiRequest(`/api/profiles/${activeProfileId}/tasks`, {
    method: 'PUT',
    body: JSON.stringify({ tasks: nextTasks, baseRevision })
  });
};

function useDebouncedProfileSave({
  activeProfileId,
  isBackendAvailable,
  isProfileReady,
  isProfileSettingsReady,
  tasks,
  settings,
  setProfileError,
  syncQueue,
  reloadVersion
}) {
  const [persistenceStatus, setPersistenceStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const tasksBaselineRef = useRef(null);
  const settingsBaselineRef = useRef(null);
  const pendingWritesRef = useRef(0);
  const saveGenerationRef = useRef(0);

  useEffect(() => {
    tasksBaselineRef.current = null;
    settingsBaselineRef.current = null;
    pendingWritesRef.current = 0;
    saveGenerationRef.current += 1;
    setPersistenceStatus(isBackendAvailable ? 'loading' : 'offline');
  }, [activeProfileId, isBackendAvailable, reloadVersion]);

  useEffect(() => {
    if (!isBackendAvailable) setPersistenceStatus('offline');
  }, [isBackendAvailable]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !isProfileReady) return;
    if (tasksBaselineRef.current === null) {
      tasksBaselineRef.current = tasks;
      setPersistenceStatus('saved');
      return;
    }
    if (tasksEqual(tasksBaselineRef.current, tasks)) {
      setPersistenceStatus('saved');
      return;
    }

    setPersistenceStatus('saving');
    const saveTimer = window.setTimeout(() => {
      const previousTasks = tasksBaselineRef.current || [];
      const generation = saveGenerationRef.current;
      pendingWritesRef.current += 1;
      syncQueue
        .enqueueTask((baseRevision) => saveTasksDelta(activeProfileId, previousTasks, tasks, baseRevision))
        .then(() => {
          if (generation !== saveGenerationRef.current) return;
          pendingWritesRef.current -= 1;
          tasksBaselineRef.current = tasks;
          setLastSavedAt(new Date());
          setPersistenceStatus(pendingWritesRef.current > 0 ? 'saving' : 'saved');
          setProfileError('');
        })
        .catch((error) => {
          if (generation !== saveGenerationRef.current) return;
          pendingWritesRef.current -= 1;
          const message = getErrorMessage(error, 'Could not save tasks.');
          setPersistenceStatus('error');
          setProfileError(message);
          toast.error(message);
        });
    }, 350);

    return () => window.clearTimeout(saveTimer);
  }, [tasks, activeProfileId, isBackendAvailable, isProfileReady, setProfileError, syncQueue]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !isProfileSettingsReady) return;
    if (settingsBaselineRef.current === null) {
      settingsBaselineRef.current = settings;
      setPersistenceStatus((status) => (status === 'saving' ? status : 'saved'));
      return;
    }
    if (tasksEqual(settingsBaselineRef.current, settings)) {
      setPersistenceStatus((status) => (status === 'saving' ? status : 'saved'));
      return;
    }

    setPersistenceStatus('saving');
    const saveTimer = window.setTimeout(() => {
      const generation = saveGenerationRef.current;
      pendingWritesRef.current += 1;
      syncQueue
        .enqueueSettings((baseRevision) =>
          apiRequest(`/api/profiles/${activeProfileId}/settings`, {
            method: 'PUT',
            body: JSON.stringify({ settings, baseRevision })
          })
        )
        .then(() => {
          if (generation !== saveGenerationRef.current) return;
          pendingWritesRef.current -= 1;
          settingsBaselineRef.current = settings;
          setLastSavedAt(new Date());
          setPersistenceStatus(pendingWritesRef.current > 0 ? 'saving' : 'saved');
          setProfileError('');
        })
        .catch((error) => {
          if (generation !== saveGenerationRef.current) return;
          pendingWritesRef.current -= 1;
          const message = getErrorMessage(error, 'Could not save settings.');
          setPersistenceStatus('error');
          setProfileError(message);
          toast.error(message);
        });
    }, 450);

    return () => window.clearTimeout(saveTimer);
  }, [settings, activeProfileId, isBackendAvailable, isProfileSettingsReady, setProfileError, syncQueue]);

  return { persistenceStatus, lastSavedAt };
}

export function useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId }) {
  const [syncQueue] = useState<ProfileSyncQueue>(() => createProfileSyncQueue());
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isProfileSettingsReady, setIsProfileSettingsReady] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [profileAction, setProfileAction] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    syncQueue.resetRevision();
  }, [activeProfileId, syncQueue]);

  useProfileBootstrap({
    setProfiles,
    setActiveProfileId,
    setIsBackendAvailable,
    setIsProfileReady,
    setProfileError
  });

  useActiveProfileLoader({
    activeProfileId,
    isBackendAvailable,
    setTasks,
    setSettings,
    setSelectedTaskId,
    setIsProfileReady,
    setIsProfileSettingsReady,
    setProfileError,
    syncQueue,
    reloadVersion
  });

  const { persistenceStatus, lastSavedAt } = useDebouncedProfileSave({
    activeProfileId,
    isBackendAvailable,
    isProfileReady,
    isProfileSettingsReady,
    tasks,
    settings,
    setProfileError,
    syncQueue,
    reloadVersion
  });

  const refreshProfiles = useCallback(async () => {
    if (!isBackendAvailable) return [];
    const data = await apiRequest('/api/profiles');
    const nextProfiles = data.profiles || [];
    setProfiles(nextProfiles);
    return nextProfiles;
  }, [isBackendAvailable]);

  const reloadActiveProfile = useCallback(() => {
    syncQueue.resetRevision();
    setProfileError('');
    setIsProfileReady(false);
    setIsProfileSettingsReady(false);
    setReloadVersion((version) => version + 1);
  }, [syncQueue]);

  const selectProfile = useCallback((profileId) => {
    setIsProfileReady(false);
    setIsProfileSettingsReady(false);
    setActiveProfileId(profileId);
  }, []);

  const createProfile = useCallback(async () => {
    const name = newProfileName.trim();
    if (!name) return;

    try {
      const data = await apiRequest('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      setProfiles((prev) => [...prev, data.profile]);
      setIsProfileReady(false);
      setIsProfileSettingsReady(false);
      setActiveProfileId(data.profile.id);
      setNewProfileName('');
      setProfileError('');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Could not create profile.'));
    }
  }, [newProfileName]);

  const resetActiveProfile = useCallback(async () => {
    if (!activeProfileId) return;

    try {
      await apiRequest(`/api/profiles/${activeProfileId}/reset`, { method: 'POST' });
      setSelectedTaskId(null);
      setProfileAction(null);
      reloadActiveProfile();
      await refreshProfiles();
      setProfileError('');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Could not reset profile.'));
    }
  }, [activeProfileId, refreshProfiles, reloadActiveProfile, setSelectedTaskId]);

  const removeActiveProfile = useCallback(async () => {
    if (!activeProfileId) return;

    try {
      await apiRequest(`/api/profiles/${activeProfileId}`, { method: 'DELETE' });
      const nextProfiles = await refreshProfiles();
      setIsProfileReady(false);
      setIsProfileSettingsReady(false);
      setActiveProfileId(nextProfiles[0]?.id || '');
      setSelectedTaskId(null);
      setProfileAction(null);
      setProfileError('');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Could not remove profile.'));
    }
  }, [activeProfileId, refreshProfiles, setSelectedTaskId]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId),
    [profiles, activeProfileId]
  );

  return {
    isBackendAvailable,
    isProfileReady,
    persistenceStatus,
    lastSavedAt,
    profiles,
    activeProfileId,
    selectProfile,
    newProfileName,
    setNewProfileName,
    profileAction,
    setProfileAction,
    profileError,
    activeProfile,
    reloadActiveProfile,
    createProfile,
    resetActiveProfile,
    removeActiveProfile
  };
}
