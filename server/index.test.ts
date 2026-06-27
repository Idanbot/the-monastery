// @vitest-environment node

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createApp } from './index.js';
import type { ServerOptions } from './types.js';

let testDir = '';

const makeApp = (options: Partial<ServerOptions> = {}) => {
  testDir = mkdtempSync(join(tmpdir(), 'the-monastery-api-'));
  writeFileSync(join(testDir, 'index.html'), '<!doctype html><html><body>TheMonastery</body></html>');

  return createApp({
    dbPath: join(testDir, 'the-monastery.sqlite'),
    publicDir: testDir,
    logger: false,
    ...options
  });
};

const makeTask = (overrides = {}) => ({
  id: 'task-' + Math.random().toString(36).slice(2, 8),
  title: 'Server task',
  status: 'backlog',
  urgency: 5,
  tags: [],
  scheduledDate: '',
  scheduledStart: '',
  scheduledEnd: '',
  recurrence: 'none',
  recurrenceRootId: null,
  subtasks: [],
  logs: [],
  activeLogStart: null,
  activity: [],
  ...overrides
});

const fullSettings = (overrides: Record<string, unknown> = {}) => ({
  theme: 'dark',
  visualTheme: 'default',
  colorScheme: { main: '', secondary: '', text: '' },
  fontMain: '',
  fontSecondary: '',
  fontUI: '',
  customThemeName: '',
  monkMode: false,
  dailyGoal: '',
  shutdownChecklist: {},
  sidebarVisible: true,
  animationsEnabled: true,
  clockFormat: '24h',
  showSeconds: true,
  sidebarWidgets: ['clock', 'agenda'],
  sidebarWidth: 320,
  clockHeight: 160,
  clockTextScale: 1,
  clockBackgroundVisible: true,
  clockTextColor: '',
  clockBackgroundColor: '',
  clockDisplayMode: 'digital',
  modalTransparency: 35,
  modalBlur: 1,
  layoutPreset: 'compact',
  textSize: 'medium',
  roles: [],
  tagGoals: [],
  collapseTasks: false,
  autoPromoteNextTask: false,
  resizeHandleVisible: true,
  resizeHandleThickness: 4,
  resizeHandleLength: 48,
  resizeHandleColor: '#94a3b8',
  timelineHourLinesVisible: true,
  timelineNowLineVisible: true,
  columnWidths: { backlog: 1, inProgress: 1, done: 1, rejected: 1 },
  compactColumnWidths: { left: 50, right: 50 },
  compactHeights: { backlog: 1, inProgress: 1, done: 1, rejected: 1 },
  boardColumnOrder: {
    compactActive: ['in-progress', 'backlog'],
    compactDone: ['done', 'rejected'],
    threeColumn: ['in-progress', 'backlog', 'done', 'rejected'],
    full: ['backlog', 'in-progress', 'done', 'rejected']
  },
  ...overrides
});

beforeEach(() => {
  testDir = '';
});

afterEach(() => {
  if (testDir) rmSync(testDir, { recursive: true, force: true });
});

it('reports health with version metadata', async () => {
  const app = makeApp();

  const response = await app.inject({ method: 'GET', url: '/api/health' });
  await app.close();

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    ok: true,
    version: expect.any(String),
    buildRef: expect.any(String),
    uptimeSeconds: expect.any(Number)
  });
  expect(response.json()).not.toHaveProperty('storage');
});

it('rate-limits API routes before health checks can be repeated aggressively', async () => {
  const app = makeApp({ apiRateLimit: { max: 1, timeWindow: '1 minute' } });

  const first = await app.inject({ method: 'GET', url: '/api/health' });
  const second = await app.inject({ method: 'GET', url: '/api/health' });
  await app.close();

  expect(first.statusCode).toBe(200);
  expect(second.statusCode).toBe(429);
  expect(second.headers['retry-after']).toBeDefined();
  expect(second.json()).toEqual({ error: 'Too many requests.' });
});

it('creates a default profile', async () => {
  const app = makeApp();

  const response = await app.inject({ method: 'GET', url: '/api/profiles' });
  await app.close();

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    profiles: [{ id: 'default', name: 'Default', taskCount: 0 }]
  });
});

