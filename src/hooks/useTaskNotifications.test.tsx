import { renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { normalizeTask } from '../domain/tasks';
import { useTaskNotifications } from './useTaskNotifications';

afterEach(() => vi.unstubAllGlobals());

it('sends each due browser notification once', () => {
  const created: Array<{ title: string; options: NotificationOptions }> = [];
  class NotificationMock {
    static permission = 'granted';
    onclick = null;
    constructor(title: string, options: NotificationOptions) {
      created.push({ title, options });
    }
    close() {}
  }
  vi.stubGlobal('Notification', NotificationMock);
  const now = new Date('2026-07-02T10:00:30').getTime();
  const props = {
    enabled: true,
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
  };
  const { rerender } = renderHook(() => useTaskNotifications(props));
  rerender();
  expect(created).toEqual([
    expect.objectContaining({
      title: 'Task starting now',
      options: expect.objectContaining({ body: 'Review architecture' })
    })
  ]);
});
