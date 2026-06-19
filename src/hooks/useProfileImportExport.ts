import { useState } from 'react';
import { normalizeTasksPayload } from '../domain/tasks';
import { downloadJson } from '../lib/download';

export function useProfileImportExport({
  tasks,
  setTasks,
  settings,
  setSettings,
  activeProfile,
  activeProfileId,
  setSelectedTaskId,
  importProfileInputRef
}) {
  const [profileImportPreview, setProfileImportPreview] = useState(null);

  const exportActiveProfile = () => {
    downloadJson('the-monastery-profile-' + (activeProfile?.name || 'profile') + '.json', {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        id: activeProfileId || 'local',
        name: activeProfile?.name || 'Local',
        settings,
        tasks
      }
    });
  };

  const importActiveProfile = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const source = parsed.profile || parsed.profiles?.[0] || parsed;
      const importedTasks = source.tasks ? normalizeTasksPayload({ tasks: source.tasks }) : [];
      setProfileImportPreview({
        name: source.name || 'Imported profile',
        settings: source.settings || null,
        tasks: importedTasks,
        currentTaskCount: tasks.length
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import profile.');
    } finally {
      if (importProfileInputRef.current) importProfileInputRef.current.value = '';
    }
  };

  const confirmProfileImport = () => {
    if (!profileImportPreview) return;
    if (profileImportPreview.settings) setSettings(profileImportPreview.settings);
    setTasks(profileImportPreview.tasks || []);
    setSelectedTaskId(null);
    setProfileImportPreview(null);
  };

  return {
    profileImportPreview,
    setProfileImportPreview,
    exportActiveProfile,
    importActiveProfile,
    confirmProfileImport
  };
}
