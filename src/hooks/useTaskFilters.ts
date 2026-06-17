import { useMemo, useState } from 'react';
import { getEffectiveTags, taskMatchesSearch } from '../domain/tasks';

export function useTaskFilters(tasks) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allUniqueTags = useMemo<string[]>(
    () => Array.from(new Set(tasks.flatMap(getEffectiveTags))),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!taskMatchesSearch(task, searchQuery)) return false;
      if (activeFilters.length === 0) return true;
      const taskTags = getEffectiveTags(task);
      return activeFilters.some((filter) => taskTags.includes(filter));
    });
  }, [tasks, activeFilters, searchQuery]);

  return {
    activeFilters,
    setActiveFilters,
    isFilterOpen,
    setIsFilterOpen,
    searchQuery,
    setSearchQuery,
    allUniqueTags,
    filteredTasks
  };
}
