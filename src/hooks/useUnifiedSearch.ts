import { useEffect, useState } from 'react';
import type { UnifiedSearchResult } from '../components/TaskSearchInput';
import { apiRequest } from '../lib/api';

export const useUnifiedSearch = (query: string, profileId: string, enabled: boolean, debounceMs = 180) => {
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || !profileId || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void apiRequest<{ results: UnifiedSearchResult[] }>(
        `/api/profiles/${encodeURIComponent(profileId)}/search?q=${encodeURIComponent(trimmed)}&limit=10`
      )
        .then((response) => {
          if (!cancelled) setResults(response.results);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [debounceMs, enabled, profileId, query]);

  return { results, loading };
};
