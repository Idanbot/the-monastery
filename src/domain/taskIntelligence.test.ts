import { describe, expect, it } from 'vitest';
import { inferTaskTags, suggestTaskTags } from './taskIntelligence';
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

describe('suggestTaskTags', () => {
  it('returns only tags the task does not already carry', () => {
    const suggested = suggestTaskTags({
      title: 'GKE networking migration plan',
      existingTags: ['gke'],
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

    expect(suggested).toEqual(['networking', 'migration', 'gcp']);
  });

  it('respects the maxTags limit', () => {
    const suggested = suggestTaskTags({
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
      ],
      maxTags: 2
    });

    expect(suggested).toHaveLength(2);
  });

  it('returns nothing when all inferred tags are already present', () => {
    const suggested = suggestTaskTags({
      title: 'GKE networking',
      existingTags: ['gke', 'networking', 'gcp'],
      tagPool: ['gke', 'networking'],
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

    expect(suggested).toEqual([]);
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
