import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ProfileRow, SettingsRow, Task } from './types.js';
import { runDatabaseMigrations } from './migrations.js';

const nowIso = () => new Date().toISOString();
const createId = () => Math.random().toString(36).slice(2, 11);

export const serializeProfile = (row: ProfileRow) => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  taskCount: row.task_count
});

export const createDataStore = (dbPath: string) => {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runDatabaseMigrations(db);

  const listProfilesStmt = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.created_at,
      p.updated_at,
      COUNT(t.task_id) AS task_count
    FROM profiles p
    LEFT JOIN tasks t ON t.profile_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `);
  const getProfileStmt = db.prepare(
    'SELECT id, name, created_at, updated_at, revision FROM profiles WHERE id = ?'
  );
  const getTasksRevisionStmt = db.prepare('SELECT tasks_revision FROM profiles WHERE id = ?');
  const getSettingsRevisionStmt = db.prepare('SELECT settings_revision FROM profiles WHERE id = ?');
  const createProfileStmt = db.prepare(
    'INSERT INTO profiles (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
  );
  const touchTasksRevisionStmt = db.prepare(
    'UPDATE profiles SET updated_at = ?, tasks_revision = tasks_revision + 1 WHERE id = ?'
  );
  const touchSettingsRevisionStmt = db.prepare(
    'UPDATE profiles SET updated_at = ?, settings_revision = settings_revision + 1 WHERE id = ?'
  );
  const deleteProfileStmt = db.prepare('DELETE FROM profiles WHERE id = ?');
  const resetProfileTasksStmt = db.prepare('DELETE FROM tasks WHERE profile_id = ?');
  const resetProfileSettingsStmt = db.prepare('DELETE FROM profile_settings WHERE profile_id = ?');
  const listTasksStmt = db.prepare(
    'SELECT task_id, task_json, position FROM tasks WHERE profile_id = ? ORDER BY position ASC'
  );
  const deleteTaskStmt = db.prepare('DELETE FROM tasks WHERE profile_id = ? AND task_id = ?');
  const getTaskPositionStmt = db.prepare('SELECT position FROM tasks WHERE profile_id = ? AND task_id = ?');
  const upsertTaskStmt = db.prepare(`
    INSERT INTO tasks (profile_id, task_id, task_json, position, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(profile_id, task_id) DO UPDATE SET
      task_json = excluded.task_json,
      position = excluded.position,
      updated_at = excluded.updated_at
  `);
  const getSettingsStmt = db.prepare('SELECT settings_json FROM profile_settings WHERE profile_id = ?');
  const upsertSettingsStmt = db.prepare(`
    INSERT INTO profile_settings (profile_id, settings_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(profile_id) DO UPDATE SET
      settings_json = excluded.settings_json,
      updated_at = excluded.updated_at
  `);
  const deleteTasksForProfileStmt = db.prepare('DELETE FROM tasks WHERE profile_id = ?');
  const insertTaskStmt = db.prepare(`
    INSERT INTO tasks (profile_id, task_id, task_json, position, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const ensureDefaultProfile = () => {
    const count = db.prepare('SELECT COUNT(*) AS count FROM profiles').get() as { count: number };
    if (count.count > 0) return;
    const timestamp = nowIso();
    createProfileStmt.run('default', 'Default', timestamp, timestamp);
  };

  const replaceTasks = db.transaction((profileId: string, tasks: Task[]) => {
    const timestamp = nowIso();
    deleteTasksForProfileStmt.run(profileId);

    tasks.forEach((task, index) => {
      const taskId = typeof task.id === 'string' ? task.id : createId();
      insertTaskStmt.run(profileId, taskId, JSON.stringify({ ...task, id: taskId }), index, timestamp);
    });

    touchTasksRevisionStmt.run(timestamp, profileId);
  });

  /**
   * Persist a single task. Uses a fast path that UPSERTs only the touched row
   * when the task already exists and its position is unchanged (the common
   * case — e.g. editing a title). Falls back to a full `replaceTasks` rewrite
   * only when the task is new or is being moved, so a single-field edit no
   * longer rewrites every task row in the profile.
   */
  const saveTask = db.transaction((profileId: string, task: Task, position?: number) => {
    const taskId = typeof task.id === 'string' ? task.id : createId();
    const existing = getTaskPositionStmt.get(profileId, taskId) as { position: number } | undefined;
    const serialized = JSON.stringify({ ...task, id: taskId });

    if (existing && (position === undefined || position === existing.position)) {
      const timestamp = nowIso();
      upsertTaskStmt.run(profileId, taskId, serialized, existing.position, timestamp);
      touchTasksRevisionStmt.run(timestamp, profileId);
      return;
    }

    const tasks = (listTasksStmt.all(profileId) as { task_json: string; task_id: string }[]).map(
      (row) => JSON.parse(row.task_json) as Task
    );
    const existingIndex = tasks.findIndex((item) => item.id === task.id);
    const nextTasks = tasks.filter((item) => item.id !== task.id);
    const insertAt = Math.max(
      0,
      Math.min(
        nextTasks.length,
        typeof position === 'number' ? position : existingIndex >= 0 ? existingIndex : nextTasks.length
      )
    );
    nextTasks.splice(insertAt, 0, task);
    replaceTasks(profileId, nextTasks);
  });

  const deleteTask = db.transaction((profileId: string, taskId: string) => {
    const timestamp = nowIso();
    deleteTaskStmt.run(profileId, taskId);
    touchTasksRevisionStmt.run(timestamp, profileId);
  });

  const resetProfileData = db.transaction((profileId: string) => {
    const timestamp = nowIso();
    resetProfileTasksStmt.run(profileId);
    resetProfileSettingsStmt.run(profileId);
    touchTasksRevisionStmt.run(timestamp, profileId);
    touchSettingsRevisionStmt.run(timestamp, profileId);
  });

  ensureDefaultProfile();

  return {
    close: () => db.close(),
    health: () => {
      db.prepare('SELECT 1').get();
      return {
        ok: true,
        profileCount: (db.prepare('SELECT COUNT(*) AS count FROM profiles').get() as { count: number }).count
      };
    },
    getProfile: (id: string) => getProfileStmt.get(id),
    getTasksRevision: (id: string) =>
      (getTasksRevisionStmt.get(id) as { tasks_revision: number } | undefined)?.tasks_revision ?? 0,
    getSettingsRevision: (id: string) =>
      (getSettingsRevisionStmt.get(id) as { settings_revision: number } | undefined)?.settings_revision ?? 0,
    countProfiles: () =>
      (db.prepare('SELECT COUNT(*) AS count FROM profiles').get() as { count: number }).count,
    listProfiles: () => (listProfilesStmt.all() as ProfileRow[]).map(serializeProfile),
    createProfile: (name: string) => {
      const timestamp = nowIso();
      const id = createId();
      createProfileStmt.run(id, name, timestamp, timestamp);
      return { id, name, createdAt: timestamp, updatedAt: timestamp, taskCount: 0 };
    },
    deleteProfile: (id: string) => {
      deleteProfileStmt.run(id);
    },
    resetProfile: (id: string) => {
      resetProfileData(id);
    },
    listTasks: (profileId: string) => {
      const rows = listTasksStmt.all(profileId) as { task_json: string }[];
      return rows.map((row) => JSON.parse(row.task_json) as Task);
    },
    replaceTasks,
    saveTask,
    deleteTask,
    getSettings: (profileId: string) => {
      const row = getSettingsStmt.get(profileId) as SettingsRow | undefined;
      return row ? JSON.parse(row.settings_json) : null;
    },
    saveSettings: (profileId: string, settings: unknown) => {
      const timestamp = nowIso();
      upsertSettingsStmt.run(profileId, JSON.stringify(settings), timestamp);
      touchSettingsRevisionStmt.run(timestamp, profileId);
    },
    backup: () => {
      const profiles = (listProfilesStmt.all() as ProfileRow[]).map((row) => {
        const profile = serializeProfile(row);
        return {
          ...profile,
          settings: (() => {
            const settingsRow = getSettingsStmt.get(profile.id) as SettingsRow | undefined;
            return settingsRow ? JSON.parse(settingsRow.settings_json) : null;
          })(),
          tasks: (listTasksStmt.all(profile.id) as { task_json: string }[]).map(
            (taskRow) => JSON.parse(taskRow.task_json) as Task
          )
        };
      });

      return {
        schemaVersion: 2,
        exportedAt: nowIso(),
        profiles
      };
    }
  };
};

export type DataStore = ReturnType<typeof createDataStore>;
