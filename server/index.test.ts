// @vitest-environment node

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { formatBuildVersion } from '../shared/buildInfo.js';
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
  mainViewModules: [
    { id: 'focus', area: 'center', visible: true },
    { id: 'activity', area: 'center', visible: true },
    { id: 'calendar', area: 'right', visible: true },
    { id: 'media', area: 'right', visible: true },
    { id: 'clock', area: 'right', visible: true }
  ],
  focusMediaUrl: 'https://youtu.be/4e839orj52w',
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
  tagInventory: [],
  tagAliases: {},
  projects: [],
  mobileFocusMode: false,
  collapsedBoardLanes: [],
  collapseTasks: false,
  autoPromoteNextTask: false,
  resizeHandleVisible: true,
  resizeHandleThickness: 4,
  resizeHandleLength: 48,
  resizeHandleColor: '#94a3b8',
  timelineHourLinesVisible: true,
  timelineNowLineVisible: true,
  notificationsEnabled: false,
  webhookAlertsEnabled: false,
  webhookProviderSettings: {
    discord: { enabled: true, template: '**{title}**\n{body}' },
    slack: { enabled: true, template: '*{title}*\n{body}' },
    telegram: { enabled: true, template: '{title}\n{body}' }
  },
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
    version: formatBuildVersion(
      '1.0.0',
      process.env.THE_MONASTERY_BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER
    ),
    buildRef: expect.any(String),
    uptimeSeconds: expect.any(Number)
  });
  expect(response.json()).not.toHaveProperty('storage');
});

it('reports authRequired on health when an owner token is configured', async () => {
  const app = makeApp({ ownerToken: 'secret-token' });

  const open = await app.inject({ method: 'GET', url: '/api/health' });
  const blocked = await app.inject({ method: 'GET', url: '/api/profiles' });
  const authorized = await app.inject({
    method: 'GET',
    url: '/api/profiles',
    headers: { authorization: 'Bearer secret-token' }
  });
  const wrongToken = await app.inject({
    method: 'GET',
    url: '/api/profiles',
    headers: { authorization: 'Bearer nope' }
  });
  await app.close();

  expect(open.statusCode).toBe(200);
  expect(open.json().authRequired).toBe(true);
  expect(blocked.statusCode).toBe(401);
  expect(blocked.json()).toMatchObject({ error: 'Owner token required.', authRequired: true });
  expect(authorized.statusCode).toBe(200);
  expect(wrongToken.statusCode).toBe(401);
});

it('also accepts the owner token via the X-Owner-Token header', async () => {
  const app = makeApp({ ownerToken: 'header-token' });

  const response = await app.inject({
    method: 'GET',
    url: '/api/profiles',
    headers: { 'x-owner-token': 'header-token' }
  });
  await app.close();

  expect(response.statusCode).toBe(200);
});

it('does not require a token when no owner token is configured', async () => {
  const app = makeApp();

  const response = await app.inject({ method: 'GET', url: '/api/profiles' });
  await app.close();

  expect(response.statusCode).toBe(200);
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

it('searches persisted tasks, notes, subtasks, roles, and projects', async () => {
  const app = makeApp();
  const task = makeTask({
    id: 'search-task',
    title: 'Migrate the payments API',
    tags: ['backend'],
    subtasks: [
      {
        id: 'sub-1',
        title: 'Validate rollback procedure',
        status: 'backlog',
        tags: ['reliability'],
        logs: [],
        activeLogStart: null
      }
    ],
    activity: [
      {
        id: 'note-1',
        type: 'note',
        text: 'Course notes about idempotency',
        timestamp: new Date().toISOString()
      }
    ]
  });
  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/tasks',
    payload: { tasks: [task] }
  });
  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/settings',
    payload: {
      settings: fullSettings({
        roles: [
          {
            id: 'architect',
            name: 'Cloud Architect',
            tags: ['migration', 'networking'],
            dailyTargetHours: 0,
            weeklyTargetHours: 0,
            monthlyTargetHours: 0
          }
        ],
        projects: [
          {
            id: 'platform',
            name: 'Platform Reliability',
            description: 'Improve failover readiness',
            status: 'active',
            tags: ['sre'],
            taskIds: ['search-task'],
            milestones: [{ id: 'm1', title: 'Run disaster recovery drill', completed: false }]
          }
        ]
      })
    }
  });

  const noteResults = await app.inject({
    method: 'GET',
    url: '/api/profiles/default/search?q=idempotency'
  });
  const roleResults = await app.inject({
    method: 'GET',
    url: '/api/profiles/default/search?q=cloud%20architect'
  });
  const projectResults = await app.inject({
    method: 'GET',
    url: '/api/profiles/default/search?q=disaster%20recovery'
  });
  await app.inject({ method: 'DELETE', url: '/api/profiles/default/tasks/search-task' });
  const deletedResults = await app.inject({
    method: 'GET',
    url: '/api/profiles/default/search?q=idempotency'
  });
  await app.close();

  expect(noteResults.statusCode).toBe(200);
  expect(noteResults.json().results).toEqual([
    expect.objectContaining({
      entityType: 'task',
      entityId: 'search-task',
      title: 'Migrate the payments API'
    })
  ]);
  expect(roleResults.json().results).toEqual([
    expect.objectContaining({ entityType: 'role', entityId: 'architect', title: 'Cloud Architect' })
  ]);
  expect(projectResults.json().results).toEqual([
    expect.objectContaining({ entityType: 'project', entityId: 'platform', title: 'Platform Reliability' })
  ]);
  expect(deletedResults.json().results).toEqual([]);
});

