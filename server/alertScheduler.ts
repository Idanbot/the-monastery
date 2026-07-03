import type { DataStore } from './db.js';
import type { IntegrationConfig } from './integrationRoutes.js';
import { sendWebhookAlert, type WebhookProvider } from './webhooks.js';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type SchedulerOptions = { intervalMs?: number; now?: () => number };
type PersistedTask = {
  id?: unknown;
  title?: unknown;
  status?: unknown;
  scheduledDate?: unknown;
  scheduledStart?: unknown;
  scheduledEnd?: unknown;
  activeLogStart?: unknown;
};
type ProviderSettings = Record<WebhookProvider, { enabled: boolean; template: string }>;

const providers: WebhookProvider[] = ['discord', 'slack', 'telegram'];
const localDateTime = (date: unknown, time: unknown) => {
  if (typeof date !== 'string' || typeof time !== 'string' || !date || !time) return null;
  const value = new Date(`${date}T${time}:00`).getTime();
  return Number.isFinite(value) ? value : null;
};

const taskAlertCandidates = (task: PersistedTask, now: number) => {
  if (task.status === 'done' || task.status === 'rejected') return [];
  const id = typeof task.id === 'string' ? task.id : 'unknown';
  const body = typeof task.title === 'string' && task.title ? task.title : 'Untitled task';
  const candidates: Array<{ key: string; title: string; body: string; dueAt: number }> = [];
  const start = localDateTime(task.scheduledDate, task.scheduledStart);
  if (start !== null && now >= start && now - start < 24 * 60 * 60_000)
    candidates.push({
      key: `start:${id}:${String(task.scheduledDate)}:${String(task.scheduledStart)}`,
      title: 'Task starting now',
      body,
      dueAt: start
    });
  const end = localDateTime(task.scheduledDate, task.scheduledEnd);
  if (end !== null && now >= end && now - end < 24 * 60 * 60_000)
    candidates.push({
      key: `overdue:${id}:${String(task.scheduledDate)}:${String(task.scheduledEnd)}`,
      title: 'Task overdue',
      body,
      dueAt: end
    });
  if (typeof task.activeLogStart === 'string') {
    const timerDue = new Date(task.activeLogStart).getTime() + 60 * 60_000;
    if (Number.isFinite(timerDue) && now >= timerDue && now - timerDue < 24 * 60 * 60_000)
      candidates.push({
        key: `timer:${id}:${task.activeLogStart}:60`,
        title: 'Timer running for one hour',
        body,
        dueAt: timerDue
      });
  }
  return candidates;
};

const readDeliverySettings = (settings: unknown) => {
  if (!settings || typeof settings !== 'object') return null;
  const source = settings as { webhookAlertsEnabled?: unknown; webhookProviderSettings?: unknown };
  if (
    source.webhookAlertsEnabled !== true ||
    !source.webhookProviderSettings ||
    typeof source.webhookProviderSettings !== 'object'
  )
    return null;
  return source.webhookProviderSettings as ProviderSettings;
};

export const createAlertScheduler = (
  store: DataStore,
  config: IntegrationConfig,
  fetchImpl: FetchLike = fetch,
  options: SchedulerOptions = {}
) => {
  const intervalMs = Math.max(10, options.intervalMs ?? 30_000);
  const now = options.now ?? Date.now;
  let timer: NodeJS.Timeout | null = null;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const timestamp = now();
      for (const profile of store.listProfiles()) {
        const preferences = readDeliverySettings(store.getSettings(profile.id));
        if (!preferences) continue;
        for (const task of store.listTasks(profile.id) as PersistedTask[]) {
          for (const candidate of taskAlertCandidates(task, timestamp)) {
            for (const provider of providers.filter((name) => preferences[name]?.enabled)) {
              store.enqueueAlert(
                profile.id,
                `${candidate.key}|${provider}`,
                candidate.title,
                candidate.body,
                candidate.dueAt
              );
            }
          }
        }
      }

      for (const alert of store.listDueAlerts(timestamp)) {
        const provider = alert.event_key.slice(alert.event_key.lastIndexOf('|') + 1) as WebhookProvider;
        const preferences = readDeliverySettings(store.getSettings(alert.profile_id));
        if (!providers.includes(provider) || !preferences?.[provider]?.enabled) {
          store.markAlertSent(alert.id);
          continue;
        }
        const result = await sendWebhookAlert(
          config,
          {
            title: alert.title,
            body: alert.body,
            providers: [provider],
            templates: { [provider]: preferences[provider].template }
          },
          fetchImpl
        );
        if (result.sent.includes(provider)) store.markAlertSent(alert.id);
        else store.markAlertFailed(alert.id, timestamp + Math.min(60 * 60_000, 30_000 * 2 ** alert.attempts));
      }
    } finally {
      running = false;
    }
  };

  return {
    tick,
    start: () => {
      if (!timer) {
        void tick();
        timer = setInterval(() => void tick(), intervalMs);
        timer.unref();
      }
    },
    stop: () => {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };
};
