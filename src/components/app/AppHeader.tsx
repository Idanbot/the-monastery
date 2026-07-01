import { useCallback, useEffect, useState } from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import {
  Activity,
  ChevronDown,
  Clock,
  Command,
  Filter,
  HelpCircle,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings,
  Target,
  Users
} from 'lucide-react';
import { ThemedSurface } from '../ui/ThemedSurface';
import { ViewSwitcher } from '../ViewSwitcher';
import { TaskSearchInput } from '../TaskSearchInput';
import { TagFilterMenu } from '../TagFilterMenu';
import { PersistenceStatusChip } from '../PersistenceStatusChip';
import { CommandPalette } from '../CommandPalette';

import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useProfileContext } from '../../contexts/ProfileContext';
import { useUIContext } from '../../contexts/UIContext';

const frontendVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const visibleVersion = (version: string) => {
  const match = version.match(/^(\d+)\.(\d+)/);
  return match ? `v${match[1]}.${match[2]}` : `v${version}`;
};

export function AppHeader() {
  const { settings, isSidebarVisible, toggleSidebarVisible, toggleSidebarWidget, openSettings } =
    useSettingsContext();

  const {
    addTask,
    setSelectedTaskId,
    tagPool,
    activeFilters,
    setActiveFilters,
    isFilterOpen,
    setIsFilterOpen,
    searchQuery,
    setSearchQuery
  } = useTaskContext();

  const {
    isBackendAvailable,
    isProfileReady,
    profiles,
    activeProfileId,
    activeProfile,
    selectProfile,
    persistenceStatus,
    lastSavedAt,
    profileError
  } = useProfileContext();

  const {
    view,
    setView,
    isOnline,
    sidebarOpen,
    setSidebarOpen,
    isCommandOpen,
    setIsCommandOpen,
    commandPaletteGroups,
    setIsShortcutHelpOpen,
    setMonkMode
  } = useUIContext();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { refs: filterRefs, floatingStyles: filterFloatingStyles } = useFloating({
    open: isFilterOpen,
    onOpenChange: setIsFilterOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  const { refs: profileRefs, floatingStyles: profileFloatingStyles } = useFloating({
    open: isProfileOpen,
    onOpenChange: setIsProfileOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  const [profileReferenceNode, setProfileReferenceNode] = useState(null);
  const [profileFloatingNode, setProfileFloatingNode] = useState(null);
  const setFilterReference = useCallback((node) => filterRefs.setReference(node), [filterRefs]);
  const setFilterFloating = useCallback((node) => filterRefs.setFloating(node), [filterRefs]);
  const setProfileReference = useCallback(
    (node) => {
      profileRefs.setReference(node);
      setProfileReferenceNode(node);
    },
    [profileRefs]
  );
  const setProfileFloating = useCallback(
    (node) => {
      profileRefs.setFloating(node);
      setProfileFloatingNode(node);
    },
    [profileRefs]
  );

  useEffect(() => {
    if (!isProfileOpen) return undefined;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (profileReferenceNode?.contains(target) || profileFloatingNode?.contains(target)) return;
      setIsProfileOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [isProfileOpen, profileFloatingNode, profileReferenceNode]);

  return (
    <>
      <header
        data-material="control"
        className="app-header z-[70] flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-4 sm:py-3 md:px-6"
      >
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle sidebar"
            className="-ml-2 p-2 text-slate-500 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            aria-label="Go to board"
            onClick={() => {
              setMonkMode(false);
              setView('board');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="rounded-lg bg-indigo-600 p-1.5 text-white shadow-sm">
              <Activity size={18} />
            </span>
            <h1 className="hidden text-lg font-bold leading-none tracking-tight text-slate-800 dark:text-white sm:block md:text-xl">
              TheMonastery
            </h1>
          </button>
          <div
            data-testid="app-version-chip"
            title={`Version ${visibleVersion(frontendVersion)}`}
            className="hidden items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 lg:flex"
          >
            {visibleVersion(frontendVersion)}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-1 sm:gap-2 md:gap-3">
          <ViewSwitcher view={view} onChange={setView} disabled={settings.monkMode} />
          <TaskSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            variant="header"
            disabled={settings.monkMode}
          />
          {isBackendAvailable && (
            <div className="relative hidden sm:block">
              <ThemedSurface
                as="button"
                variant="menuTrigger"
                ref={setProfileReference}
                type="button"
                data-testid="active-profile-control"
                data-active-profile-id={activeProfileId}
                title="Active profile"
                onClick={() => setIsProfileOpen((open) => !open)}
                className="flex max-w-48 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium"
              >
                <Users size={15} className="shrink-0 text-slate-400" />
                <span className="min-w-0 truncate">{activeProfile?.name || 'Profile'}</span>
                <ChevronDown size={14} className="shrink-0 text-slate-400" />
                {!isProfileReady && <span className="text-[10px] text-slate-400">syncing</span>}
              </ThemedSurface>
              {isProfileOpen && (
                <ThemedSurface
                  variant="menu"
                  ref={setProfileFloating}
                  style={profileFloatingStyles}
                  className="z-[90] flex w-64 flex-col gap-1 rounded-xl border p-2 shadow-2xl"
                >
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Profiles
                  </div>
                  {profiles.map((profile: any) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        selectProfile(profile.id);
                        setIsProfileOpen(false);
                      }}
                      className={`w-full rounded-lg px-2.5 py-2 text-left text-sm ${profile.id === activeProfileId ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    >
                      <span className="block truncate font-medium">{profile.name}</span>
                      <span className="block text-[10px] text-slate-400">{profile.taskCount ?? 0} tasks</span>
                    </button>
                  ))}
                </ThemedSurface>
              )}
            </div>
          )}
          {!settings.monkMode && (
            <div className="block">
              <ThemedSurface
                as="button"
                variant="menuTrigger"
                ref={setFilterReference}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1 rounded-lg border p-2 text-sm font-medium ${activeFilters.length ? 'border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
              >
                <Filter size={16} /> <span className="sr-only lg:not-sr-only">Filters</span>
                {activeFilters.length > 0 && (
                  <span className="rounded-full bg-indigo-500 px-1.5 text-[10px] text-white">
                    {activeFilters.length}
                  </span>
                )}
              </ThemedSurface>
              {isFilterOpen && (
                <ThemedSurface
                  variant="menu"
                  ref={setFilterFloating}
                  style={filterFloatingStyles}
                  className="z-[90] flex w-64 flex-col gap-2 rounded-xl border p-3 shadow-2xl"
                >
                  <TagFilterMenu
                    knownTags={tagPool}
                    activeFilters={activeFilters}
                    onToggleTag={(tag) =>
                      setActiveFilters((previous) =>
                        previous.includes(tag) ? previous.filter((item) => item !== tag) : [...previous, tag]
                      )
                    }
                    onClear={() => setActiveFilters([])}
                  />
                </ThemedSurface>
              )}
            </div>
          )}
          <div
            data-testid="offline-status"
            className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold lg:block ${isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}
          >
            {isOnline ? 'Online' : 'Offline ready'}
          </div>
          <PersistenceStatusChip
            status={persistenceStatus as any}
            lastSavedAt={lastSavedAt ? new Date(lastSavedAt) : null}
            errorMessage={profileError}
          />
          <div className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 md:block" />
          <button
            aria-label={settings.monkMode ? 'Exit monk mode' : 'Enter monk mode'}
            onClick={() => setMonkMode(!settings.monkMode)}
            className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:flex ${settings.monkMode ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            <Target size={15} /> <span className="hidden md:inline">Monk</span>
          </button>
          <button
            aria-label={isSidebarVisible ? 'Hide right container' : 'Show right container'}
            title={isSidebarVisible ? 'Hide right container' : 'Show right container'}
            onClick={toggleSidebarVisible}
            className={`hidden rounded-lg border p-2 md:flex ${isSidebarVisible ? 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'border-indigo-600 bg-indigo-600 text-white'}`}
          >
            {isSidebarVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <button
            aria-label={settings.sidebarWidgets.includes('clock') ? 'Hide clock' : 'Show clock'}
            title={settings.sidebarWidgets.includes('clock') ? 'Hide clock' : 'Show clock'}
            onClick={() => toggleSidebarWidget('clock')}
            className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 md:flex"
          >
            <Clock size={16} />
          </button>
          <button
            aria-label="Open command palette"
            aria-expanded={isCommandOpen}
            title="Command palette (Ctrl+K)"
            onClick={() => setIsCommandOpen(true)}
            className="hidden rounded-full p-2 text-slate-500 md:block"
          >
            <Command size={18} />
          </button>
          <button
            aria-label="Shortcuts & Guide"
            onClick={() => setIsShortcutHelpOpen(true)}
            className="hidden rounded-full p-2 text-slate-500 md:block"
          >
            <HelpCircle size={18} />
          </button>
          <button
            aria-label="Open settings"
            onClick={() => openSettings()}
            className="rounded-full p-2 text-slate-500"
          >
            <Settings size={18} />
          </button>
          <button
            aria-label="Backlog task"
            onClick={() => {
              addTask('backlog', {}, (newTask) => setSelectedTaskId(newTask.id));
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm md:px-4 md:py-2"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Backlog Task</span>
          </button>
        </div>
      </header>
      <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} groups={commandPaletteGroups} />
    </>
  );
}
