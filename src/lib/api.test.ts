import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, shouldUseBackend } from './api';

describe('api helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not use the backend in the test runtime', () => {
    expect(shouldUseBackend()).toBe(false);
  });

  it('sends JSON requests and returns parsed response bodies', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ saved: true })
    });
    vi.stubGlobal('fetch', fetch);

    await expect(
      apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Task' }),
        headers: { 'X-Test': 'yes' }
      })
    ).resolves.toEqual({ saved: true });

    expect(fetch).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json', 'X-Test': 'yes' })
      })
    );
  });

  it('throws API error messages and falls back when the response is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Nope' })
      })
    );
    await expect(apiRequest('/api/fail')).rejects.toThrow('Nope');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('not json'))
      })
    );
    await expect(apiRequest('/api/fail')).rejects.toThrow('Request failed.');
  });
});
