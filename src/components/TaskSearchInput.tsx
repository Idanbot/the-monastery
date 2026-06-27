import { Search, X } from 'lucide-react';

/**
 * Single responsive task search input. The `variant` controls the responsive
 * visibility and spacing so the same control can be placed in the header
 * (desktop) and above the board (mobile) without duplicating JSX.
 */
export function TaskSearchInput({
  value,
  onChange,
  variant,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  variant: 'header' | 'inline';
  disabled?: boolean;
}) {
  if (disabled) return null;

  const wrapperClass =
    variant === 'header'
      ? 'hidden lg:flex items-center gap-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-500'
      : 'lg:hidden mb-2 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-500 sm:mb-3 sm:py-2';

  return (
    <label className={wrapperClass}>
      <Search size={15} className="shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}
