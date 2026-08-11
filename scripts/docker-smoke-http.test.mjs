import { describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout } from './docker-smoke-http.mjs';

describe('fetchWithTimeout', () => {
  it('rejects when an HTTP request never settles', async () => {
    const fetchImpl = vi.fn(() => new Promise(() => {}));

    await expect(fetchWithTimeout('http://127.0.0.1:1/api/health', 10, fetchImpl)).rejects.toThrow(
      'Timed out requesting http://127.0.0.1:1/api/health'
    );
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(globalThis.AbortSignal);
  });
});
