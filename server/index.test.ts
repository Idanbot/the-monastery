// @vitest-environment node

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createApp } from './index.js';

let testDir = '';

const makeApp = () => {
  testDir = mkdtempSync(join(tmpdir(), 'the-monastery-api-'));
  writeFileSync(join(testDir, 'index.html'), '<!doctype html><html><body>TheMonastery</body></html>');

  return createApp({
    dbPath: join(testDir, 'the-monastery.sqlite'),
    publicDir: testDir,
    logger: false
  });
};

beforeEach(() => {
  testDir = '';
});

afterEach(() => {
  if (testDir) rmSync(testDir, { recursive: true, force: true });
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
      tasks: [
        {
          id: 'task1',
          title: 'Synced task',
          status: 'new',
          urgency: 5,
          tags: [],
          scheduledDate: '',
          scheduledStart: '',
          scheduledEnd: '',
          subtasks: [],
          logs: [],
          activeLogStart: null,
          activity: []
        }
      ]
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
      settings: {
        theme: 'dark',
        roles: [{ id: 'role1', name: 'Backend', tags: ['api'], weeklyTargetHours: 4 }]
      }
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
          status: 'new',
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
    schemaVersion: 1,
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
