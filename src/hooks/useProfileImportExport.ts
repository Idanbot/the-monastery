import { useState } from 'react';
import { mergeSettings } from '../domain/tasks';
import { currentDataSchemaVersion, migrateProfileData } from '../domain/dataMigrations';
import { downloadJson } from '../lib/download';
import type { AppSettings, ProfileImportPreview, Task } from '../domain/types';

export function useProfileImportExport({
  tasks,
  setTasks,
  settings,
  setSettings,
  activeProfile,
  activeProfileId,
  setSelectedTaskId,
  importProfileInputRef
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  activeProfile: { id?: string; name?: string } | undefined;
  activeProfileId: string;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  importProfileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [profileImportPreview, setProfileImportPreview] = useState<ProfileImportPreview | null>(null);

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

  const importActiveProfile = async (file: File) => {
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
