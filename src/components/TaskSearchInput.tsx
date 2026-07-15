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
    variant === 'header'
      ? 'relative hidden min-w-48 flex-1 md:block xl:max-w-sm'
      : 'relative mb-2 md:hidden sm:mb-3';
  const inputClass =
    'ui-control flex items-center gap-2 rounded-xl px-3 text-[var(--ui-text-secondary)] ' +
    (variant === 'header' ? 'h-9' : 'min-h-12 py-1.5 sm:py-2');
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
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text-primary)] outline-none placeholder:text-[var(--ui-text-secondary)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-raised)] hover:text-[var(--ui-text-primary)]"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </label>
      {showResults && (
        <div
          data-testid="unified-search-results"
          className="themed-menu absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[95] max-h-80 overflow-y-auto rounded-2xl border p-1.5"
        >
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">Searching...</div>
          )}
          {results.map((result) => (
            <button
              key={`${result.entityType}:${result.entityId}`}
              data-search-result={`${result.entityType}:${result.entityId}`}
              type="button"
              onClick={() => onSelectResult?.(result)}
              className="ui-menu-item block min-h-12 w-full rounded-xl px-3 py-2 text-left"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-[var(--ui-text-primary)]">
                  {result.title}
                </span>
                <span className="shrink-0 text-[10px] uppercase text-[var(--ui-text-secondary)]">
                  {result.entityType}
                </span>
              </span>
              {result.summary && (
                <span className="mt-0.5 block truncate text-xs text-[var(--ui-text-secondary)]">
                  {result.summary}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