it('supports task action endpoints for create, update, and delete', async () => {
  const app = makeApp();
  const task = makeTask({ id: 'action-task', title: 'Action task' });

  const created = await app.inject({
    method: 'POST',
    url: '/api/profiles/default/tasks',
    payload: { task, position: 0 }
  });
  const updated = await app.inject({
    method: 'PATCH',
    url: '/api/profiles/default/tasks/action-task',
    payload: { task: { ...task, title: 'Updated action task' }, position: 0 }
  });
  const listed = await app.inject({ method: 'GET', url: '/api/profiles/default/tasks' });
  const deleted = await app.inject({ method: 'DELETE', url: '/api/profiles/default/tasks/action-task' });
  const afterDelete = await app.inject({ method: 'GET', url: '/api/profiles/default/tasks' });
  await app.close();

  expect(created.statusCode).toBe(201);
  expect(updated.statusCode).toBe(200);
  expect(listed.json().tasks).toMatchObject([{ id: 'action-task', title: 'Updated action task' }]);
  expect(deleted.statusCode).toBe(200);
  expect(afterDelete.json().tasks).toHaveLength(0);
});

it('rejects stale task writes against the tasks revision and returns the latest revision', async () => {
  const app = makeApp();
  const initial = await app.inject({ method: 'GET', url: '/api/profiles/default/tasks' });
  const revision = initial.json().revision;

  const saved = await app.inject({
    method: 'POST',
    url: '/api/profiles/default/tasks',
    payload: { task: makeTask({ id: 'revision-task' }), position: 0, baseRevision: revision }
  });
  const stale = await app.inject({
    method: 'POST',
    url: '/api/profiles/default/tasks',
    payload: { task: makeTask({ id: 'stale-task' }), position: 0, baseRevision: revision }
  });
  await app.close();

  expect(saved.statusCode).toBe(201);
  expect(saved.json().revision).toBe(revision + 1);
  expect(stale.statusCode).toBe(409);
  expect(stale.json()).toMatchObject({ error: 'Profile changed elsewhere.', revision: revision + 1 });
});

it('allows a settings save with a stale tasks revision (independent resource revisions)', async () => {
  const app = makeApp();
  const initialTasks = await app.inject({ method: 'GET', url: '/api/profiles/default/tasks' });
  const tasksRevision = initialTasks.json().revision;
  const initialSettings = await app.inject({ method: 'GET', url: '/api/profiles/default/settings' });
  const settingsRevision = initialSettings.json().revision;

  // Bump the tasks revision by saving a task...
  await app.inject({
    method: 'POST',
    url: '/api/profiles/default/tasks',
    payload: { task: makeTask({ id: 'independent-task' }), position: 0, baseRevision: tasksRevision }
  });

  // ...a settings save using the (now stale for tasks) settings revision still succeeds.
  const settingsSave = await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/settings',
    payload: { settings: fullSettings({ theme: 'dark' }), baseRevision: settingsRevision }
  });
  await app.close();

  expect(settingsSave.statusCode).toBe(200);
});

it('rejects malformed task and settings payloads with field-level validation errors', async () => {
  const app = makeApp();

  const invalidTask = await app.inject({
    method: 'POST',
    url: '/api/profiles/default/tasks',
    payload: { task: { id: 'bad', title: 'Missing fields' } }
  });
  const invalidSettings = await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/settings',
    payload: { settings: [] }
  });
  await app.close();

  expect(invalidTask.statusCode).toBe(400);
  expect(invalidTask.json()).toMatchObject({ error: 'Validation failed.' });
  expect(Array.isArray(invalidTask.json().issues)).toBe(true);
  expect(invalidSettings.statusCode).toBe(400);
  expect(invalidSettings.json()).toMatchObject({ error: 'Validation failed.' });
  expect(Array.isArray(invalidSettings.json().issues)).toBe(true);
});

