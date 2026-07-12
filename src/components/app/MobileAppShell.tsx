import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useProfileContext } from '../../contexts/ProfileContext';
import { useUIContext } from '../../contexts/UIContext';
import { TagFilterMenu } from '../TagFilterMenu';
import { MobileShell } from './MobileShell';

export function MobileAppShell() {
  const { settings, setSettings, openSettings, isSidebarVisible, toggleSidebarVisible } =
    useSettingsContext();
  const { addTask, setSelectedTaskId, tagPool, activeFilters, setActiveFilters } = useTaskContext();
  const { activeProfile } = useProfileContext();
  const { view, setView, setSidebarOpen, openMediaPlayer } = useUIContext();

  const setFocusedBoard = (focused: boolean) => {
    setSettings((previous) => ({ ...previous, mobileFocusMode: focused }));
    setView('board');
  };

  return (
    <MobileShell
      view={view}
      focusMode={settings.mobileFocusMode}
      activeProfileName={activeProfile?.name || 'Default profile'}
      onToday={() => setFocusedBoard(true)}
      onBoard={() => setFocusedBoard(false)}
      onCalendar={() => setView('calendar')}
      onAddTask={() => addTask('backlog', {}, (task) => setSelectedTaskId(task.id))}
      onNavigate={setView}
      onOpenSettings={() => openSettings()}
      onOpenProfiles={() => openSettings('profiles')}
      onOpenSidebar={() => {
        if (!isSidebarVisible) toggleSidebarVisible();
        setSidebarOpen(true);
      }}
      onOpenMedia={openMediaPlayer}
      filterContent={
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
      }
    />
  );
}
