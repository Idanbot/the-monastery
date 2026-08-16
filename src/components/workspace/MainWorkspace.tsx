import { useState } from 'react';
import { CalendarDays, Columns3, Settings2 } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import { FocusPlanningPanel } from '../planning/FocusPlanningPanel';
import { MainViewGrid } from './MainViewGrid';
import { WorkspaceKanbanDialog } from './WorkspaceKanbanDialog';

export function MainWorkspace() {
  const { settings, openSettings } = useSettingsContext();
  const { tasks, applyFocusPlan } = useTaskContext();
  const { now } = useUIContext();
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [focusPlannerOpen, setFocusPlannerOpen] = useState(false);

  return (
    <div data-testid="main-workspace" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <h2 className="truncate text-lg font-semibold text-[var(--ui-text-primary)]">Focus workspace</h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFocusPlannerOpen((open) => !open)}
            className="ui-control ui-focus-ring hidden min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold lg:flex"
          >
            <CalendarDays size={16} /> Plan day
          </button>
          <button
            type="button"
            aria-label="Open Kanban"
            onClick={() => setKanbanOpen(true)}
            className="ui-accent-button ui-focus-ring flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
          >
            <Columns3 size={16} /> Kanban
          </button>
          <button
            type="button"
            aria-label="Customize main view"
            onClick={() => openSettings('main')}
            className="ui-icon-button ui-control"
          >
            <Settings2 size={17} />
          </button>
        </div>
      </div>
      {focusPlannerOpen && (
        <FocusPlanningPanel
          tasks={tasks}
          settings={settings}
          now={now}
          onApply={(date, taskIds, startMinutes) => {
            applyFocusPlan(date, taskIds, startMinutes);
            setFocusPlannerOpen(false);
          }}
          onClose={() => setFocusPlannerOpen(false)}
        />
      )}
      <MainViewGrid />
      <WorkspaceKanbanDialog open={kanbanOpen} onOpenChange={setKanbanOpen} />
    </div>
  );
}
