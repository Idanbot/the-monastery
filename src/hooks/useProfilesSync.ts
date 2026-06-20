import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { mergeSettings, normalizeTasksPayload } from '../domain/tasks';
import { apiRequest, shouldUseBackend } from '../lib/api';
import { activeProfileStorageKey } from '../lib/storage';

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
  setProfileError
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
  }, [activeProfileId, isBackendAvailable, setIsProfileReady, setProfileError, setSelectedTaskId, setTasks]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId) return;
    let cancelled = false;

    const loadProfileSettings = async () => {
      setIsProfileSettingsReady(false);

      try {
        const data = await apiRequest(`/api/profiles/${activeProfileId}/settings`);
        if (!cancelled) {
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
  }, [activeProfileId, isBackendAvailable, setIsProfileSettingsReady, setProfileError, setSettings]);
}

const tasksEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const saveTasksDelta = async (activeProfileId, previousTasks, nextTasks) => {
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
    await apiRequest(`/api/profiles/${activeProfileId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ task, position: nextTasks.findIndex((item) => item.id === task.id) })
    });
    return;
  }

  if (added.length === 0 && deleted.length === 1 && updated.length === 0) {
    await apiRequest(`/api/profiles/${activeProfileId}/tasks/${deleted[0].id}`, { method: 'DELETE' });
    return;
  }

  if (added.length === 0 && deleted.length === 0 && updated.length === 1) {
    const task = updated[0];
    await apiRequest(`/api/profiles/${activeProfileId}/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ task, position: nextTasks.findIndex((item) => item.id === task.id) })
    });
    return;
  }

  await apiRequest(`/api/profiles/${activeProfileId}/tasks`, {
    method: 'PUT',
    body: JSON.stringify({ tasks: nextTasks })
  });
};

function useDebouncedProfileSave({
  activeProfileId,
  isBackendAvailable,
  isProfileReady,
  isProfileSettingsReady,
  tasks,
  settings,
  setProfileError
}) {
  const [persistenceStatus, setPersistenceStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const tasksBaselineRef = useRef(null);
  const settingsBaselineRef = useRef(null);

  useEffect(() => {
    tasksBaselineRef.current = null;
    settingsBaselineRef.current = null;
    setPersistenceStatus(isBackendAvailable ? 'loading' : 'offline');
  }, [activeProfileId, isBackendAvailable]);

  useEffect(() => {
    if (!isBackendAvailable) setPersistenceStatus('offline');
  }, [isBackendAvailable]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !isProfileReady) return;
    if (tasksBaselineRef.current === null) {
      tasksBaselineRef.current = [];
    }
    if (tasksEqual(tasksBaselineRef.current, tasks)) {
      setPersistenceStatus('saved');
      return;
    }

    setPersistenceStatus('saving');
    const saveTimer = window.setTimeout(() => {
      const previousTasks = tasksBaselineRef.current || [];
      saveTasksDelta(activeProfileId, previousTasks, tasks)
        .then(() => {
          tasksBaselineRef.current = tasks;
          setLastSavedAt(new Date());
          setPersistenceStatus('saved');
          setProfileError('');
        })
        .catch((error) => {
          const message = getErrorMessage(error, 'Could not save tasks.');
          setPersistenceStatus('error');
          setProfileError(message);
          toast.error(message);
        });
    }, 350);

    return () => window.clearTimeout(saveTimer);
  }, [tasks, activeProfileId, isBackendAvailable, isProfileReady, setProfileError]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !isProfileSettingsReady) return;
    if (settingsBaselineRef.current === null) {
      settingsBaselineRef.current = {};
    }
    if (tasksEqual(settingsBaselineRef.current, settings)) {
      setPersistenceStatus((status) => (status === 'saving' ? status : 'saved'));
      return;
    }

    setPersistenceStatus('saving');
    const saveTimer = window.setTimeout(() => {
      apiRequest(`/api/profiles/${activeProfileId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings })
      })
        .then(() => {
          settingsBaselineRef.current = settings;
          setLastSavedAt(new Date());
          setPersistenceStatus('saved');
          setProfileError('');
        })
        .catch((error) => {
          const message = getErrorMessage(error, 'Could not save settings.');
          setPersistenceStatus('error');
          setProfileError(message);
          toast.error(message);
        });
    }, 450);

    return () => window.clearTimeout(saveTimer);
  }, [settings, activeProfileId, isBackendAvailable, isProfileSettingsReady, setProfileError]);

  return { persistenceStatus, lastSavedAt };
}

export function useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId }) {
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isProfileSettingsReady, setIsProfileSettingsReady] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [profileAction, setProfileAction] = useState(null);
  const [profileError, setProfileError] = useState('');

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
    setProfileError
  });

  const { persistenceStatus, lastSavedAt } = useDebouncedProfileSave({
    activeProfileId,
    isBackendAvailable,
    isProfileReady,
    isProfileSettingsReady,
    tasks,
    settings,
    setProfileError
  });

  const refreshProfiles = useCallback(async () => {
    if (!isBackendAvailable) return [];
    const data = await apiRequest('/api/profiles');
    const nextProfiles = data.profiles || [];
    setProfiles(nextProfiles);
    return nextProfiles;
  }, [isBackendAvailable]);

  const selectProfile = useCallback((profileId) => {
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
      setTasks([]);
      setSettings(mergeSettings(null));
      setSelectedTaskId(null);
      setProfileAction(null);
      await refreshProfiles();
      setProfileError('');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Could not reset profile.'));
    }
  }, [activeProfileId, refreshProfiles, setSelectedTaskId, setSettings, setTasks]);

  const removeActiveProfile = useCallback(async () => {
    if (!activeProfileId) return;

    try {
      await apiRequest(`/api/profiles/${activeProfileId}`, { method: 'DELETE' });
      const nextProfiles = await refreshProfiles();
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
    createProfile,
    resetActiveProfile,
    removeActiveProfile
  };
}
