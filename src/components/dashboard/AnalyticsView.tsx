import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { ActivityGraph } from './ActivityGraph';
import { calculateAnalytics } from '../../domain/analytics';
import { activeTaskStatuses, formatDurationString, statusLabels, taskStatuses } from '../../domain/tasks';
import type { AppSettings, Profile, Task } from '../../domain/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const percentWidth = (value: number) => String(Math.min(100, value)) + '%';

const renderRadarChart = (roles: Array<any>) => {
  const size = 300;
  const center = size / 2;
  const radius = 104;
  const maxHours = Math.max(1, ...roles.map((role) => role.hours));
  const pointsForScale = (scale: number) =>
    roles
      .map((_, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(roles.length, 1);
        return (
          String(center + Math.cos(angle) * radius * scale) +
          ',' +
          String(center + Math.sin(angle) * radius * scale)
        );
      })
      .join(' ');
  const valuePoints = roles
    .map((role, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(roles.length, 1);
      const scale = role.hours / maxHours;
      return (
        String(center + Math.cos(angle) * radius * scale) +
        ',' +
        String(center + Math.sin(angle) * radius * scale)
      );
    })
    .join(' ');

  if (roles.length < 3) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
        Define at least three roles for radar view
      </div>
    );
  }

  return (
    <svg
      data-testid="role-radar-chart"
      viewBox={'0 0 ' + size + ' ' + size}
      className="w-full max-w-[360px] mx-auto overflow-visible"
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={pointsForScale(scale)}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth="1"
        />
      ))}
      {roles.map((role, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / roles.length;
        const axisX = center + Math.cos(angle) * radius;
        const axisY = center + Math.sin(angle) * radius;
        const labelX = center + Math.cos(angle) * (radius + 28);
        const labelY = center + Math.sin(angle) * (radius + 28);
        return (
          <g key={role.id}>
            <line
              x1={center}
              y1={center}
              x2={axisX}
              y2={axisY}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeWidth="1"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-600 dark:fill-slate-300 text-[10px] font-semibold"
            >
              {role.name}
            </text>
          </g>
        );
      })}
      <polygon
        data-testid="role-radar-polygon"
        points={valuePoints}
        fill="rgb(79 70 229 / 0.22)"
        stroke="rgb(79 70 229)"
        strokeWidth="2"
      />
      {roles.map((role, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / roles.length;
        const scale = role.hours / maxHours;
        return (
          <circle
            key={role.id}
            cx={center + Math.cos(angle) * radius * scale}
            cy={center + Math.sin(angle) * radius * scale}
            r="3.5"
            fill="rgb(79 70 229)"
          />
        );
      })}
    </svg>
  );
};

type AnalyticsResult = ReturnType<typeof calculateAnalytics>;

