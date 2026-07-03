import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  calendarStatus,
  pullCalendarTasks,
  pushTasksToCalDav,
  type CalendarIntegrationConfig
} from './calendarIntegrations.js';
import { sendWebhookAlert, webhookStatus, type WebhookConfig } from './webhooks.js';

export type IntegrationConfig = CalendarIntegrationConfig & WebhookConfig;
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const text = (value: string | undefined) => value?.trim() || undefined;
export const readIntegrationConfig = (env: NodeJS.ProcessEnv = process.env): IntegrationConfig => ({
  discordWebhookUrl: text(env.THE_MONASTERY_DISCORD_WEBHOOK_URL),
  slackWebhookUrl: text(env.THE_MONASTERY_SLACK_WEBHOOK_URL),
  telegramBotToken: text(env.THE_MONASTERY_TELEGRAM_BOT_TOKEN),
  telegramChatId: text(env.THE_MONASTERY_TELEGRAM_CHAT_ID),
  icsSubscriptionUrls: (env.THE_MONASTERY_ICS_SUBSCRIPTION_URLS || '')
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean),
  calDavUrl: text(env.THE_MONASTERY_CALDAV_URL),
  calDavUsername: text(env.THE_MONASTERY_CALDAV_USERNAME),
  calDavPassword: text(env.THE_MONASTERY_CALDAV_PASSWORD)
});

const webhookProviderSchema = z.enum(['discord', 'slack', 'telegram']);
const deliveryOptionsSchema = z.object({
  providers: z.array(webhookProviderSchema).max(3).optional(),
  templates: z
    .object({
      discord: z.string().max(4000).optional(),
      slack: z.string().max(4000).optional(),
      telegram: z.string().max(4000).optional()
    })
    .optional()
});
const alertSchema = deliveryOptionsSchema.extend({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(3500)
});
const calendarTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(500),
  scheduledDate: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string()
});
const pushSchema = z.object({ tasks: z.array(calendarTaskSchema).max(500) });

export const registerIntegrationRoutes = (
  app: FastifyInstance,
  config: IntegrationConfig,
  fetchImpl: FetchLike = fetch
) => {
  app.get('/api/integrations/status', async () => ({
    webhooks: webhookStatus(config),
    calendar: calendarStatus(config)
  }));

  app.post('/api/integrations/alerts/test', async (request, reply) => {
    const parsed = deliveryOptionsSchema.safeParse(request.body || {});
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid alert options.' });
    return sendWebhookAlert(
      config,
      { title: 'The Monastery', body: 'Webhook alerts are working.', ...parsed.data },
      fetchImpl
    );
  });
  app.post('/api/integrations/alerts', async (request, reply) => {
    const parsed = alertSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid alert payload.' });
    return sendWebhookAlert(config, parsed.data, fetchImpl);
  });

  app.post('/api/integrations/calendar/pull', async (_request, reply) => {
    try {
      return { tasks: await pullCalendarTasks(config, fetchImpl) };
    } catch (error) {
      return reply
        .code(502)
        .send({ error: error instanceof Error ? error.message : 'Calendar sync failed.' });
    }
  });
  app.post('/api/integrations/calendar/push', async (request, reply) => {
    const parsed = pushSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid calendar task payload.' });
    try {
      return await pushTasksToCalDav(config, parsed.data.tasks, fetchImpl);
    } catch (error) {
      return reply
        .code(400)
        .send({ error: error instanceof Error ? error.message : 'Calendar push failed.' });
    }
  });
};
