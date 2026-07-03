import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AppSettings, ImportPreview, Task } from '../../domain/types';
import { apiPaths } from '../../../shared/apiContracts';
import { apiRequest } from '../../lib/api';

type Status = {
  webhooks: { discord: boolean; slack: boolean; telegram: boolean };
  calendar: { subscriptions: number; calDav: boolean };
};

type Props = {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  tasks: Task[];
  setImportPreview: React.Dispatch<React.SetStateAction<ImportPreview | null>>;
  isBackendAvailable: boolean;
};

export function IntegrationSettingsSection({
  settings,
  setSettings,
  tasks,
  setImportPreview,
  isBackendAvailable
}: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isBackendAvailable) return;
    void apiRequest<Status>(apiPaths.integrationStatus)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [isBackendAvailable]);

  const pullCalendars = async () => {
    setBusy(true);
    try {
      const { tasks: imported } = await apiRequest<{ tasks: Task[] }>(apiPaths.calendarPull, {
        method: 'POST'
      });
      const currentById = new Map(tasks.map((task) => [task.id, task]));
      const newTasks = imported.filter((task) => !currentById.has(task.id));
      const updatedTasks = imported.filter((task) => {
        const current = currentById.get(task.id);
        return current && JSON.stringify(current) !== JSON.stringify(task);
      });
      const unchangedTasks = imported.filter((task) => {
        const current = currentById.get(task.id);
        return current && JSON.stringify(current) === JSON.stringify(task);
      });
      setImportPreview({ imported, newTasks, updatedTasks, unchangedTasks });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Calendar sync failed.');
    } finally {
      setBusy(false);
    }
  };

  const pushCalendars = async () => {
    setBusy(true);
    try {
      const result = await apiRequest<{ pushed: number; failed: string[] }>(apiPaths.calendarPush, {
        method: 'POST',
        body: JSON.stringify({ tasks })
      });
      if (result.failed.length) toast.error(`${result.failed.length} calendar events failed.`);
      else toast.success(`${result.pushed} calendar events pushed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Calendar push failed.');
    } finally {
      setBusy(false);
    }
  };

  const testAlerts = async () => {
    setBusy(true);
    try {
      const result = await apiRequest<{ sent: string[]; failed: string[] }>(apiPaths.integrationAlertTest, {
        method: 'POST',
        body: JSON.stringify({
          providers: enabledProviders,
          templates: Object.fromEntries(
            enabledProviders.map((provider) => [
              provider,
              settings.webhookProviderSettings[provider].template
            ])
          )
        })
      });
      if (result.failed.length) toast.error(`Failed: ${result.failed.join(', ')}`);
      else toast.success(`Alert sent to ${result.sent.join(', ')}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Webhook test failed.');
    } finally {
      setBusy(false);
    }
  };

  const providerKeys = ['discord', 'slack', 'telegram'] as const;
  const configuredProviders = status ? providerKeys.filter((provider) => status.webhooks[provider]) : [];
  const enabledProviders = configuredProviders.filter(
    (provider) => settings.webhookProviderSettings[provider].enabled
  );
  const providerLabel = (provider: (typeof providerKeys)[number]) =>
    provider[0].toUpperCase() + provider.slice(1);
  const updateProvider = (
    provider: (typeof providerKeys)[number],
    updates: Partial<AppSettings['webhookProviderSettings'][typeof provider]>
  ) =>
    setSettings((previous) => {
      const webhookProviderSettings = {
        ...previous.webhookProviderSettings,
        [provider]: { ...previous.webhookProviderSettings[provider], ...updates }
      };
      const hasEnabledProvider = configuredProviders.some(
        (configured) => webhookProviderSettings[configured].enabled
      );
      return {
        ...previous,
        webhookAlertsEnabled: hasEnabledProvider ? previous.webhookAlertsEnabled : false,
        webhookProviderSettings
      };
    });
  const calendarConfigured = Boolean(status && (status.calendar.subscriptions > 0 || status.calendar.calDav));

  return (
    <div className="space-y-3">
      {!isBackendAvailable && <p className="text-xs text-slate-500">Integrations require the backend.</p>}
      <div className="flex flex-wrap gap-1.5">
        {configuredProviders.map((provider) => (
          <span
            key={providerLabel(provider)}
            className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {providerLabel(provider)}
          </span>
        ))}
        {status && configuredProviders.length === 0 && (
          <span className="text-xs text-slate-500">No webhook providers configured.</span>
        )}
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Automatic webhook alerts</span>
        <input
          aria-label="Automatic webhook alerts"
          type="checkbox"
          checked={settings.webhookAlertsEnabled}
          disabled={enabledProviders.length === 0}
          onChange={(event) =>
            setSettings((previous) => ({ ...previous, webhookAlertsEnabled: event.target.checked }))
          }
        />
      </label>
      <div className="space-y-2">
        {configuredProviders.map((provider) => (
          <div key={provider} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              <span>{providerLabel(provider)}</span>
              <input
                aria-label={`Enable ${providerLabel(provider)} alerts`}
                type="checkbox"
                checked={settings.webhookProviderSettings[provider].enabled}
                onChange={(event) => updateProvider(provider, { enabled: event.target.checked })}
              />
            </label>
            <label className="mt-2 block text-xs text-slate-500">
              Message template
              <textarea
                aria-label={`${providerLabel(provider)} message template`}
                value={settings.webhookProviderSettings[provider].template}
                onChange={(event) => updateProvider(provider, { template: event.target.value })}
                rows={3}
                maxLength={4000}
                className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
            </label>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Templates support {`{title}`} and {`{body}`}.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={busy || !calendarConfigured}
          onClick={() => void pullCalendars()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40 dark:border-slate-700"
        >
          Pull calendar events
        </button>
        <button
          type="button"
          disabled={busy || !status?.calendar.calDav}
          onClick={() => void pushCalendars()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40 dark:border-slate-700"
        >
          Push scheduled tasks
        </button>
        <button
          type="button"
          disabled={busy || enabledProviders.length === 0}
          onClick={() => void testAlerts()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40 dark:border-slate-700"
        >
          Send test alert
        </button>
      </div>
      {status && (
        <p className="text-xs text-slate-500">
          {status.calendar.subscriptions} ICS subscriptions. CalDAV{' '}
          {status.calendar.calDav ? 'enabled' : 'disabled'}.
        </p>
      )}
    </div>
  );
}
