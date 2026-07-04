import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnifiedSearch } from './useUnifiedSearch';

afterEach(() => vi.unstubAllGlobals());

describe('useUnifiedSearch', () => {
  it('debounces profile search and returns indexed entities', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              entityType: 'role',
              entityId: 'architect',
              title: 'Cloud Architect',
              summary: 'migration networking'
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useUnifiedSearch('migration', 'profile-a', true, 10));

    await waitFor(() => expect(result.current.results).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profiles/profile-a/search?q=migration&limit=10',
      expect.objectContaining({ headers: {} })
    );
  });
});