function MobileAnalyticsSummary({
  analytics,
  tasks,
  activeProfile,
  currentTask,
  openRoleSettings
}: {
  analytics: AnalyticsResult;
  tasks: Task[];
  activeProfile: Profile | null;
  currentTask: Task | null;
  openRoleSettings: () => void;
}) {
  return (
    <section
      data-testid="mobile-analytics-view"
      className="custom-scrollbar min-h-0 w-full flex-1 overflow-y-auto pb-3 sm:hidden"
    >
      <header className="mb-3 flex items-end justify-between gap-3 px-1 pt-1">
        <div className="min-w-0">
          <div className="ui-eyebrow">Insights</div>
          <h1 className="mt-0.5 text-2xl font-semibold text-[var(--ui-text-primary)]">Analytics</h1>
          {activeProfile && (
            <p className="mt-1 truncate text-sm text-[var(--ui-text-secondary)]">{activeProfile.name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={openRoleSettings}
          className="ui-control ui-focus-ring min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold"
        >
          Goals
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <article className="ui-surface col-span-2 rounded-2xl border p-4 shadow-sm">
          <div className="text-sm font-medium text-[var(--ui-text-secondary)]">Tracked time</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[var(--ui-info)]">
            {formatDurationString(analytics.totalTrackedMs)}
          </div>
        </article>
        {taskStatuses.map((status) => (
          <article
            key={status}
            data-testid={`mobile-metric-${status}`}
            className="ui-surface rounded-2xl border p-3 shadow-sm"
          >
            <div className="text-xs font-medium text-[var(--ui-text-secondary)]">{statusLabels[status]}</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--ui-text-primary)]">
              {analytics.statusCounts[status]}
            </div>
          </article>
        ))}
      </div>

      <section className="ui-surface mt-3 rounded-2xl border p-4 shadow-sm">
        <div className="ui-eyebrow">Current focus</div>
        <div className="mt-1 line-clamp-2 text-base font-semibold text-[var(--ui-text-primary)]">
          {currentTask?.title || 'No active task'}
        </div>
        <div className="mt-2 text-sm text-[var(--ui-text-secondary)]">
          Top tag: {analytics.tagRows[0]?.tag || 'No tracked tags'}
        </div>
      </section>

      <div className="mt-3">
        <ActivityGraph tasks={tasks} compact />
      </div>

      <details className="ui-surface mt-3 rounded-2xl border shadow-sm">
        <summary className="ui-focus-ring flex min-h-12 cursor-pointer items-center justify-between rounded-2xl px-4 text-base font-semibold">
          <span>Role progress</span>
          <span className="ui-muted-chip text-xs">{analytics.roleRows.length}</span>
        </summary>
        <div className="space-y-3 border-t border-[var(--ui-border-subtle)] p-4">
          {analytics.roleRows.map((role) => {
            const target = Math.max(0, Number(role.weeklyTargetHours) || 0);
            return (
              <div key={role.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{role.name}</span>
                  <span className="shrink-0 font-mono text-xs text-[var(--ui-text-secondary)]">
                    {role.hours.toFixed(1)}h{target ? ` / ${target}h` : ''}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ui-control)]">
                  <div
                    className="h-full rounded-full bg-[var(--ui-info)]"
                    style={{ width: target ? percentWidth(role.weeklyProgress * 100) : '0%' }}
                  />
                </div>
              </div>
            );
          })}
          {analytics.roleRows.length === 0 && (
            <p className="text-sm text-[var(--ui-text-secondary)]">No role goals yet.</p>
          )}
        </div>
      </details>

      <details className="ui-surface mt-3 rounded-2xl border shadow-sm">
        <summary className="ui-focus-ring flex min-h-12 cursor-pointer items-center justify-between rounded-2xl px-4 text-base font-semibold">
          <span>Tag progress</span>
          <span className="ui-muted-chip text-xs">{analytics.tagRows.length}</span>
        </summary>
        <div className="space-y-3 border-t border-[var(--ui-border-subtle)] p-4">
          {analytics.tagRows.slice(0, 12).map((row) => (
            <div key={row.tag} className="flex min-h-8 items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{row.tag}</span>
              <span className="shrink-0 font-mono text-xs text-[var(--ui-text-secondary)]">
                {row.hours.toFixed(1)}h
              </span>
            </div>
          ))}
          {analytics.tagRows.length === 0 && (
            <p className="text-sm text-[var(--ui-text-secondary)]">No tracked tag time yet.</p>
          )}
        </div>
      </details>
    </section>
  );
}

