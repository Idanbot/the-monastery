import { Toaster } from 'sonner';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { TaskProvider } from './contexts/TaskContext';
import { ProfileProvider, useProfileContext } from './contexts/ProfileContext';
import { UIProvider, useUIContext } from './contexts/UIContext';
import { cssVars } from './lib/cssVars';

import { AppHeader } from './components/app/AppHeader';
import { WorkspaceSidebar } from './components/app/WorkspaceSidebar';
import { WorkspaceContent } from './components/workspace/WorkspaceContent';
import { ShortcutHelpDialog, ProfileActionDialog } from './components/app/AppDialogs';
import { SettingsModal } from './components/settings/SettingsModal';
import { TaskModal } from './components/task-modal/TaskModal';
import { CommandPalette } from './components/CommandPalette';
import { ProfileImportDialog } from './components/app/ProfileImportDialog';
import { PlanningImportDialog } from './components/app/PlanningImportDialog';
import { ImportPreviewDialog } from './components/app/ImportPreviewDialog';

export default function App() {
  return (
    <SettingsProvider>
      <TaskProvider>
        <ProfileProvider>
          <UIProvider>
            <AppShell />
          </UIProvider>
        </ProfileProvider>
      </TaskProvider>
    </SettingsProvider>
  );
}

function AppShell() {
  const {
    settings,
    isDarkMode,
    themeStyle,
    modalEffectStyle,
    isSettingsOpen,
    setIsSettingsOpen,
    settingsInitialSection
  } = useSettingsContext();

  const {
    isBackendAvailable,
    persistenceStatus,
    profileError,
    syncConflict,
    keepLocalChanges,
    useServerChanges,
    reloadActiveProfile,
    activeProfile,
    profileAction,
    setProfileAction,
    resetActiveProfile,
    removeActiveProfile
  } = useProfileContext();

  const { isShortcutHelpOpen, setIsShortcutHelpOpen, isCommandOpen, setIsCommandOpen, commandPaletteGroups } =
    useUIContext();

  return (
    <div
      className={`${isDarkMode ? 'dark' : ''} app-shell h-screen w-full flex flex-col overflow-hidden`}
      data-text-size={settings.textSize}
      data-visual-theme={settings.visualTheme}
      data-monk-mode={settings.monkMode ? 'true' : 'false'}
      data-animations-enabled={settings.animationsEnabled === false ? 'false' : 'true'}
      data-resize-bars={settings.resizeHandleVisible === false ? 'false' : 'true'}
      style={cssVars({
        ...themeStyle,
        ...modalEffectStyle,
        '--resize-handle-thickness': String(settings.resizeHandleThickness || 4) + 'px',
        '--resize-handle-length': String(settings.resizeHandleLength || 48) + 'px',
        '--resize-handle-color': settings.resizeHandleColor || '#94a3b8'
      })}
    >
      <div className="app-frame h-full w-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors duration-200">
        <Toaster richColors position="top-right" theme={isDarkMode ? 'dark' : 'light'} />

        <AppHeader />

        {(persistenceStatus === 'error' ||
          persistenceStatus === 'offline' ||
          profileError ||
          syncConflict) && (
          <div
            data-testid="sync-recovery-notice"
            className={
              'border-b px-4 py-2 text-xs font-medium ' +
              (persistenceStatus === 'error' || profileError || syncConflict
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200')
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span>
                {persistenceStatus === 'error' || profileError || syncConflict
                  ? 'Sync problem: ' +
                    (syncConflict?.message ||
                      profileError ||
                      'Your latest edits remain in this browser. Export a backup if this persists.')
                  : 'Local mode: backend unavailable. Changes are saved on this device until sync is available.'}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {syncConflict && (
                  <>
                    <button
                      type="button"
                      onClick={keepLocalChanges}
                      className="rounded border border-current px-2 py-1 text-[11px]"
                    >
                      Keep local changes
                    </button>
                    <button
                      type="button"
                      onClick={useServerChanges}
                      className="rounded border border-current px-2 py-1 text-[11px]"
                    >
                      Use server version
                    </button>
                  </>
                )}
                {!syncConflict && (persistenceStatus === 'error' || profileError) && isBackendAvailable && (
                  <button
                    type="button"
                    onClick={reloadActiveProfile}
                    className="rounded border border-current px-2 py-1 text-[11px]"
                  >
                    Reload profile
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="app-main flex-1 min-h-0 flex flex-col md:flex-row relative bg-slate-100 dark:bg-slate-950 p-2 gap-2 sm:p-4 sm:gap-4 overflow-hidden">
          <WorkspaceContent />
          <WorkspaceSidebar />
        </main>

        <ShortcutHelpDialog open={isShortcutHelpOpen} onClose={() => setIsShortcutHelpOpen(false)} />

        {isSettingsOpen && (
          <SettingsModal initialSection={settingsInitialSection} onClose={() => setIsSettingsOpen(false)} />
        )}

        <ProfileActionDialog
          action={profileAction}
          profileName={activeProfile?.name}
          onCancel={() => setProfileAction(null)}
          onConfirm={profileAction === 'reset' ? resetActiveProfile : removeActiveProfile}
        />

        <ProfileImportDialog />
        <PlanningImportDialog />
        <ImportPreviewDialog />

        <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} groups={commandPaletteGroups} />

        <TaskModal />
      </div>
    </div>
  );
}
