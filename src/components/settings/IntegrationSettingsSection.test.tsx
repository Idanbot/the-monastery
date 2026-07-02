import { render, screen, waitFor } from '@testing-library/react';
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
  await waitFor(() => expect(screen.getByText('Discord')).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Pull calendar events' }));
  expect(setImportPreview).toHaveBeenCalledWith(
    expect.objectContaining({ imported: [task], newTasks: [task] })
  );
});
