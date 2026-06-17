import { useId, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { parseTagString } from '../../domain/tags';
import { cn } from '../../lib/cn';

type TagPickerProps = {
  label?: string;
  value: string;
  onChange: (nextValue: string) => void;
  onCommit?: (nextValue: string) => void;
  tagPool?: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

const formatTagString = (tags: string[]) => tags.join(', ');

const normalizeTagPool = (tagPool: string[]) => {
  const byKey = new Map<string, string>();
  tagPool.forEach((tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, trimmed);
  });
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
};

const fuzzyScore = (candidate: string, query: string) => {
  const item = candidate.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) return 1;
  if (item === needle) return 1000;
  if (item.startsWith(needle)) return 900 - item.length;
  const includesAt = item.indexOf(needle);
  if (includesAt >= 0) return 700 - includesAt - item.length / 100;

  let queryIndex = 0;
  let gaps = 0;
  let lastMatch = -1;
  for (let itemIndex = 0; itemIndex < item.length && queryIndex < needle.length; itemIndex += 1) {
    if (item[itemIndex] !== needle[queryIndex]) continue;
    if (lastMatch >= 0) gaps += itemIndex - lastMatch - 1;
    lastMatch = itemIndex;
    queryIndex += 1;
  }

  return queryIndex === needle.length ? 400 - gaps - item.length / 100 : -1;
};

export function TagPicker({
  label,
  value,
  onChange,
  onCommit,
  tagPool = [],
  placeholder,
  className,
  inputClassName
}: TagPickerProps) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const selectedTags = useMemo(() => parseTagString(value), [value]);
  const selectedKeys = useMemo(() => new Set(selectedTags.map((tag) => tag.toLowerCase())), [selectedTags]);
  const normalizedPool = useMemo(() => normalizeTagPool(tagPool), [tagPool]);
  const visibleTags = useMemo(
    () =>
      normalizedPool
        .map((tag) => ({ tag, score: fuzzyScore(tag, query) }))
        .filter(({ tag, score }) => score >= 0 && !selectedKeys.has(tag.toLowerCase()))
        .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag))
        .slice(0, 18)
        .map(({ tag }) => tag),
    [normalizedPool, query, selectedKeys]
  );
  const queryTag = query.trim();
  const canAddQuery =
    queryTag.length > 0 &&
    !selectedKeys.has(queryTag.toLowerCase()) &&
    !normalizedPool.some((tag) => tag.toLowerCase() === queryTag.toLowerCase());

  const commit = (nextValue = value) => {
    onCommit?.(nextValue);
  };

  const addTag = (tag: string) => {
    const nextValue = formatTagString([...selectedTags, tag]);
    onChange(nextValue);
    commit(nextValue);
    setQuery('');
  };

  return (
    <div
      className={cn('flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300', className)}
    >
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => commit()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400',
          inputClassName
        )}
      />
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-950/60 p-2 space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1.5">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find tag"
            aria-label="Find tag"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTag(tag)}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {tag}
            </button>
          ))}
          {canAddQuery && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTag(queryTag)}
              className="rounded-md border border-dashed border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200"
            >
              <Plus size={12} className="inline align-[-2px]" /> {queryTag}
            </button>
          )}
          {visibleTags.length === 0 && !canAddQuery && (
            <span className="px-1 py-1 text-xs font-normal text-slate-400">No matching tags</span>
          )}
        </div>
      </div>
    </div>
  );
}
