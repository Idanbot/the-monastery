import { useCallback, useEffect, useState } from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import {
  Activity,
  ChevronDown,
  Command,
  Filter,
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
const visibleVersion = (version: string) => 'v' + version.replace(/^v/, '');

export function AppHeader() {
  const { settings, isSidebarVisible, toggleSidebarVisible, openSettings } = useSettingsContext();

  const {
    addTask,
    currentTask,
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
    setSidebarOpen,
    isCommandOpen,
    setIsCommandOpen,
    commandPaletteGroups,
    setMonkMode,
    unifiedSearchResults,
    unifiedSearchLoading,
    selectUnifiedSearchResult
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
        className="app-header relative z-[70] hidden shrink-0 flex-col border-b md:flex"
      >
        <div data-testid="app-primary-bar" className="flex min-h-14 items-center gap-3 px-3 lg:px-4">
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Go to main view"
              onClick={() => {
                setMonkMode(false);
                setView('main');
                setSidebarOpen(false);
              }}
              className="ui-focus-ring flex items-center gap-2 rounded-xl text-left"
            >
              <span className="ui-accent-button flex h-9 w-9 items-center justify-center rounded-xl">
                <Activity size={18} />
              </span>
              <h1 className="hidden text-[15px] font-semibold leading-none lg:block">TheMonastery</h1>
            </button>
            <div
              data-testid="app-version-chip"
              title={`Version ${visibleVersion(frontendVersion)}`}
              className="ui-muted-chip hidden font-mono text-[10px] xl:inline-flex"
            >
              {visibleVersion(frontendVersion)}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 justify-center px-2">
            {currentTask ? (
              <button
                type="button"
                aria-label={`Open current work ${currentTask.title || 'Untitled task'}`}
                onClick={() => setSelectedTaskId(currentTask.id)}
                className="ui-current-work ui-focus-ring flex min-w-0 max-w-md items-center gap-2 rounded-full px-3 py-1.5 text-left"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--ui-success)]" />
                <span className="truncate text-xs font-semibold">{currentTask.title || 'Untitled task'}</span>
                <span className="hidden shrink-0 text-[10px] text-[var(--ui-text-secondary)] xl:inline">
                  Current work
                </span>
              </button>
            ) : (
              <span className="hidden text-xs text-[var(--ui-text-secondary)] xl:block">
                Choose one task. Give it your full attention.
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              aria-label={settings.monkMode ? 'Exit monk mode' : 'Enter monk mode'}
              title={settings.monkMode ? 'Exit monk mode' : 'Enter monk mode'}
              onClick={() => setMonkMode(!settings.monkMode)}
              className={`ui-icon-button ${settings.monkMode ? 'ui-icon-button-active' : ''}`}
            >
              <Target size={17} />
            </button>
            <button
              aria-label="Open command palette"
              aria-expanded={isCommandOpen}
              title="Command palette (Ctrl+K)"
              onClick={() => setIsCommandOpen(true)}
              className="ui-icon-button"
            >
              <Command size={18} />
            </button>
            <button aria-label="Open settings" onClick={() => openSettings()} className="ui-icon-button">
              <Settings size={18} />
            </button>
            <button
              aria-label="Backlog task"
              onClick={() => addTask('backlog', {}, (newTask) => setSelectedTaskId(newTask.id))}
              className="ui-accent-button flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
            >
              <Plus size={16} /> <span>Task</span>
            </button>
          </div>
        </div>

        <div
          data-testid="workspace-toolbar"
          role="toolbar"
          aria-label="Workspace controls"
          className="workspace-toolbar flex min-h-12 items-center gap-2 border-t px-3 py-1.5 lg:px-4"
        >
          <ViewSwitcher view={view} onChange={setView} disabled={settings.monkMode} />
          <TaskSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            variant="header"
            disabled={settings.monkMode}
            results={unifiedSearchResults}
            loading={unifiedSearchLoading}
            onSelectResult={selectUnifiedSearchResult}
          />

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {!settings.monkMode && (
              <div>
                <ThemedSurface
                  as="button"
                  variant="menuTrigger"
                  ref={setFilterReference}
                  aria-label="Filters"
                  title="Filter tasks"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`ui-icon-button relative ${activeFilters.length ? 'ui-icon-button-active' : ''}`}
                >
                  <Filter size={16} />
                  {activeFilters.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ui-info)] px-1 text-[9px] text-white">
                      {activeFilters.length}
                    </span>
                  )}
                </ThemedSurface>
                {isFilterOpen && (
                  <ThemedSurface
                    variant="menu"
                    ref={setFilterFloating}
                    style={filterFloatingStyles}
                    className="z-[90] flex w-72 flex-col gap-2 rounded-2xl border p-3"
                  >
                    <TagFilterMenu
                      knownTags={tagPool}
                      activeFilters={activeFilters}
                      onToggleTag={(tag) =>
                        setActiveFilters((previous) =>
                          previous.includes(tag)
                            ? previous.filter((item) => item !== tag)
                            : [...previous, tag]
                        )
                      }
                      onClear={() => setActiveFilters([])}
                    />
                  </ThemedSurface>
                )}
              </div>
            )}

            {view !== 'main' && view !== 'calendar' && (
              <button
                aria-label={isSidebarVisible ? 'Hide right container' : 'Show right container'}
                title={isSidebarVisible ? 'Hide right container' : 'Show right container'}
                onClick={toggleSidebarVisible}
                className={`ui-icon-button ${isSidebarVisible ? '' : 'ui-icon-button-active'}`}
              >
                {isSidebarVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              </button>
            )}

            {isBackendAvailable && (
              <div className="relative hidden lg:block">
                <ThemedSurface
                  as="button"
                  variant="menuTrigger"
                  ref={setProfileReference}
                  type="button"
                  data-testid="active-profile-control"
                  data-active-profile-id={activeProfileId}
                  title="Active profile"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="ui-control flex h-9 max-w-44 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold"
                >
                  <Users size={15} className="shrink-0" />
                  <span className="min-w-0 truncate">{activeProfile?.name || 'Profile'}</span>
                  <ChevronDown size={14} className="shrink-0" />
                  {!isProfileReady && <span className="sr-only">syncing</span>}
                </ThemedSurface>
                {isProfileOpen && (
                  <ThemedSurface
                    variant="menu"
                    ref={setProfileFloating}
                    style={profileFloatingStyles}
                    className="z-[90] flex w-64 flex-col gap-1 rounded-2xl border p-2"
                  >
                    <div className="ui-eyebrow px-2 py-1">Profiles</div>
                    {profiles.map((profile: any) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          selectProfile(profile.id);
                          setIsProfileOpen(false);
                        }}
                        className={`ui-menu-item w-full rounded-xl px-2.5 py-2 text-left text-sm ${profile.id === activeProfileId ? 'ui-menu-item-active' : ''}`}
                      >
                        <span className="block truncate font-medium">{profile.name}</span>
                        <span className="block text-[10px] text-[var(--ui-text-secondary)]">
                          {profile.taskCount ?? 0} tasks
                        </span>
                      </button>
                    ))}
                  </ThemedSurface>
                )}
              </div>
            )}

            {!isOnline && (
              <div
                data-testid="offline-status"
                className="ui-muted-chip hidden text-xs font-semibold text-[var(--ui-warning)] xl:flex"
              >
                Offline ready
              </div>
            )}
            <PersistenceStatusChip
              status={persistenceStatus as any}
              lastSavedAt={lastSavedAt ? new Date(lastSavedAt) : null}
              errorMessage={profileError}
            />
          </div>
        </div>
      </header>
      <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} groups={commandPaletteGroups} />
    </>
  );
}
