export type WebhookProvider = 'discord' | 'slack' | 'telegram';

export type WebhookConfig = {
  discordWebhookUrl?: string;
  slackWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
};

export type WebhookAlert = {
  title: string;
  body: string;
  providers?: WebhookProvider[];
  templates?: Partial<Record<WebhookProvider, string>>;
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const postJson = async (fetchImpl: FetchLike, url: string, body: unknown) => {
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const sendWebhookAlert = async (
  config: WebhookConfig,
  alert: WebhookAlert,
  fetchImpl: FetchLike = fetch
) => {
  const title = alert.title.trim().slice(0, 200);
  const body = alert.body.trim().slice(0, 3500);
  const enabledProviders = new Set(alert.providers ?? ['discord', 'slack', 'telegram']);
  const render = (provider: WebhookProvider, fallback: string) =>
    (alert.templates?.[provider] || fallback).replaceAll('{title}', title).replaceAll('{body}', body);
  const deliveries: Array<{ provider: WebhookProvider; send: () => Promise<boolean> }> = [];

  if (config.discordWebhookUrl && enabledProviders.has('discord')) {
    deliveries.push({
      provider: 'discord',
      send: () =>
        postJson(fetchImpl, config.discordWebhookUrl!, {
          content: render('discord', ['**{title}**', '{body}'].join(String.fromCharCode(10)))
        })
    });
  }
  if (config.slackWebhookUrl && enabledProviders.has('slack')) {
    deliveries.push({
      provider: 'slack',
      send: () =>
        postJson(fetchImpl, config.slackWebhookUrl!, {
          text: render('slack', ['*{title}*', '{body}'].join(String.fromCharCode(10)))
        })
    });
  }
  if (config.telegramBotToken && config.telegramChatId && enabledProviders.has('telegram')) {
    deliveries.push({
      provider: 'telegram',
      send: () =>
        postJson(fetchImpl, `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          chat_id: config.telegramChatId,
          text: render('telegram', ['{title}', '{body}'].join(String.fromCharCode(10)))
        })
    });
  }

  const sent: WebhookProvider[] = [];
  const failed: WebhookProvider[] = [];
  for (const delivery of deliveries) {
    ((await delivery.send()) ? sent : failed).push(delivery.provider);
  }
  return { sent, failed };
};

export const webhookStatus = (config: WebhookConfig) => ({
  discord: Boolean(config.discordWebhookUrl),
  slack: Boolean(config.slackWebhookUrl),
  telegram: Boolean(config.telegramBotToken && config.telegramChatId)
});
