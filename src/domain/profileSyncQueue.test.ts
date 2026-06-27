import { describe, expect, it, vi } from 'vitest';
import { createProfileSyncQueue } from './profileSyncQueue';

describe('createProfileSyncQueue', () => {
  it('serializes writes and advances the shared revision', async () => {
    const queue = createProfileSyncQueue(4);
    const order: string[] = [];
    const first = queue.enqueue(async (revision) => {
      order.push(`first:${revision}`);
      await Promise.resolve();
      return { revision: revision + 1 };
    });
    const second = queue.enqueue(async (revision) => {
      order.push(`second:${revision}`);
      return { revision: revision + 1 };
    });

    await Promise.all([first, second]);
    expect(order).toEqual(['first:4', 'second:5']);
    expect(queue.getRevision()).toBe(6);
  });

  it('continues after a failed write without hiding the rejection', async () => {
    const queue = createProfileSyncQueue(2);
    const failure = queue.enqueue(async () => {
      throw new Error('offline');
    });
    await expect(failure).rejects.toThrow('offline');

    const next = vi.fn(async (revision) => ({ revision: revision + 1 }));
    await queue.enqueue(next);
    expect(next).toHaveBeenCalledWith(2);
  });

  it('ignores late stale reads but can reset for another profile', () => {
    const queue = createProfileSyncQueue(5);
    queue.setRevision(3);
    expect(queue.getRevision()).toBe(5);
    queue.resetRevision();
    expect(queue.getRevision()).toBe(0);
  });

  it('does not apply a completed write from a previous profile generation', async () => {
    const queue = createProfileSyncQueue(5);
    let finish!: (value: { revision: number }) => void;
    const pending = queue.enqueue(
      () =>
        new Promise<{ revision: number }>((resolve) => {
          finish = resolve;
        })
    );
    await Promise.resolve();
    queue.resetRevision();
    finish({ revision: 6 });
    await pending;
    expect(queue.getRevision()).toBe(0);
  });
});
