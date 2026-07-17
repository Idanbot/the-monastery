import { Settings } from 'lucide-react';
import type { AppSettings } from '../domain/types';
import { formatTime } from '../domain/tasks';
import { cssVars } from '../lib/cssVars';

/**
 * Sidebar clock widget. Extracted from App so App no longer owns clock-hand
 * angle math and the widget JSX. The angles are derived from `now` here so the
 * caller just passes a timestamp.
 */
export function ClockWidget({
  settings,
  now,
  onOpenSettings,
  fill = false
}: {
  settings: AppSettings;
  now: number;
  onOpenSettings: (section: string) => void;
  fill?: boolean;
}) {
  const clockDate = new Date(now);
  const clockMinuteAngle = clockDate.getMinutes() * 6 + clockDate.getSeconds() * 0.1;
  const clockSecondAngle = clockDate.getSeconds() * 6;
  const clockHourAngle = ((clockDate.getHours() % 12) + clockDate.getMinutes() / 60) * 30;
  const clockHeight = settings.clockHeight || 160;
  const analogSize = Math.min(92, Math.max(58, clockHeight - 76));

  return (
    <div
      data-material="widget"
      data-clock-background={settings.clockBackgroundVisible === false ? 'false' : 'true'}
      data-clock-mode={settings.clockDisplayMode === 'analog' ? 'analog' : 'digital'}
      className="clock-widget rounded-2xl border p-4 flex flex-col items-center justify-center relative overflow-hidden shrink-0"
      style={cssVars({
        height: fill ? '100%' : String(clockHeight) + 'px',
        background:
          settings.clockBackgroundVisible === false ? 'transparent' : 'var(--clock-background-color)',
        borderColor: settings.clockBackgroundVisible === false ? 'transparent' : 'var(--theme-border)',
        '--clock-text-color': settings.clockTextColor || settings.colorScheme?.text || 'var(--theme-text)',
        '--clock-background-color': settings.clockBackgroundColor || 'var(--theme-surface)',
        color: 'var(--clock-text-color)',
        boxShadow: settings.clockBackgroundVisible === false ? 'none' : undefined
      })}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 pointer-events-none"></div>
      <div className="clock-widget-controls absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg border border-[color:var(--theme-border)] bg-[color:var(--theme-muted-surface)] p-1 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Open clock settings"
          onClick={() => onOpenSettings('time')}
          className="grid h-6 w-6 place-items-center rounded-md text-[color:var(--theme-muted-text)] hover:bg-[color:var(--theme-muted-surface)] hover:text-[color:var(--theme-text)]"
        >
          <Settings size={13} />
        </button>
      </div>
      {settings.clockDisplayMode === 'analog' ? (
        <div
          data-testid="clock-analog"
          className="relative z-10 mb-2 grid place-items-center rounded-full border-2"
          style={{
            width: analogSize + 'px',
            height: analogSize + 'px',
            color: 'var(--clock-text-color)',
            borderColor: 'currentColor'
          }}
        >
          <div className="absolute h-1.5 w-1.5 rounded-full bg-current" />
          <div
            className="absolute bottom-1/2 left-1/2 h-[28%] w-0.5 origin-bottom rounded-full bg-current"
            style={{ transform: 'translateX(-50%) rotate(' + clockHourAngle + 'deg)' }}
          />
          <div
            className="absolute bottom-1/2 left-1/2 h-[38%] w-px origin-bottom rounded-full bg-current"
            style={{ transform: 'translateX(-50%) rotate(' + clockMinuteAngle + 'deg)' }}
          />
          {settings.showSeconds && (
            <div
              data-testid="clock-second-hand"
              className="absolute bottom-1/2 left-1/2 h-[42%] w-px origin-bottom rounded-full bg-rose-500"
              style={{ transform: 'translateX(-50%) rotate(' + clockSecondAngle + 'deg)' }}
            />
          )}
        </div>
      ) : (
        <div
          data-testid="clock-time"
          className="font-mono font-bold mb-1 relative z-10 drop-shadow-md leading-none whitespace-nowrap max-w-full text-center"
          style={{
            color: 'var(--clock-text-color)',
            fontSize: `clamp(1.75rem, ${(settings.clockTextScale || 1) * 2.25}rem, ${Math.max(
              2,
              (clockHeight - 58) / 28
            )}rem)`
          }}
        >
          {formatTime(now, settings.clockFormat, settings.showSeconds)}
        </div>
      )}
      <div className="text-sm font-medium text-[color:var(--theme-muted-text)] relative z-10">
        {new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }).format(now)}
      </div>
    </div>
  );
}
