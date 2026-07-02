// \@vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { sendWebhookAlert } from './webhooks.js';

describe('webhook alerts', () => {
  it('sends provider-specific payloads only to configured providers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const result = await sendWebhookAlert(
      {
        discordWebhookUrl: 'https://discord.example/hook',
        slackWebhookUrl: 'https://slack.example/hook',
        telegramBotToken: 'secret-token',
        telegramChatId: '1234'
      },
      { title: 'Task overdue', body: 'Review architecture' },
      fetchImpl
    );
    expect(result).toEqual({ sent: ['discord', 'slack', 'telegram'], failed: [] });
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://discord.example/hook',
      expect.objectContaining({ body: JSON.stringify({ content: '**Task overdue**\nReview architecture' }) })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://slack.example/hook',
      expect.objectContaining({ body: JSON.stringify({ text: '*Task overdue*\nReview architecture' }) })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      'https://api.telegram.org/botsecret-token/sendMessage',
      expect.objectContaining({
        body: JSON.stringify({ chat_id: '1234', text: 'Task overdue\nReview architecture' })
      })
    );
  });

  it('reports provider failures without leaking response bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('secret upstream response', { status: 500 }));
    expect(
      await sendWebhookAlert(
        { discordWebhookUrl: 'https://discord.example/hook' },
        { title: 'Test', body: 'Message' },
        fetchImpl
      )
    ).toEqual({ sent: [], failed: ['discord'] });
  });
});
