import { BarChart2, LayoutDashboard, ListTodo } from 'lucide-react';

const VIEWS = [
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'mobile', label: 'List', icon: ListTodo },
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
      <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        {VIEWS.map((option) => {
          const Icon = option.icon;
          const active = view === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${active ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Icon size={14} /> <span className="hidden md:inline">{option.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
