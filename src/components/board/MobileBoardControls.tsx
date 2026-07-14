import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { AppSettings, TaskStatus } from '../../domain/types';
import { defaultBoardColumnOrder, statusLabels } from '../../domain/tasks';

type Props = {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
};

const pairOrder = (top: TaskStatus, pair: TaskStatus[]) => [top, pair.find((status) => status !== top)!];

export function MobileBoardControls({ settings, setSettings }: Props) {
  const [customizing, setCustomizing] = useState(false);
  const order = settings.boardColumnOrder || defaultBoardColumnOrder;
  const updateOrder = (key: 'compactActive' | 'compactDone', value: TaskStatus[]) =>
    setSettings((previous) => ({
      ...previous,
      boardColumnOrder: { ...previous.boardColumnOrder, [key]: value }
    }));

  return (
    <div data-testid="mobile-board-controls" className="mb-2 flex flex-col items-end gap-2 lg:hidden">
      <button
        type="button"
        aria-label={settings.mobileFocusMode ? 'Show full mobile board' : 'Use focused mobile view'}
        onClick={() =>
          setSettings((previous) => ({ ...previous, mobileFocusMode: !previous.mobileFocusMode }))
        }
        className="ui-control ui-focus-ring flex min-h-9 w-fit items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold"
      >
        {settings.mobileFocusMode ? 'Full board' : 'Focus view'}
      </button>
      <details className="ui-surface hidden w-full rounded-xl border px-3 py-2 text-sm shadow-sm sm:block">
        <summary className="cursor-pointer select-none text-xs font-semibold text-slate-600 dark:text-slate-300">
          Board layout
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <select
            aria-label="Mobile board layout"
            value={settings.layoutPreset}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                layoutPreset: event.target.value as AppSettings['layoutPreset']
              }))
            }
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="compact">Compact</option>
            <option value="three-column">3 columns</option>
            <option value="full">4 columns</option>
          </select>
          <button
            type="button"
            aria-label="Customize lane order"
            aria-expanded={customizing}
            onClick={() => setCustomizing((value) => !value)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 dark:border-slate-700"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
        {customizing && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-medium text-slate-500">
              Active top
              <select
                aria-label="Compact active top lane"
                value={order.compactActive[0]}
                onChange={(event) =>
                  updateOrder(
                    'compactActive',
                    pairOrder(event.target.value as TaskStatus, ['backlog', 'in-progress'])
                  )
                }
                className="mt-1 w-full rounded border border-slate-200 bg-transparent px-1.5 py-1 text-xs dark:border-slate-700"
              >
                {(['backlog', 'in-progress'] as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-medium text-slate-500">
              Outcome top
              <select
                aria-label="Compact outcome top lane"
                value={order.compactDone[0]}
                onChange={(event) =>
                  updateOrder(
                    'compactDone',
                    pairOrder(event.target.value as TaskStatus, ['done', 'rejected'])
                  )
                }
                className="mt-1 w-full rounded border border-slate-200 bg-transparent px-1.5 py-1 text-xs dark:border-slate-700"
              >
                {(['done', 'rejected'] as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </details>
    </div>
  );
}
