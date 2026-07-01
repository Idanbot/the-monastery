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

  it('adds independent tasks_revision and settings_revision columns', () => {
    directory = mkdtempSync(join(tmpdir(), 'the-monastery-migration-'));
    const db = new Database(join(directory, 'split-revision.sqlite'));
    // Start from a v2-era schema that already has the legacy revision column.
    db.exec(`
      CREATE TABLE profiles (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TEXT,
        updated_at TEXT,
        revision INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE tasks (
        profile_id TEXT,
        task_id TEXT,
        task_json TEXT,
        position INTEGER,
        updated_at TEXT,
        PRIMARY KEY (profile_id, task_id)
      );
      CREATE TABLE profile_settings (
        profile_id TEXT PRIMARY KEY,
        settings_json TEXT,
        updated_at TEXT
      );
    `);
    db.pragma('user_version = 2');

    runDatabaseMigrations(db);

    const columns = db.pragma('table_info(profiles)') as { name: string }[];
    const columnNames = columns.map((column) => column.name);
    expect(columnNames).toContain('tasks_revision');
    expect(columnNames).toContain('settings_revision');
    expect(db.pragma('user_version', { simple: true })).toBe(currentDatabaseVersion);
    db.close();
  });

  it('creates the composite index used by position-ordered task scans', () => {
    directory = mkdtempSync(join(tmpdir(), 'the-monastery-index-'));
    const db = new Database(join(directory, 'indexes.sqlite'));
    runDatabaseMigrations(db);

    const indexes = db.pragma('index_list(tasks)') as { name: string }[];
    expect(indexes.map((index) => index.name)).toContain('idx_tasks_profile_position');
    db.close();
  });
});
