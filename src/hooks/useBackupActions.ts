import { useState } from 'react';
import { toast } from 'sonner';
import { createThemeCss, createThemeRecipe } from '../domain/themeStudio';
import { generateId } from '../domain/tasks';
import { apiRequest } from '../lib/api';
import { apiPaths, backupResponseSchema } from '../../shared/apiContracts';
import { downloadJson } from '../lib/download';
import { backupHistoryStorageKey, parseStoredJson, writeStoredJson } from '../lib/storage';
import taskSchema from '../task.schema.json';
import { currentDataSchemaVersion, migrateProfileData } from '../domain/dataMigrations';
import type { AppSettings, LocalBackup, Task } from '../domain/types';

const taskSchemaId = (taskSchema as { $id?: string }).$id || 'https://the-monastery.local/task.schema.json';

export function useBackupActions({
  tasks,
  setTasks,
  settings,
  setSettings,
  activeProfile,
  activeProfileId,
  isBackendAvailable,
  setSelectedTaskId,
  setIsSettingsOpen
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  activeProfile: { id?: string; name?: string } | undefined;
  activeProfileId: string;
  isBackendAvailable: boolean;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [localBackups, setLocalBackups] = useState<LocalBackup[]>(() =>
    parseStoredJson<LocalBackup[]>(backupHistoryStorageKey, [])
  );

  const persistLocalBackups = (nextBackups: LocalBackup[]) => {
    const limited = nextBackups.slice(0, 8);
    setLocalBackups(limited);
    writeStoredJson(backupHistoryStorageKey, limited);
  };

  const saveLocalBackupSnapshot = (label = 'Manual backup') => {
    const snapshot = {
      schemaVersion: currentDataSchemaVersion,
      id: generateId(),
      label,
      createdAt: new Date().toISOString(),
      taskCount: tasks.length,
      profileName: activeProfile?.name || 'Local',
      settings,
      tasks
    };
    persistLocalBackups([snapshot, ...localBackups]);
    return snapshot;
  };

  const restoreLocalBackup = (backupId: string) => {
    const backup = localBackups.find((item) => item.id === backupId);
    if (!backup) return;
    const migrated = migrateProfileData(backup);
    setSettings(migrated.settings);
    setTasks(migrated.tasks);
    setSelectedTaskId(null);
    setIsSettingsOpen(false);
    toast.success('Local backup restored.');
  };

  const removeLocalBackup = (backupId: string) => {
    persistLocalBackups(localBackups.filter((item) => item.id !== backupId));
    toast.success('Local backup deleted.');
  };

  const exportTasks = () => {
    downloadJson('the-monastery-tasks.json', {
      $schema: taskSchemaId,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      tasks
    });
    toast.success('Tasks exported.');
  };

  const backupData = async () => {
    try {
      saveLocalBackupSnapshot();
      if (isBackendAvailable) {
        const backup = await apiRequest(apiPaths.backup, {}, backupResponseSchema);
        downloadJson(`the-monastery-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
        toast.success('Backup created.');
        return;
      }

      downloadJson(`the-monastery-backup-${new Date().toISOString().slice(0, 10)}.json`, {
        schemaVersion: currentDataSchemaVersion,
        exportedAt: new Date().toISOString(),
        profiles: [
          {
            id: activeProfileId || 'local',
            name: activeProfile?.name || 'Local',
            settings,
            tasks
          }
        ]
      });
      toast.success('Backup created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create backup.');
    }
  };

  const exportTaskSchema = () => {
    downloadJson('the-monastery-task.schema.json', taskSchema);
    toast.success('Task schema exported.');
  };

  const exportThemeRecipe = () => {
    const recipe = createThemeRecipe(settings);
    downloadJson('the-monastery-theme-' + recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json', {
      ...recipe,
      css: createThemeCss(recipe)
    });
    toast.success('Theme recipe exported.');
  };

  return {
    localBackups,
    restoreLocalBackup,
    removeLocalBackup,
    exportTasks,
    backupData,
    exportTaskSchema,
    exportThemeRecipe
  };
}
