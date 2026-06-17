import { useCallback, useEffect, useMemo, useState } from 'react';
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

function useDebouncedProfileSave({
  activeProfileId,
  isBackendAvailable,
  isProfileReady,
  isProfileSettingsReady,
  tasks,
  settings,
  setProfileError
}) {
  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !isProfileReady) return;

    const saveTimer = window.setTimeout(() => {
      apiRequest(`/api/profiles/${activeProfileId}/tasks`, {
        method: 'PUT',
        body: JSON.stringify({ tasks })
      }).catch((error) => {
        setProfileError(getErrorMessage(error, 'Could not save tasks.'));
      });
    }, 350);

    return () => window.clearTimeout(saveTimer);
  }, [tasks, activeProfileId, isBackendAvailable, isProfileReady, setProfileError]);

  useEffect(() => {
    if (!isBackendAvailable || !activeProfileId || !isProfileSettingsReady) return;

    const saveTimer = window.setTimeout(() => {
      apiRequest(`/api/profiles/${activeProfileId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings })
      }).catch((error) => {
        setProfileError(getErrorMessage(error, 'Could not save settings.'));
      });
    }, 450);

    return () => window.clearTimeout(saveTimer);
  }, [settings, activeProfileId, isBackendAvailable, isProfileSettingsReady, setProfileError]);
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

  useDebouncedProfileSave({
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