export function AnalyticsView({
  tasks,
  settings,
  now,
  activeProfile,
  currentTask,
  openRoleSettings
}: {
  tasks: Task[];
  settings: AppSettings;
  now: number;
  activeProfile: Profile | null;
  currentTask: Task | null;
  openRoleSettings: () => void;
}) {
  const analytics = calculateAnalytics({ tasks, roles: settings.roles, tagGoals: settings.tagGoals, now });
  const isPhoneLayout = useMediaQuery('(max-width: 639px)');
  const statusChartData = taskStatuses.map((status) => ({
    name: statusLabels[status],
    tasks: analytics.statusCounts[status] || 0
  }));

  if (isPhoneLayout) {
    return (
      <MobileAnalyticsSummary
        analytics={analytics}
        tasks={tasks}
        activeProfile={activeProfile}
        currentTask={currentTask}
        openRoleSettings={openRoleSettings}
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Analytics</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tracked time is credited to matching tags and roles.
            </p>
          </div>
          {activeProfile && (
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Profile: {activeProfile.name}
            </div>
          )}
          <button
            onClick={openRoleSettings}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Role settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-slate-500 text-sm mb-1">Total Tracked</div>
            <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {formatDurationString(analytics.totalTrackedMs)}
            </div>
          </div>
          {taskStatuses.map((status) => (
            <div
              key={status}
              data-testid={'metric-' + status}
              className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="text-slate-500 text-sm mb-1">{statusLabels[status]}</div>
              <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100">
                {analytics.statusCounts[status]}
              </div>
            </div>
          ))}
        </div>

        <ActivityGraph tasks={tasks} />

        <section
          data-testid="analytics-status-chart"
          className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <h3 className="text-base font-bold mb-4">Status Chart</h3>
          <div className="h-44 overflow-x-auto">
            <BarChart width={520} height={176} data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RechartsTooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="tasks" fill="var(--theme-main)" radius={[8, 8, 2, 2]} />
            </BarChart>
          </div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base font-bold mb-4">Drilldowns</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-400">Top role</div>
              <div className="font-semibold truncate">{analytics.roleRows[0]?.name || 'None'}</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-400">Top tag</div>
              <div className="font-semibold truncate">{analytics.tagRows[0]?.tag || 'None'}</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-400">Tracked</div>
              <div className="font-mono font-semibold">{formatDurationString(analytics.totalTrackedMs)}</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-400">Role coverage</div>
              <div className="font-mono font-semibold">
                {analytics.roleRows.filter((role) => role.durationMs > 0).length}/
                {Math.max(1, analytics.roleRows.length)}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-bold">Role Radar</h3>
              <span className="text-xs text-slate-500">points = hours</span>
            </div>
            {renderRadarChart(analytics.roleRows)}
          </section>

          <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold mb-4">Role Hours</h3>
            <div className="space-y-3">
              {analytics.roleRows.length === 0 && (
                <div className="text-sm text-slate-400">No roles defined.</div>
              )}
              {analytics.roleRows.map((role) => {
                const maxRoleHours = Math.max(1, ...analytics.roleRows.map((item) => item.hours));
                const targetHours = Math.max(0, Number(role.weeklyTargetHours) || 0);
                const progressBase = targetHours > 0 ? targetHours : maxRoleHours;
                return (
                  <div key={role.id}>
                    <div className="flex justify-between gap-3 text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{role.name}</span>
                      <span className="font-mono text-slate-500">
                        {role.hours.toFixed(2)}h{targetHours > 0 ? ' / ' + targetHours + 'h' : ''}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: percentWidth((role.hours / progressBase) * 100) }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {role.matchingTags.length ? role.matchingTags.join(', ') : 'No matching tracked tags'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base font-bold mb-4">Weekly Role Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {analytics.roleRows.length === 0 && (
              <div className="text-sm text-slate-400">No role goals yet.</div>
            )}
            {analytics.roleRows.map((role) => (
              <div
                key={role.id}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium truncate">{role.name}</span>
                  <span className="font-mono text-xs text-slate-500">
                    {role.weeklyTargetHours
                      ? Math.max(0, role.weeklyBalanceHours).toFixed(1) + 'h left'
                      : 'no goal'}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: role.weeklyTargetHours ? percentWidth(role.weeklyProgress * 100) : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold mb-4">Tag Hours</h3>
            <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {analytics.tagRows.length === 0 && (
                <div className="text-sm text-slate-400">No tracked tag time yet.</div>
              )}
              {analytics.tagRows.map((row) => {
                const maxTagHours = Math.max(1, ...analytics.tagRows.map((item) => item.hours));
                return (
                  <div key={row.tag} className="grid grid-cols-[8rem_1fr_4rem] items-center gap-3 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{row.tag}</span>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: percentWidth((row.hours / maxTagHours) * 100) }}
                      ></div>
                    </div>
                    <span className="font-mono text-xs text-slate-500 text-right">
                      {row.hours.toFixed(2)}h
                      {row.weeklyTargetHours ? ' / ' + row.weeklyTargetHours + 'h' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold mb-4">Focus Snapshot</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
                <span className="text-slate-500">Now</span>
                <span className="font-medium truncate">{currentTask?.title || 'No active task'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
                <span className="text-slate-500">Next scheduled</span>
                <span className="font-medium truncate">
                  {tasks
                    .filter((task) => task.scheduledStart && activeTaskStatuses.includes(task.status))
                    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))[0]?.title || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
                <span className="text-slate-500">Top tag</span>
                <span className="font-medium truncate">{analytics.tagRows[0]?.tag || 'None'}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
