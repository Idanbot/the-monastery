import { describe, expect, it } from 'vitest';
import { parseQuickAddTask } from './quickAdd';

describe('parseQuickAddTask', () => {
  it('parses tags urgency date and time range from compact input', () => {
    const parsed = parseQuickAddTask('GKE migration tomorrow 9-10 #cloud #gke !7', {
      now: new Date('2026-06-24T08:00:00.000Z')
    });

    expect(parsed.title).toBe('GKE migration');
    expect(parsed.overrides).toMatchObject({
      title: 'GKE migration',
      tags: ['cloud', 'gke'],
      urgency: 7,
      scheduledDate: '2026-06-25',
      scheduledStart: '09:00',
      scheduledEnd: '10:00'
    });
  });

  it('turns urls into initial notes and removes them from title', () => {
    const parsed = parseQuickAddTask('Review Cilium https://ebpf.io/what-is-ebpf/ today #sre', {
      now: new Date('2026-06-24T08:00:00.000Z')
    });

    expect(parsed.title).toBe('Review Cilium');
    expect(parsed.overrides).toMatchObject({
      tags: ['sre'],
      scheduledDate: '2026-06-24',
      activity: [{ type: 'note', text: 'https://ebpf.io/what-is-ebpf/' }]
    });
  });
});
