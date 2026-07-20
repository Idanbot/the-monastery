import { useState } from 'react';
import { Clock, Hash } from 'lucide-react';
import type { AppSettings } from '../../domain/types';
import { requestNotificationPermission, sendBrowserNotification } from '../../domain/notifications';
import { SettingSection } from './SettingSection';
import { SettingsSelect } from './SettingsSelect';

type Props = {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  openSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  motionDuration: number;
  motionEase: string | readonly [number, number, number, number];
  effectiveClockTextColor: string;
  effectiveClockBackgroundColor: string;
};

export function TimeSettingsSection({
  settings,
  setSettings,
  openSections,
  toggleSection,
  motionDuration,
  motionEase,
  effectiveClockTextColor,
  effectiveClockBackgroundColor
}: Props) {
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission));
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSetting('notificationsEnabled', false);
      return;
    }
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    updateSetting('notificationsEnabled', permission === 'granted');
  };

  return (
    <SettingSection
      id="time"
      title="Time"
      openSections={openSections}
      toggleSection={toggleSection}
      motionDuration={motionDuration}
      motionEase={motionEase}
    >
      <SettingsSelect
        ariaLabel="Clock format"
        value={settings.clockFormat}
        onValueChange={(value) => updateSetting('clockFormat', value as AppSettings['clockFormat'])}
        options={[
          { id: '12h', label: '12 hour' },
          { id: '24h', label: '24 hour' }
        ]}
      />
      <Toggle
        label="Seconds"
        ariaLabel="Show seconds"
        checked={settings.showSeconds !== false}
        onChange={(checked) => updateSetting('showSeconds', checked)}
      />
      <Toggle
        label="Background"
        ariaLabel="Clock background"
        checked={settings.clockBackgroundVisible !== false}
        onChange={(checked) => updateSetting('clockBackgroundVisible', checked)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorSetting
          label="Clock text"
          ariaLabel="Clock text color"
          value={effectiveClockTextColor}
          onChange={(value) => updateSetting('clockTextColor', value)}
          onReset={() => updateSetting('clockTextColor', '')}
          resetLabel="Use theme text"
        />
        <ColorSetting
          label="Clock fill"
          ariaLabel="Clock background color"
          value={effectiveClockBackgroundColor}
          onChange={(value) => updateSetting('clockBackgroundColor', value)}
          onReset={() => updateSetting('clockBackgroundColor', '')}
          resetLabel="Use theme fill"
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
        <span className="text-sm text-slate-700 dark:text-slate-300">Clock face</span>
        <IconChoice
          label="Digital clock"
          pressed={settings.clockDisplayMode !== 'analog'}
          onClick={() => updateSetting('clockDisplayMode', 'digital')}
        >
          <Hash size={16} />
        </IconChoice>
        <IconChoice
          label="Analog clock"
          pressed={settings.clockDisplayMode === 'analog'}
          onClick={() => updateSetting('clockDisplayMode', 'analog')}
        >
          <Clock size={16} />
        </IconChoice>
      </div>
      <Toggle
        label="Hour lines"
        ariaLabel="Hourly timeline guide lines"
        checked={settings.timelineHourLinesVisible !== false}
        onChange={(checked) => updateSetting('timelineHourLinesVisible', checked)}
      />
      <Toggle
        label="Now line"
        ariaLabel="Current time red line"
        checked={settings.timelineNowLineVisible !== false}
        onChange={(checked) => updateSetting('timelineNowLineVisible', checked)}
      />
      <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
          <span>Browser notifications</span>
          <input
            aria-label="Browser notifications"
            type="checkbox"
            checked={settings.notificationsEnabled === true}
            disabled={notificationPermission === 'unsupported'}
            onChange={(event) => void toggleNotifications(event.target.checked)}
            className="h-4 w-4 accent-indigo-600 disabled:opacity-50"
          />
        </label>
        <p className="mt-1 text-xs text-slate-500" aria-live="polite">
          {notificationPermission === 'unsupported'
            ? 'Notifications are not supported by this browser.'
            : notificationPermission === 'denied'
              ? 'Permission is blocked in browser settings.'
              : 'Alerts for task starts, overdue tasks, long-running timers, and Pomodoro completion.'}
        </p>
        {settings.notificationsEnabled && notificationPermission === 'granted' && (
          <button
            type="button"
            onClick={() => sendBrowserNotification('The Monastery', { body: 'Notifications are working.' })}
            className="mt-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
          >
            Send test notification
          </button>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
        <span className="text-sm text-slate-700 dark:text-slate-300">Clock size</span>
        <SizeButton
          label="Decrease clock size"
          onClick={() =>
            updateSetting('clockTextScale', Math.max(0.7, Number(settings.clockTextScale || 1) - 0.1))
          }
        >
          -
        </SizeButton>
        <SizeButton
          label="Increase clock size"
          onClick={() =>
            updateSetting('clockTextScale', Math.min(1.4, Number(settings.clockTextScale || 1) + 0.1))
          }
        >
          +
        </SizeButton>
      </div>
    </SettingSection>
  );
}

function Toggle({
  label,
  ariaLabel,
  checked,
  onChange
}: {
  label: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <input
        aria-label={ariaLabel}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-indigo-600"
      />
    </label>
  );
}

function ColorSetting({
  label,
  ariaLabel,
  value,
  onChange,
  onReset,
  resetLabel
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <input
        aria-label={ariaLabel}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1"
      />
      <button
        type="button"
        onClick={onReset}
        className="rounded-md text-xs text-slate-500 hover:text-indigo-600 text-left"
      >
        {resetLabel}
      </button>
    </label>
  );
}

function IconChoice({
  label,
  pressed,
  onClick,
  children
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      type="button"
      onClick={onClick}
      className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 grid place-items-center aria-pressed:text-indigo-600 aria-pressed:border-indigo-300"
    >
      {children}
    </button>
  );
}

function SizeButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      type="button"
      onClick={onClick}
      className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-lg font-semibold"
    >
      {children}
    </button>
  );
}
