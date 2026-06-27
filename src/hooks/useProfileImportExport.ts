import { useState } from 'react';
import { mergeSettings } from '../domain/tasks';
import { currentDataSchemaVersion, migrateProfileData } from '../domain/dataMigrations';
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
      schemaVersion: currentDataSchemaVersion,
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
      const migrated = migrateProfileData({
        ...source,
        schemaVersion: parsed.schemaVersion ?? source.schemaVersion
      });
      setProfileImportPreview({
        name: source.name || 'Imported profile',
        settings: migrated.settings,
        tasks: migrated.tasks,
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
    if (profileImportPreview.settings) setSettings(mergeSettings(profileImportPreview.settings));
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
