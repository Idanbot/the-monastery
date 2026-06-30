import { useMemo, useState } from 'react';

type Props = {
  knownTags: string[];
  activeFilters: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
};

export function TagFilterMenu({ knownTags, activeFilters, onToggleTag, onClear }: Props) {
  const [query, setQuery] = useState('');
  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? knownTags.filter((tag) => tag.toLowerCase().includes(needle)) : knownTags;
  }, [knownTags, query]);

  return (
    <>
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Filter by Tags</h4>
      <input
        role="combobox"
        aria-label="Search known tags"
        aria-autocomplete="list"
        aria-controls="known-tag-options"
        aria-expanded={options.length > 0}
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !options[0]) return;
          event.preventDefault();
          onToggleTag(options[0]);
          setQuery('');
        }}
        placeholder="Search tags"
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950"
      />
      {knownTags.length === 0 ? (
        <p className="text-sm italic text-slate-400">No known tags yet.</p>
      ) : options.length === 0 ? (
        <p className="text-sm italic text-slate-400">No matching tags.</p>
      ) : (
        <div
          id="known-tag-options"
          role="listbox"
          aria-label="Known tags"
          className="custom-scrollbar flex max-h-[200px] flex-wrap gap-1.5 overflow-y-auto"
        >
          {options.map((tag) => (
            <button
              key={tag}
              type="button"
              role="option"
              aria-selected={activeFilters.includes(tag)}
              onClick={() => onToggleTag(tag)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${activeFilters.includes(tag) ? 'border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-500/50 dark:bg-indigo-900/50 dark:text-indigo-200' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      {activeFilters.length > 0 && (
        <button type="button" onClick={onClear} className="mt-2 text-xs text-rose-500 hover:underline">
          Clear all
        </button>
      )}
    </>
  );
}