it('stores tasks independently per profile and resets a profile', async () => {
  const app = makeApp();

  const created = await app.inject({
    method: 'POST',
    url: '/api/profiles',
    payload: { name: 'Mobile' }
  });
  const profileId = created.json().profile.id;

  await app.inject({
    method: 'PUT',
    url: `/api/profiles/${profileId}/tasks`,
    payload: {
      tasks: [makeTask({ id: 'task1', title: 'Synced task' })]
    }
  });

  const mobileTasks = await app.inject({ method: 'GET', url: `/api/profiles/${profileId}/tasks` });
  const defaultTasks = await app.inject({ method: 'GET', url: '/api/profiles/default/tasks' });

  await app.inject({ method: 'POST', url: `/api/profiles/${profileId}/reset` });
  const resetTasks = await app.inject({ method: 'GET', url: `/api/profiles/${profileId}/tasks` });
  await app.close();

  expect(mobileTasks.json().tasks).toHaveLength(1);
  expect(mobileTasks.json().tasks[0].title).toBe('Synced task');
  expect(defaultTasks.json().tasks).toHaveLength(0);
  expect(resetTasks.json().tasks).toHaveLength(0);
});

it('stores profile settings and includes tasks/settings in backups', async () => {
  const app = makeApp();

  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/settings',
    payload: {
      settings: fullSettings({
        theme: 'dark',
        roles: [
          {
            id: 'role1',
            name: 'Backend',
            tags: ['api'],
            dailyTargetHours: 0,
            weeklyTargetHours: 4,
            monthlyTargetHours: 0
          }
        ]
      })
    }
  });
  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/tasks',
    payload: {
      tasks: [
        {
          id: 'task1',
          title: 'Backed up task',
          status: 'backlog',
          urgency: 5,
          tags: ['api'],
          scheduledDate: '',
          scheduledStart: '',
          scheduledEnd: '',
          recurrence: 'none',
          recurrenceRootId: null,
          subtasks: [],
          logs: [],
          activeLogStart: null,
          activity: []
        }
      ]
    }
  });

  const settings = await app.inject({ method: 'GET', url: '/api/profiles/default/settings' });
  const backup = await app.inject({ method: 'GET', url: '/api/backup' });
  await app.close();

  expect(settings.statusCode).toBe(200);
  expect(settings.json().settings.theme).toBe('dark');
  expect(backup.statusCode).toBe(200);
  expect(backup.json()).toMatchObject({
    schemaVersion: 2,
    profiles: [
      {
        id: 'default',
        settings: { theme: 'dark' },
        tasks: [{ id: 'task1', title: 'Backed up task' }]
      }
    ]
  });
});

it('removes profiles but protects the last profile', async () => {
  const app = makeApp();

  const cannotRemoveLast = await app.inject({ method: 'DELETE', url: '/api/profiles/default' });
  const created = await app.inject({
    method: 'POST',
    url: '/api/profiles',
    payload: { name: 'Desktop' }
  });
  const profileId = created.json().profile.id;
  const removed = await app.inject({ method: 'DELETE', url: `/api/profiles/${profileId}` });
  const profiles = await app.inject({ method: 'GET', url: '/api/profiles' });
  await app.close();

  expect(cannotRemoveLast.statusCode).toBe(400);
  expect(removed.statusCode).toBe(200);
  expect(profiles.json().profiles).toHaveLength(1);
  expect(profiles.json().profiles[0].id).toBe('default');
});

it('rejects invalid profile and task requests', async () => {
  const app = makeApp();

  const emptyProfile = await app.inject({
    method: 'POST',
    url: '/api/profiles',
    payload: { name: '   ' }
  });
  const missingProfileTasks = await app.inject({ method: 'GET', url: '/api/profiles/missing/tasks' });
  const invalidTasksPayload = await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/tasks',
    payload: { tasks: 'not-an-array' }
  });
  await app.close();

  expect(emptyProfile.statusCode).toBe(400);
  expect(missingProfileTasks.statusCode).toBe(404);
  expect(invalidTasksPayload.statusCode).toBe(400);
});

it('serves the SPA fallback for non-api routes and JSON 404 for api routes', async () => {
  const app = makeApp();

  const spaRoute = await app.inject({ method: 'GET', url: '/dashboard' });
  const apiRoute = await app.inject({ method: 'GET', url: '/api/missing' });
  await app.close();

  expect(spaRoute.statusCode).toBe(200);
  expect(spaRoute.body).toContain('TheMonastery');
  expect(apiRoute.statusCode).toBe(404);
  expect(apiRoute.json()).toEqual({ error: 'Not found.' });
});
