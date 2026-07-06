import { Search, X } from 'lucide-react';

export type UnifiedSearchResult = {
  entityType: 'task' | 'role' | 'project';
  entityId: string;
  title: string;
  summary: string;
};

/**
 * Single responsive task search input. The `variant` controls the responsive
 * visibility and spacing so the same control can be placed in the header
 * (desktop) and above the board (mobile) without duplicating JSX.
 */
export function TaskSearchInput({
  value,
  onChange,
  variant,
  disabled = false,
  results = [],
  loading = false,
  onSelectResult
}: {
  value: string;
  onChange: (value: string) => void;
  variant: 'header' | 'inline';
  disabled?: boolean;
  results?: UnifiedSearchResult[];
  loading?: boolean;
  onSelectResult?: (result: UnifiedSearchResult) => void;
}) {
  if (disabled) return null;

  const containerClass =
    variant === 'header' ? 'relative hidden w-56 xl:block' : 'relative mb-2 xl:hidden sm:mb-3';
  const inputClass =
    'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 dark:border-slate-800 dark:bg-slate-900 ' +
    (variant === 'header' ? 'py-2 dark:border-slate-700 dark:bg-slate-800' : 'py-1.5 sm:py-2');
  const showResults = value.trim().length >= 2 && (loading || results.length > 0);

  return (
    <div className={containerClass}>
      <label className={inputClass}>
        <Search size={15} className="shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search everything"
          aria-label="Search tasks, notes, roles, and projects"
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
      {showResults && (
        <div
          data-testid="unified-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[95] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>
          )}
          {results.map((result) => (
            <button
              key={`${result.entityType}:${result.entityId}`}
              data-search-result={`${result.entityType}:${result.entityId}`}
              type="button"
              onClick={() => onSelectResult?.(result)}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {result.title}
                </span>
                <span className="shrink-0 text-[10px] uppercase text-slate-400">{result.entityType}</span>
              </span>
              {result.summary && (
                <span className="mt-0.5 block truncate text-xs text-slate-500">{result.summary}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
