import { useEffect, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  Filter,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  Music2,
  PanelRightOpen,
  Plus,
  Settings,
  Users,
  X
} from 'lucide-react';
import { ThemedSurface } from '../ui/ThemedSurface';

type Props = {
  view: string;
  focusMode: boolean;
  activeProfileName: string;
  onToday: () => void;
  onBoard: () => void;
  onCalendar: () => void;
  onAddTask: () => void;
  onNavigate: (view: 'projects' | 'dashboard') => void;
  onOpenSettings: () => void;
  onOpenProfiles: () => void;
  onOpenSidebar: () => void;
  onOpenMedia: () => void;
  filterContent?: ReactNode;
};

export function MobileShell({
  view,
  focusMode,
  activeProfileName,
  onToday,
  onBoard,
  onCalendar,
  onAddTask,
  onNavigate,
  onOpenSettings,
  onOpenProfiles,
  onOpenSidebar,
  onOpenMedia,
  filterContent
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const todayActive = view === 'board' && focusMode;
  const boardActive = view === 'board' && !focusMode;

  useEffect(() => {
    if (!moreOpen) return undefined;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [moreOpen]);

  const runAndClose = (action: () => void) => {
    action();
    setMoreOpen(false);
  };

  return (
    <>
      <nav
        data-testid="mobile-shell"
        data-material="control"
        aria-label="Mobile navigation"
        className="mobile-navigation fixed inset-x-0 bottom-0 z-[75] grid grid-cols-5 border-t px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
      >
        <NavButton label="Today" active={todayActive} icon={ListChecks} onClick={onToday} />
        <NavButton label="Board" active={boardActive} icon={LayoutDashboard} onClick={onBoard} />
        <div aria-hidden="true" />
        <NavButton label="Calendar" active={view === 'calendar'} icon={CalendarDays} onClick={onCalendar} />
        <NavButton
          label="More"
          active={moreOpen || view === 'projects' || view === 'dashboard'}
          icon={MoreHorizontal}
          onClick={() => setMoreOpen(true)}
        />
        <button
          type="button"
          aria-label="Create task"
          title="Create backlog task"
          onClick={onAddTask}
          className="ui-accent-button absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border-4 border-[var(--ui-canvas)] shadow-lg"
        >
          <Plus size={25} />
        </button>
      </nav>

      {moreOpen && (
        <ThemedSurface
          variant="overlay"
          className="fixed inset-0 z-[80] flex items-end bg-slate-950/25 md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMoreOpen(false);
          }}
        >
          <ThemedSurface
            variant="modal"
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="max-h-[78vh] w-full overflow-y-auto rounded-t-2xl border border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold text-[var(--ui-text-primary)]">More</div>
                <div className="truncate text-xs text-[var(--ui-text-secondary)]">{activeProfileName}</div>
              </div>
              <button
                type="button"
                aria-label="Close more menu"
                onClick={() => setMoreOpen(false)}
                className="ui-icon-button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MoreAction
                label="Projects"
                icon={FolderKanban}
                onClick={() => runAndClose(() => onNavigate('projects'))}
              />
              <MoreAction
                label="Analytics"
                icon={BarChart3}
                onClick={() => runAndClose(() => onNavigate('dashboard'))}
              />
              <MoreAction
                label="Now & timeline"
                icon={PanelRightOpen}
                onClick={() => runAndClose(onOpenSidebar)}
              />
              <MoreAction label="Music" icon={Music2} onClick={() => runAndClose(onOpenMedia)} />
              <MoreAction label="Profiles" icon={Users} onClick={() => runAndClose(onOpenProfiles)} />
              <MoreAction label="Settings" icon={Settings} onClick={() => runAndClose(onOpenSettings)} />
              {filterContent && (
                <MoreAction label="Filters" icon={Filter} onClick={() => setFiltersOpen((open) => !open)} />
              )}
            </div>

            {filtersOpen && filterContent && (
              <div className="ui-surface mt-3 rounded-xl border p-3">{filterContent}</div>
            )}
          </ThemedSurface>
        </ThemedSurface>
      )}
    </>
  );
}

type ActionProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

function NavButton({ label, active, icon: Icon, onClick }: ActionProps & { active: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`ui-focus-ring flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold ${active ? 'text-[var(--ui-info)]' : 'text-[var(--ui-text-secondary)]'}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function MoreAction({ label, icon: Icon, onClick }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ui-surface ui-focus-ring flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold active:brightness-95"
    >
      <Icon size={18} className="shrink-0 text-[var(--ui-info)]" />
      {label}
    </button>
  );
}
