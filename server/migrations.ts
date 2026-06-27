import type Database from 'better-sqlite3';

export const currentDatabaseVersion = 3;

const migrationOne = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL,
      task_json TEXT NOT NULL,
      position INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (profile_id, task_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_profile_position
      ON tasks(profile_id, position);

    CREATE TABLE IF NOT EXISTS profile_settings (
      profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      settings_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
};

const migrationTwo = (db: Database.Database) => {
  const columns = db.pragma('table_info(profiles)') as { name: string }[];
  if (!columns.some((column) => column.name === 'revision')) {
    db.exec('ALTER TABLE profiles ADD COLUMN revision INTEGER NOT NULL DEFAULT 0');
  }
};

/**
 * Split the single `revision` counter into independent `tasks_revision` and
 * `settings_revision` counters. Previously a settings save invalidated a
 * concurrent task save's base revision (and vice versa) because both resources
 * shared one counter. The original `revision` column is preserved for
 * backward compatibility / total ordering.
 */
const migrationThree = (db: Database.Database) => {
  const columns = db.pragma('table_info(profiles)') as { name: string }[];
  if (!columns.some((column) => column.name === 'tasks_revision')) {
    db.exec('ALTER TABLE profiles ADD COLUMN tasks_revision INTEGER NOT NULL DEFAULT 0');
  }
  if (!columns.some((column) => column.name === 'settings_revision')) {
    db.exec('ALTER TABLE profiles ADD COLUMN settings_revision INTEGER NOT NULL DEFAULT 0');
  }
};

export const runDatabaseMigrations = (db: Database.Database) => {
  const version = db.pragma('user_version', { simple: true }) as number;
  const migrations = [migrationOne, migrationTwo, migrationThree];

  db.transaction(() => {
    for (let index = version; index < migrations.length; index += 1) migrations[index](db);
    db.pragma(`user_version = ${currentDatabaseVersion}`);
  })();
};
