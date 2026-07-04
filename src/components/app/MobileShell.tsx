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
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-[75] grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgb(15_23_42/0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 md:hidden"
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
          className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border-4 border-slate-100 bg-indigo-600 text-white shadow-lg transition-transform active:scale-95 dark:border-slate-950"
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
            className="max-h-[78vh] w-full overflow-y-auto rounded-t-2xl border border-b-0 border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-slate-700"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-bold text-slate-900 dark:text-white">More</div>
                <div className="truncate text-xs text-slate-500">{activeProfileName}</div>
              </div>
              <button
                type="button"
                aria-label="Close more menu"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
              <MoreAction label="Profiles" icon={Users} onClick={() => runAndClose(onOpenProfiles)} />
              <MoreAction label="Settings" icon={Settings} onClick={() => runAndClose(onOpenSettings)} />
              {filterContent && (
                <MoreAction label="Filters" icon={Filter} onClick={() => setFiltersOpen((open) => !open)} />
              )}
            </div>

            {filtersOpen && filterContent && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                {filterContent}
              </div>
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
      className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
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
      className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-700 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      <Icon size={18} className="shrink-0 text-indigo-500" />
      {label}
    </button>
  );
}
