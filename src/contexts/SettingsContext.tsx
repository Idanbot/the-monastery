import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { loadInitialLocalSettings } from '../hooks/useLocalFallbackPersistence';
import { useThemeStyle } from '../hooks/useThemeStyle';
import { useResizableLayout } from '../hooks/useResizableLayout';
import { generateId } from '../domain/tasks';
import type { AppSettings, RoleDefinition, TaskStatus } from '../domain/types';

interface SettingsContextType {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isDarkMode: boolean;
  themeStyle: React.CSSProperties;
  modalEffectStyle: React.CSSProperties;
  isSidebarVisible: boolean;
  startResize: (id: string) => void;
  addRole: () => void;
  updateRole: (roleId: string, updates: Partial<RoleDefinition>) => void;
  removeRole: (roleId: string) => void;
  toggleBoardLane: (status: TaskStatus) => void;
  toggleSidebarVisible: () => void;
  toggleSidebarWidget: (widget: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settingsInitialSection: string | null;
  setSettingsInitialSection: React.Dispatch<React.SetStateAction<string | null>>;
  openSettings: (section?: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode; systemIsDark?: boolean }> = ({
  children,
  systemIsDark = false
}) => {
  const [settings, setSettings] = useState<AppSettings>(loadInitialLocalSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<string | null>(null);

  const { startResize } = useResizableLayout(setSettings);
  const { themeStyle, modalEffectStyle } = useThemeStyle(settings, systemIsDark);

  const isDarkMode = settings.theme === 'system' ? systemIsDark : settings.theme === 'dark';
  const isSidebarVisible = settings.sidebarVisible !== false;

  const addRole = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      roles: [
        ...(prev.roles || []),
        {
          id: generateId(),
          name: 'New Role',
          tags: [],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ]
    }));
  }, []);

  const updateRole = useCallback((roleId: string, updates: Partial<RoleDefinition>) => {
    setSettings((prev) => ({
      ...prev,
      roles: (prev.roles || []).map((role) => (role.id === roleId ? { ...role, ...updates } : role))
    }));
  }, []);

  const removeRole = useCallback((roleId: string) => {
    setSettings((prev) => ({
      ...prev,
      roles: (prev.roles || []).filter((role) => role.id !== roleId)
    }));
  }, []);

  const toggleBoardLane = useCallback((status: TaskStatus) => {
    setSettings((previous) => {
      const collapsed = previous.collapsedBoardLanes || [];
      return {
        ...previous,
        collapsedBoardLanes: collapsed.includes(status)
          ? collapsed.filter((item) => item !== status)
          : [...collapsed, status]
      };
    });
  }, []);

  const toggleSidebarVisible = useCallback(() => {
    setSettings((prev) => ({ ...prev, sidebarVisible: prev.sidebarVisible === false }));
  }, []);

  const toggleSidebarWidget = useCallback((widget: string) => {
    setSettings((prev) => ({
      ...prev,
      sidebarWidgets: prev.sidebarWidgets.includes(widget)
        ? prev.sidebarWidgets.filter((item) => item !== widget)
        : Array.from(new Set([...prev.sidebarWidgets, widget]))
    }));
  }, []);

  const openSettings = useCallback((section: string | null = null) => {
    setSettingsInitialSection(section);
    setIsSettingsOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      isDarkMode,
      themeStyle,
      modalEffectStyle,
      isSidebarVisible,
      startResize,
      addRole,
      updateRole,
      removeRole,
      toggleBoardLane,
      toggleSidebarVisible,
      toggleSidebarWidget,
      isSettingsOpen,
      setIsSettingsOpen,
      settingsInitialSection,
      setSettingsInitialSection,
      openSettings
    }),
    [
      settings,
      isDarkMode,
      themeStyle,
      modalEffectStyle,
      isSidebarVisible,
      startResize,
      addRole,
      updateRole,
      removeRole,
      toggleBoardLane,
      toggleSidebarVisible,
      toggleSidebarWidget,
      isSettingsOpen,
      settingsInitialSection,
      openSettings
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
