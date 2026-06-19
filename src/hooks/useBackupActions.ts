import { useState } from 'react';
import { createThemeCss, createThemeRecipe } from '../domain/themeStudio';
import { generateId, mergeSettings, normalizeTasksPayload } from '../domain/tasks';
import { apiRequest } from '../lib/api';
import { downloadJson } from '../lib/download';
import { backupHistoryStorageKey, parseStoredJson } from '../lib/storage';
import taskSchema from '../task.schema.json';

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
}) {
  const [localBackups, setLocalBackups] = useState(() => parseStoredJson(backupHistoryStorageKey, []));

  const persistLocalBackups = (nextBackups) => {
    const limited = nextBackups.slice(0, 8);
    setLocalBackups(limited);
    localStorage.setItem(backupHistoryStorageKey, JSON.stringify(limited));
  };

  const saveLocalBackupSnapshot = (label = 'Manual backup') => {
    const snapshot = {
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

  const restoreLocalBackup = (backupId) => {
    const backup = localBackups.find((item) => item.id === backupId);
    if (!backup) return;
    setSettings(mergeSettings(backup.settings));
    setTasks(normalizeTasksPayload({ tasks: backup.tasks || [] }));
    setSelectedTaskId(null);
    setIsSettingsOpen(false);
  };

  const removeLocalBackup = (backupId) => {
    persistLocalBackups(localBackups.filter((item) => item.id !== backupId));
  };

  const exportTasks = () => {
    downloadJson('the-monastery-tasks.json', {
      $schema: taskSchemaId,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      tasks
    });
  };

  const backupData = async () => {
    try {
      saveLocalBackupSnapshot();
      if (isBackendAvailable) {
        const backup = await apiRequest('/api/backup');
        downloadJson(`the-monastery-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
        return;
      }

      downloadJson(`the-monastery-backup-${new Date().toISOString().slice(0, 10)}.json`, {
        schemaVersion: 1,
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
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create backup.');
    }
  };

  const exportTaskSchema = () => {
    downloadJson('the-monastery-task.schema.json', taskSchema);
  };

  const exportThemeRecipe = () => {
    const recipe = createThemeRecipe(settings);
    downloadJson('the-monastery-theme-' + recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json', {
      ...recipe,
      css: createThemeCss(recipe)
    });
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