it('shifts only the moved task and its siblings on reorder (no full rewrite)', async () => {
  const app = makeApp();
  const tasks = [0, 1, 2, 3].map((index) => makeTask({ id: `t${index}`, title: `Task ${index}` }));
  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/tasks',
    payload: { tasks }
  });

  // Move t0 from position 0 to position 2: t1,t2 shift down by 1, t0 lands at 2.
  const moved = await app.inject({
    method: 'PATCH',
    url: '/api/profiles/default/tasks/t0',
    payload: { task: { ...tasks[0], title: 'Task 0 moved' }, position: 2 }
  });
  const listed = await app.inject({ method: 'GET', url: '/api/profiles/default/tasks' });
  await app.close();

  expect(moved.statusCode).toBe(200);
  const ordered = listed.json().tasks.map((task) => task.id);
  expect(ordered).toEqual(['t1', 't2', 't0', 't3']);
  // Untouched siblings keep their original JSON (title unchanged).
  const t1 = listed.json().tasks.find((task) => task.id === 't1');
  expect(t1.title).toBe('Task 1');
});

it('rejects an oversized request body with 413', async () => {
  const app = makeApp({ bodyLimit: 256 });
  const hugeTitle = 'x'.repeat(2048);
  const response = await app.inject({
    method: 'POST',
    url: '/api/profiles/default/tasks',
    payload: { task: makeTask({ title: hugeTitle }) }
  });
  await app.close();

  expect(response.statusCode).toBe(413);
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
        ],
        mainViewModules: [
          { id: 'focus', area: 'center', visible: true },
          { id: 'activity', area: 'right', visible: true },
          { id: 'calendar', area: 'right', visible: true },
          { id: 'media', area: 'right', visible: false },
          { id: 'clock', area: 'right', visible: true }
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
          activity: [
            {
              id: 'completed-task1',
              type: 'system',
              text: 'Marked done',
              timestamp: '2026-07-17T10:00:00.000Z',
              kind: 'task-completed',
              subjectId: 'task1'
            }
          ]
        }
      ]
    }
  });

  const settings = await app.inject({ method: 'GET', url: '/api/profiles/default/settings' });
  const backup = await app.inject({ method: 'GET', url: '/api/backup' });
  await app.close();

  expect(settings.statusCode).toBe(200);
  expect(settings.json().settings.theme).toBe('dark');
  expect(settings.json().settings.mainViewModules).toContainEqual({
    id: 'activity',
    area: 'right',
    visible: true
  });
  expect(backup.statusCode).toBe(200);
  expect(backup.json()).toMatchObject({
    schemaVersion: 2,
    profiles: [
      {
        id: 'default',
        settings: { theme: 'dark' },
        tasks: [
          {
            id: 'task1',
            title: 'Backed up task',
            activity: [{ kind: 'task-completed', subjectId: 'task1' }]
          }
        ]
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

it('reports configured integrations without exposing secrets', async () => {
  const app = makeApp({
    integrations: {
      discordWebhookUrl: 'https://discord.example/secret',
      icsSubscriptionUrls: ['https://calendar.example/feed.ics'],
      calDavUrl: 'https://calendar.example/caldav',
      calDavUsername: 'idan',
      calDavPassword: 'secret'
    }
  });
  const response = await app.inject({ method: 'GET', url: '/api/integrations/status' });
  await app.close();
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({
    webhooks: { discord: true, slack: false, telegram: false },
    calendar: { subscriptions: 1, calDav: true }
  });
  expect(response.body).not.toContain('secret');
});

it('sends test alerts and synchronizes configured calendars', async () => {
  const ics = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:sync-1\nSUMMARY:Synced task\nDTSTART:20260702T090000Z\nDTEND:20260702T100000Z\nEND:VEVENT\nEND:VCALENDAR`;
  const fetchImpl = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(ics, { status: 200 }))
    .mockResolvedValueOnce(new Response(`<d:multistatus xmlns:d="DAV:"/>`, { status: 207 }))
    .mockResolvedValueOnce(new Response(null, { status: 201 }));
  const app = makeApp({
    integrations: {
      discordWebhookUrl: 'https://discord.example/hook',
      icsSubscriptionUrls: ['https://calendar.example/feed.ics'],
      calDavUrl: 'https://calendar.example/caldav'
    },
    integrationFetch: fetchImpl
  });
  const alert = await app.inject({ method: 'POST', url: '/api/integrations/alerts/test' });
  const pull = await app.inject({ method: 'POST', url: '/api/integrations/calendar/pull' });
  const push = await app.inject({
    method: 'POST',
    url: '/api/integrations/calendar/push',
    payload: {
      tasks: [
        {
          id: 'task-1',
          title: 'Review',
          scheduledDate: '2026-07-02',
          scheduledStart: '09:00',
          scheduledEnd: '10:00'
        }
      ]
    }
  });
  await app.close();
  expect(alert.json()).toEqual({ sent: ['discord'], failed: [] });
  expect(pull.json().tasks[0]).toMatchObject({ id: 'sync-1', title: 'Synced task' });
  expect(push.json()).toEqual({ pushed: 1, failed: [] });
});

it('applies provider choices and templates to test alerts', async () => {
  const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const app = makeApp({
    integrations: {
      discordWebhookUrl: 'https://discord.example/hook',
      slackWebhookUrl: 'https://slack.example/hook'
    },
    integrationFetch: fetchImpl
  });
  const response = await app.inject({
    method: 'POST',
    url: '/api/integrations/alerts/test',
    payload: { providers: ['slack'], templates: { slack: '{title}: {body}' } }
  });
  await app.close();
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ sent: ['slack'], failed: [] });
  expect(fetchImpl).toHaveBeenCalledOnce();
  expect(fetchImpl).toHaveBeenCalledWith(
    'https://slack.example/hook',
    expect.objectContaining({ body: JSON.stringify({ text: 'The Monastery: Webhook alerts are working.' }) })
  );
});

it('delivers persisted task alerts without a connected browser', async () => {
  const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const app = makeApp({
    integrations: { slackWebhookUrl: 'https://slack.example/hook' },
    integrationFetch: fetchImpl,
    alertScheduler: { intervalMs: 10 }
  });
  const now = new Date();
  const scheduled = new Date(now.getTime() - 60_000);
  const scheduledDate = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, '0')}-${String(scheduled.getDate()).padStart(2, '0')}`;
  const scheduledStart = `${String(scheduled.getHours()).padStart(2, '0')}:${String(scheduled.getMinutes()).padStart(2, '0')}`;
  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/settings',
    payload: {
      settings: fullSettings({
        webhookAlertsEnabled: true,
        webhookProviderSettings: {
          discord: { enabled: false, template: 'D {title} {body}' },
          slack: { enabled: true, template: 'SERVER {title}: {body}' },
          telegram: { enabled: false, template: 'T {title} {body}' }
        }
      })
    }
  });
  await app.inject({
    method: 'PUT',
    url: '/api/profiles/default/tasks',
    payload: {
      tasks: [
        makeTask({ id: 'scheduled-server-task', title: 'Architecture review', scheduledDate, scheduledStart })
      ]
    }
  });

  await vi.waitFor(
    () =>
      expect(fetchImpl).toHaveBeenCalledWith(
        'https://slack.example/hook',
        expect.objectContaining({
          body: JSON.stringify({ text: 'SERVER Task starting now: Architecture review' })
        })
      ),
    { timeout: 1000 }
  );
  await new Promise((resolve) => setTimeout(resolve, 40));
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  await app.close();
});
