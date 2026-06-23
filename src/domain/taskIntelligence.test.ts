import { describe, expect, it } from 'vitest';
import { inferTaskTags } from './taskIntelligence';
import { normalizeTask } from './tasks';

describe('task intelligence', () => {
  it('infers direct title tags and expands through matching role tags', () => {
    const tags = inferTaskTags({
      title: 'GKE networking migration plan',
      existingTags: [],
      tagPool: ['gke', 'networking', 'migration'],
      roles: [
        {
          id: 'cloud',
          name: 'Cloud Architect',
          tags: ['gcp', 'gke', 'networking'],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ]
    });

    expect(tags).toEqual(['gke', 'networking', 'migration', 'gcp']);
  });

  it('uses role names as graph nodes for role tags', () => {
    const tags = inferTaskTags({
      title: 'Senior backend queue design',
      existingTags: ['urgent'],
      tagPool: ['backend', 'queue'],
      roles: [
        {
          id: 'backend',
          name: 'Senior Backend',
          tags: ['backend', 'distributed-systems'],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ]
    });

    expect(tags).toEqual(['urgent', 'backend', 'queue', 'distributed-systems']);
  });
});

describe('normalizeTask createdAt', () => {
  it('keeps imported creation time and defaults missing tasks to now-ish creation time', () => {
    expect(normalizeTask({ title: 'Imported', createdAt: '2026-06-23T10:00:00.000Z' }).createdAt).toBe(
      '2026-06-23T10:00:00.000Z'
    );

    expect(new Date(normalizeTask({ title: 'Fresh' }).createdAt).getTime()).not.toBeNaN();
  });
});
