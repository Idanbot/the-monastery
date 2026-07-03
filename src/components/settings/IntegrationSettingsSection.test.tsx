import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
import { IntegrationSettingsSection } from './IntegrationSettingsSection';

afterEach(() => vi.unstubAllGlobals());

it('pulls subscribed calendar tasks into the import preview', async () => {
  const task = normalizeTask({ id: 'calendar-1', title: 'Calendar task' });
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          webhooks: { discord: true, slack: false, telegram: false },
          calendar: { subscriptions: 1, calDav: true }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ tasks: [task] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  vi.stubGlobal('fetch', fetchMock);
  const setImportPreview = vi.fn();
  render(
    <IntegrationSettingsSection
      settings={defaultSettings}
      setSettings={vi.fn()}
      tasks={[]}
      setImportPreview={setImportPreview}
      isBackendAvailable
    />
  );
  await waitFor(() => expect(screen.getByLabelText('Enable Discord alerts')).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Pull calendar events' }));
  expect(setImportPreview).toHaveBeenCalledWith(
    expect.objectContaining({ imported: [task], newTasks: [task] })
  );
});

it('updates a provider toggle and template', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          webhooks: { discord: true, slack: true, telegram: false },
          calendar: { subscriptions: 0, calDav: false }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ sent: ['discord', 'slack'], failed: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  vi.stubGlobal('fetch', fetchMock);
  const setSettings = vi.fn();
  render(
    <IntegrationSettingsSection
      settings={defaultSettings}
      setSettings={setSettings}
      tasks={[]}
      setImportPreview={vi.fn()}
      isBackendAvailable
    />
  );
  await waitFor(() => expect(screen.getByLabelText('Enable Discord alerts')).toBeInTheDocument());
  await userEvent.click(screen.getByLabelText('Enable Discord alerts'));
  const toggleUpdate = setSettings.mock.lastCall?.[0];
  expect(toggleUpdate(defaultSettings).webhookProviderSettings.discord.enabled).toBe(false);
  fireEvent.change(screen.getByLabelText('Discord message template'), {
    target: { value: 'Focus: {title} - {body}' }
  });
  const templateUpdate = setSettings.mock.lastCall?.[0];
  expect(templateUpdate(defaultSettings).webhookProviderSettings.discord.template).toBe(
    'Focus: {title} - {body}'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Send test alert' }));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/integrations/alerts/test',
      expect.objectContaining({
        body: JSON.stringify({
          providers: ['discord', 'slack'],
          templates: { discord: '**{title}**\n{body}', slack: '*{title}*\n{body}' }
        })
      })
    )
  );
});
