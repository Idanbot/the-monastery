import { describe, expect, it, vi } from 'vitest';
import { createProfileSyncQueue } from './profileSyncQueue';

describe('createProfileSyncQueue', () => {
  it('serializes task writes and advances only the tasks revision', async () => {
    const queue = createProfileSyncQueue(4, 9);
    const order: string[] = [];
    const first = queue.enqueueTask(async (revision) => {
      order.push(`first:${revision}`);
      await Promise.resolve();
      return { revision: revision + 1 };
    });
    const second = queue.enqueueTask(async (revision) => {
      order.push(`second:${revision}`);
      return { revision: revision + 1 };
    });

    await Promise.all([first, second]);
    expect(order).toEqual(['first:4', 'second:5']);
    expect(queue.getTasksRevision()).toBe(6);
    expect(queue.getSettingsRevision()).toBe(9);
  });

  it('advances the settings revision independently of the tasks revision', async () => {
    const queue = createProfileSyncQueue(2, 7);
    await queue.enqueueSettings(async (revision) => ({ revision: revision + 1 }));

    expect(queue.getSettingsRevision()).toBe(8);
    expect(queue.getTasksRevision()).toBe(2);
  });

  it('serializes task and settings writes through the same chain', async () => {
    const queue = createProfileSyncQueue(0, 0);
    const order: string[] = [];
    const taskWrite = queue.enqueueTask(async (rev) => {
      order.push(`task:${rev}`);
      return { revision: rev + 1 };
    });
    const settingsWrite = queue.enqueueSettings(async (rev) => {
      order.push(`settings:${rev}`);
      return { revision: rev + 1 };
    });

    await Promise.all([taskWrite, settingsWrite]);
    expect(order).toEqual(['task:0', 'settings:0']);
    expect(queue.getTasksRevision()).toBe(1);
    expect(queue.getSettingsRevision()).toBe(1);
  });

  it('continues after a failed write without hiding the rejection', async () => {
    const queue = createProfileSyncQueue(2);
    const failure = queue.enqueueTask(async () => {
      throw new Error('offline');
    });
    await expect(failure).rejects.toThrow('offline');

    const next = vi.fn(async (revision) => ({ revision: revision + 1 }));
    await queue.enqueueTask(next);
    expect(next).toHaveBeenCalledWith(2);
  });

  it('ignores late stale reads but can reset for another profile', () => {
    const queue = createProfileSyncQueue(5, 8);
    queue.setTasksRevision(3);
    expect(queue.getTasksRevision()).toBe(5);
    queue.resetRevision();
    expect(queue.getTasksRevision()).toBe(0);
    expect(queue.getSettingsRevision()).toBe(0);
  });

  it('does not apply a completed write from a previous profile generation', async () => {
    const queue = createProfileSyncQueue(5, 5);
    let finish!: (value: { revision: number }) => void;
    const pending = queue.enqueueTask(
      () =>
        new Promise<{ revision: number }>((resolve) => {
          finish = resolve;
        })
    );
    await Promise.resolve();
    queue.resetRevision();
    finish({ revision: 6 });
    await pending;
    expect(queue.getTasksRevision()).toBe(0);
  });
});
