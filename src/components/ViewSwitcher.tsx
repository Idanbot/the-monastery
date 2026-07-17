import { BarChart2, Calendar, FolderKanban, House, LayoutDashboard, ListTodo } from 'lucide-react';

const VIEWS = [
  { id: 'main', label: 'Main', icon: House },
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'mobile', label: 'List', icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'dashboard', label: 'Analytics', icon: BarChart2 }
] as const;

export type AppView = (typeof VIEWS)[number]['id'];

/**
 * Single responsive view switcher. Renders a compact <select> on small screens
 * and a segmented control on >= sm. Replaces the previous duplicated
 * mobile/desktop switcher blocks in App.
 */
export function ViewSwitcher({
  view,
  onChange,
  disabled = false
}: {
  view: string;
  onChange: (view: string) => void;
  disabled?: boolean;
}) {
  if (disabled) return null;

  return (
    <>
      <select
        aria-label="Current view"
        value={view}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-24 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:hidden"
      >
        {VIEWS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <div
        role="group"
        aria-label="Workspace views"
        className="ui-control hidden shrink-0 rounded-xl p-1 sm:flex"
      >
        {VIEWS.map((option) => {
          const Icon = option.icon;
          const active = view === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(option.id)}
              className={`ui-focus-ring flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold ${active ? 'bg-[var(--ui-surface-raised)] text-[var(--ui-info)] shadow-sm' : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'}`}
              data-testid={`view-switch-${option.id}`}
            >
              <Icon size={15} />
              <span className={active ? 'hidden xl:inline' : 'sr-only'}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
