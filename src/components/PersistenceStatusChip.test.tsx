import { describe, expect, it } from 'vitest';
import { getPersistenceStatusPresentation } from '../domain/persistenceStatus';

describe('persistence status presentation', () => {
  it('labels each persistence state for the header chip', () => {
    expect(getPersistenceStatusPresentation('saving', null).label).toBe('Saving');
    expect(getPersistenceStatusPresentation('saved', null).label).toBe('Saved');
    expect(getPersistenceStatusPresentation('error', null).label).toBe('Save failed');
    expect(getPersistenceStatusPresentation('offline', null).label).toBe('Local mode');
  });

  it('explains recovery behavior for offline and failed sync states', () => {
    expect(getPersistenceStatusPresentation('offline', null).description).toMatch(/stored locally/i);
    expect(getPersistenceStatusPresentation('error', null).description).toMatch(/export a backup/i);
  });

  it('keeps last saved time in the title', () => {
    const savedAt = new Date('2026-06-22T08:00:00Z');
    expect(getPersistenceStatusPresentation('saved', savedAt).title).toMatch(/Last saved/);
  });
});
