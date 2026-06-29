import React, { createContext, useContext, useRef, useMemo } from 'react';
import { useSettingsContext } from './SettingsContext';
import { useTaskContext } from './TaskContext';
import { useProfilesSync } from '../hooks/useProfilesSync';
import { useProfileImportExport } from '../hooks/useProfileImportExport';
import { useImportFlows } from '../hooks/useImportFlows';
import { useBackupActions } from '../hooks/useBackupActions';
import { useLocalFallbackPersistence } from '../hooks/useLocalFallbackPersistence';

interface ProfileContextType {
  isBackendAvailable: boolean;
  isProfileReady: boolean;
  persistenceStatus: string;
  lastSavedAt: number | null;
  profiles: any[];
  activeProfileId: string;
  selectProfile: (id: string) => void;
  newProfileName: string;
  setNewProfileName: (name: string) => void;
  profileAction: any;
  setProfileAction: (action: any) => void;
  profileError: string;
  syncConflict: any;
  keepLocalChanges: () => void;
  useServerChanges: () => void;
  activeProfile: any;
  reloadActiveProfile: () => void;
  createProfile: () => void;
  resetActiveProfile: () => void;
  removeActiveProfile: () => void;
  
  profileImportPreview: any;
  setProfileImportPreview: (preview: any) => void;
  exportActiveProfile: () => void;
  importActiveProfile: (file: any) => void;
  confirmProfileImport: () => void;
  
  importPreview: any;
  setImportPreview: (preview: any) => void;
  planningImportPreview: any;
  setPlanningImportPreview: (preview: any) => void;
  importTasks: (file: any) => void;
  importCalendarTasks: (file: any) => void;
  importPlanningData: (file: any) => void;
  confirmImportTasks: () => void;
  confirmPlanningImport: () => void;
  
  localBackups: any[];
  restoreLocalBackup: (id: string) => void;
  removeLocalBackup: (id: string) => void;
  exportTasks: () => void;
  backupData: () => void;
  exportTaskSchema: () => void;
  exportThemeRecipe: () => void;
  
  importProfileInputRef: React.RefObject<HTMLInputElement | null>;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  importCalendarInputRef: React.RefObject<HTMLInputElement | null>;
  importPlanningInputRef: React.RefObject<HTMLInputElement | null>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, setSettings, setIsSettingsOpen } = useSettingsContext();
  const { tasks, setTasks, setSelectedTaskId } = useTaskContext();

  const importProfileInputRef = useRef<HTMLInputElement>(null);

  const {
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
    syncConflict,
    keepLocalChanges,
    useServerChanges,
    activeProfile,
    reloadActiveProfile,
    createProfile,
    resetActiveProfile,
    removeActiveProfile,
  } = useProfilesSync({ tasks, setTasks, settings, setSettings, setSelectedTaskId });

  const {
    profileImportPreview,
    setProfileImportPreview,
    exportActiveProfile,
    importActiveProfile,
    confirmProfileImport,
  } = useProfileImportExport({
    tasks,
    setTasks,
    settings,
    setSettings,
    activeProfile,
    activeProfileId,
    setSelectedTaskId,
    importProfileInputRef,
  });

  const {
    importPreview,
    setImportPreview,
    planningImportPreview,
    setPlanningImportPreview,
    importInputRef,
    importCalendarInputRef,
    importPlanningInputRef,
    importTasks,
    importCalendarTasks,
    importPlanningData,
    confirmImportTasks,
    confirmPlanningImport,
  } = useImportFlows({ tasks, setTasks, setSettings, setSelectedTaskId });

  const {
    localBackups,
    restoreLocalBackup,
    removeLocalBackup,
    exportTasks,
    backupData,
    exportTaskSchema,
    exportThemeRecipe,
  } = useBackupActions({
    tasks,
    setTasks,
    settings,
    setSettings,
    activeProfile,
    activeProfileId,
    isBackendAvailable,
    setSelectedTaskId,
    setIsSettingsOpen,
  });

  useLocalFallbackPersistence({
    tasks,
    setTasks,
    settings,
    setSettings,
    isProfileReady,
  });

  const value = useMemo(
    () => ({
      isBackendAvailable,
      isProfileReady,
      persistenceStatus: persistenceStatus as any,
      lastSavedAt,
      profiles,
      activeProfileId,
      selectProfile,
      newProfileName,
      setNewProfileName,
      profileAction,
      setProfileAction,
      profileError,
      syncConflict,
      keepLocalChanges,
      useServerChanges,
      activeProfile,
      reloadActiveProfile,
      createProfile,
      resetActiveProfile,
      removeActiveProfile,
      profileImportPreview,
      setProfileImportPreview,
      exportActiveProfile,
      importActiveProfile,
      confirmProfileImport,
      importPreview,
      setImportPreview,
      planningImportPreview,
      setPlanningImportPreview,
      importTasks,
      importCalendarTasks,
      importPlanningData,
      confirmImportTasks,
      confirmPlanningImport,
      localBackups,
      restoreLocalBackup,
      removeLocalBackup,
      exportTasks,
      backupData,
      exportTaskSchema,
      exportThemeRecipe,
      importProfileInputRef,
      importInputRef,
      importCalendarInputRef,
      importPlanningInputRef,
    }),
    [
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
      syncConflict,
      keepLocalChanges,
      useServerChanges,
      activeProfile,
      reloadActiveProfile,
      createProfile,
      resetActiveProfile,
      removeActiveProfile,
      profileImportPreview,
      setProfileImportPreview,
      exportActiveProfile,
      importActiveProfile,
      confirmProfileImport,
      importPreview,
      setImportPreview,
      planningImportPreview,
      setPlanningImportPreview,
      importTasks,
      importCalendarTasks,
      importPlanningData,
      confirmImportTasks,
      confirmPlanningImport,
      localBackups,
      restoreLocalBackup,
      removeLocalBackup,
      exportTasks,
      backupData,
      exportTaskSchema,
      exportThemeRecipe,
      importInputRef,
      importCalendarInputRef,
      importPlanningInputRef,
    ]
  );

  return <ProfileContext.Provider value={value as any}>{children}</ProfileContext.Provider>;
};
