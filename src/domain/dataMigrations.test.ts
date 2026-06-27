import { describe, expect, it } from 'vitest';
import { currentDataSchemaVersion, migrateProfileData, migrateStoredTasks } from './dataMigrations';

describe('data migrations', () => {
  it('migrates legacy task status and missing envelopes to the current version', () => {
    const migrated = migrateProfileData({
      tasks: [{ id: 'legacy', title: 'Legacy', status: 'new' }],
      settings: { layoutPreset: 'standard' }
    });

    expect(migrated.schemaVersion).toBe(currentDataSchemaVersion);
    expect(migrated.tasks[0].status).toBe('backlog');
    expect(migrated.settings.layoutPreset).toBe('three-column');
  });

  it('accepts both legacy arrays and versioned local task envelopes', () => {
    expect(migrateStoredTasks([{ id: 'one', title: 'One' }])[0].id).toBe('one');
    expect(migrateStoredTasks({ schemaVersion: 1, data: [{ id: 'two', title: 'Two' }] })[0].id).toBe('two');
  });

  it('rejects payloads newer than the running application', () => {
    expect(() => migrateProfileData({ schemaVersion: 999, tasks: [] })).toThrow(/newer/i);
  });
});
