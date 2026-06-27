// @vitest-environment node

import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { currentDatabaseVersion, runDatabaseMigrations } from './migrations.js';

let directory = '';

afterEach(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('database migrations', () => {
  it('upgrades an existing profile table with a revision column', () => {
    directory = mkdtempSync(join(tmpdir(), 'the-monastery-migration-'));
    const db = new Database(join(directory, 'legacy.sqlite'));
    db.exec('CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT, created_at TEXT, updated_at TEXT)');

    runDatabaseMigrations(db);

    const columns = db.pragma('table_info(profiles)') as { name: string }[];
    expect(columns.map((column) => column.name)).toContain('revision');
    expect(db.pragma('user_version', { simple: true })).toBe(currentDatabaseVersion);
    db.close();
  });
});
