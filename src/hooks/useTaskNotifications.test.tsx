import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { normalizeTask } from '../domain/tasks';
import { useTaskNotifications } from './useTaskNotifications';

afterEach(() => vi.unstubAllGlobals());

it('sends task alerts to configured webhooks without browser permission', async () => {
  const now = new Date('2026-07-02T10:00:30').getTime();
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ sent: ['slack'], failed: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  vi.stubGlobal('fetch', fetchMock);
  renderHook(() =>
    useTaskNotifications({
      enabled: false,
      webhookEnabled: true,
      tasks: [
        normalizeTask({
          id: 'task-1',
          title: 'Review architecture',
          scheduledDate: '2026-07-02',
          scheduledStart: '10:00'
        })
      ],
      now,
      onOpenTask: vi.fn()
    })
  );
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/integrations/alerts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Task starting now', body: 'Review architecture' })
      })
    )
  );
});
