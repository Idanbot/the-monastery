import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AlertOutboxRow, ProfileRow, SettingsRow, Task } from './types.js';
import { runDatabaseMigrations } from './migrations.js';
import {
  settingsSearchDocuments,
  taskSearchDocument,
  toFtsQuery,
  type SearchDocument
} from './searchIndex.js';

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
  const countTasksStmt = db.prepare('SELECT COUNT(*) AS count FROM tasks WHERE profile_id = ?');
  const shiftPositionsStmt = db.prepare(`
    UPDATE tasks
    SET position = position + ?
    WHERE profile_id = ? AND position BETWEEN ? AND ? AND task_id != ?
  `);
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
  const enqueueAlertStmt = db.prepare(`
    INSERT OR IGNORE INTO alert_outbox
      (profile_id, event_key, title, body, due_at, next_attempt_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const listDueAlertsStmt = db.prepare(`
    SELECT id, profile_id, event_key, title, body, due_at, attempts
    FROM alert_outbox
    WHERE status = 'pending' AND next_attempt_at <= ?
    ORDER BY next_attempt_at ASC
    LIMIT ?
  `);
  const markAlertSentStmt = db.prepare(`
    UPDATE alert_outbox SET status = 'sent', sent_at = ? WHERE id = ?
  `);
  const markAlertFailedStmt = db.prepare(`
    UPDATE alert_outbox
    SET attempts = attempts + 1, next_attempt_at = ?
    WHERE id = ?
  `);
  const deleteSearchEntityStmt = db.prepare(
    'DELETE FROM profile_search WHERE profile_id = ? AND entity_type = ? AND entity_id = ?'
  );
  const deleteSearchTypeStmt = db.prepare(
    'DELETE FROM profile_search WHERE profile_id = ? AND entity_type = ?'
  );
  const deleteSearchProfileStmt = db.prepare('DELETE FROM profile_search WHERE profile_id = ?');
  const insertSearchDocumentStmt = db.prepare(`
    INSERT INTO profile_search (profile_id, entity_type, entity_id, title, content)
    VALUES (?, ?, ?, ?, ?)
  `);
  const searchProfileStmt = db.prepare(`
    SELECT
      entity_type AS entityType,
      entity_id AS entityId,
      title,
      snippet(profile_search, 4, '', '', ' … ', 14) AS summary
    FROM profile_search
    WHERE profile_search MATCH ? AND profile_id = ?
    ORDER BY bm25(profile_search, 0, 0, 0, 5, 1), entity_type, title
    LIMIT ?
  `);

  const insertSearchDocument = (profileId: string, document: SearchDocument) => {
    insertSearchDocumentStmt.run(
      profileId,
      document.entityType,
      document.entityId,
      document.title,
      document.content
    );
  };

  const indexTask = (profileId: string, task: Task) => {
    const document = taskSearchDocument(task);
    if (!document) return;
    deleteSearchEntityStmt.run(profileId, 'task', document.entityId);
    insertSearchDocument(profileId, document);
  };

  const indexSettings = (profileId: string, settings: unknown) => {
    deleteSearchTypeStmt.run(profileId, 'role');
    deleteSearchTypeStmt.run(profileId, 'project');
    settingsSearchDocuments(settings).forEach((document) => insertSearchDocument(profileId, document));
  };

  const ensureDefaultProfile = () => {
    const count = db.prepare('SELECT COUNT(*) AS count FROM profiles').get() as { count: number };
    if (count.count > 0) return;
    const timestamp = nowIso();
    createProfileStmt.run('default', 'Default', timestamp, timestamp);
  };

  const replaceTasks = db.transaction((profileId: string, tasks: Task[]) => {
    const timestamp = nowIso();
    deleteTasksForProfileStmt.run(profileId);
    deleteSearchTypeStmt.run(profileId, 'task');

    tasks.forEach((task, index) => {
      const taskId = typeof task.id === 'string' ? task.id : createId();
      const storedTask = { ...task, id: taskId };
      insertTaskStmt.run(profileId, taskId, JSON.stringify(storedTask), index, timestamp);
      indexTask(profileId, storedTask);
    });

    touchTasksRevisionStmt.run(timestamp, profileId);
  });

  /**
   * Persist a single task.
   *
   * Three fast paths avoid the O(n) `replaceTasks` rewrite that previously ran
   * on every edit:
   *
   * 1. Existing task whose position is unchanged — a single UPSERT of the
   *    touched row (e.g. editing a title).
   * 2. Existing task moving to a new position — only the moved row is rewritten
   *    and the contiguous slice of siblings between the old and new position is
   *    shifted by ±1, so a reorder no longer rewrites every row.
   * 3. New task appended at the tail (the common `addTask` case) — a single
   *    INSERT at `position = count`, plus a shift when inserted mid-list.
   *
   * Anything else falls back to the full `replaceTasks` rewrite.
   */
  const saveTask = db.transaction((profileId: string, task: Task, position?: number) => {
    const taskId = typeof task.id === 'string' ? task.id : createId();
    const existing = getTaskPositionStmt.get(profileId, taskId) as { position: number } | undefined;
    const serialized = JSON.stringify({ ...task, id: taskId });

    if (existing && (position === undefined || position === existing.position)) {
      const timestamp = nowIso();
      upsertTaskStmt.run(profileId, taskId, serialized, existing.position, timestamp);
      indexTask(profileId, { ...task, id: taskId });
      touchTasksRevisionStmt.run(timestamp, profileId);
      return;
    }

    if (existing && typeof position === 'number' && position !== existing.position) {
      const oldPos = existing.position;
      const newPos = Math.max(0, position);
      const timestamp = nowIso();
      if (oldPos < newPos) {
        shiftPositionsStmt.run(-1, profileId, oldPos + 1, newPos, taskId);
      } else {
        shiftPositionsStmt.run(1, profileId, newPos, oldPos - 1, taskId);
      }
      upsertTaskStmt.run(profileId, taskId, serialized, newPos, timestamp);
      indexTask(profileId, { ...task, id: taskId });
      touchTasksRevisionStmt.run(timestamp, profileId);
      return;
    }

    const count = (countTasksStmt.get(profileId) as { count: number }).count;
    if (!existing && (position === undefined || position >= count)) {
      const timestamp = nowIso();
      insertTaskStmt.run(profileId, taskId, serialized, count, timestamp);
      indexTask(profileId, { ...task, id: taskId });
      touchTasksRevisionStmt.run(timestamp, profileId);
      return;
    }

    if (!existing && typeof position === 'number' && position < count) {
      const timestamp = nowIso();
      shiftPositionsStmt.run(1, profileId, position, count - 1, taskId);
      insertTaskStmt.run(profileId, taskId, serialized, position, timestamp);
      indexTask(profileId, { ...task, id: taskId });
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
    deleteSearchEntityStmt.run(profileId, 'task', taskId);
    touchTasksRevisionStmt.run(timestamp, profileId);
  });

  const resetProfileData = db.transaction((profileId: string) => {
    const timestamp = nowIso();
    resetProfileTasksStmt.run(profileId);
    resetProfileSettingsStmt.run(profileId);
    deleteSearchProfileStmt.run(profileId);
    touchTasksRevisionStmt.run(timestamp, profileId);
    touchSettingsRevisionStmt.run(timestamp, profileId);
  });

  ensureDefaultProfile();

  const rebuildSearchIndex = db.transaction(() => {
    db.prepare('DELETE FROM profile_search').run();
    for (const profile of listProfilesStmt.all() as ProfileRow[]) {
      for (const row of listTasksStmt.all(profile.id) as { task_json: string }[]) {
        indexTask(profile.id, JSON.parse(row.task_json) as Task);
      }
      const settingsRow = getSettingsStmt.get(profile.id) as SettingsRow | undefined;
      if (settingsRow) indexSettings(profile.id, JSON.parse(settingsRow.settings_json));
    }
  });
  rebuildSearchIndex();

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
      deleteSearchProfileStmt.run(id);
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
      indexSettings(profileId, settings);
      touchSettingsRevisionStmt.run(timestamp, profileId);
    },
    searchProfile: (profileId: string, query: string, limit = 20) => {
      const ftsQuery = toFtsQuery(query);
      if (!ftsQuery) return [];
      return searchProfileStmt.all(ftsQuery, profileId, Math.max(1, Math.min(50, limit)));
    },
    enqueueAlert: (profileId: string, eventKey: string, title: string, body: string, dueAt: number) => {
      const timestamp = nowIso();
      enqueueAlertStmt.run(profileId, eventKey, title, body, dueAt, dueAt, timestamp);
    },
    listDueAlerts: (now: number, limit = 100) => listDueAlertsStmt.all(now, limit) as AlertOutboxRow[],
    markAlertSent: (id: number) => markAlertSentStmt.run(nowIso(), id),
    markAlertFailed: (id: number, retryAt: number) => markAlertFailedStmt.run(retryAt, id),
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
