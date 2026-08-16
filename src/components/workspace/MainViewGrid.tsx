import { Maximize2, Minimize2, Settings2 } from 'lucide-react';
import { useMemo } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import {
  mainViewSlotContentDefinitions,
  mainViewSlotDefinitions,
  normalizeMainViewSlots
} from '../../domain/mainView';
import type { MainViewSlotId } from '../../domain/types';
import { MainViewSlotContent } from './MainViewSlotContent';

const slotPositions = {
  topLeft: { gridColumn: 1, gridRow: 1 },
  topRight: { gridColumn: 3, gridRow: 1 },
  bottomLeft: { gridColumn: 1, gridRow: 3 },
  bottomRight: { gridColumn: 3, gridRow: 3 }
} as const;

export function MainViewGrid() {
  const { settings, setSettings, openSettings, startResize } = useSettingsContext();
  const slots = useMemo(
    () => normalizeMainViewSlots(settings.mainViewSlots, settings.mainViewModules),
    [settings.mainViewModules, settings.mainViewSlots]
  );
  const collapsedSlots = settings.collapsedMainViewSlots || [];
  const columnSplit = settings.mainViewColumnSplit || 50;
  const rowSplit = settings.mainViewRowSplit || 50;
  const mediaSlot = mainViewSlotDefinitions.find(({ id }) =>
    ['media', 'calendar-media', 'clock-media-timeline'].includes(slots[id])
  )?.id;
  const toggleSlot = (slot: MainViewSlotId) =>
    setSettings((previous) => {
      const collapsed = previous.collapsedMainViewSlots || [];
      return {
        ...previous,
        collapsedMainViewSlots: collapsed.includes(slot)
          ? collapsed.filter((candidate) => candidate !== slot)
          : [...collapsed, slot]
      };
    });
  const resizeWithKeyboard = (axis: 'columns' | 'rows', delta: number) =>
    setSettings((previous) => {
      const key = axis === 'columns' ? 'mainViewColumnSplit' : 'mainViewRowSplit';
      return { ...previous, [key]: Math.min(80, Math.max(20, (previous[key] || 50) + delta)) };
    });

  return (
    <div
      data-testid="main-view-grid"
      className="grid min-h-0 flex-1"
      style={{
        gridTemplateColumns: `minmax(0, ${columnSplit}fr) 0.75rem minmax(0, ${100 - columnSplit}fr)`,
        gridTemplateRows: `minmax(0, ${rowSplit}fr) 0.75rem minmax(0, ${100 - rowSplit}fr)`
      }}
    >
      {mainViewSlotDefinitions.map(({ id, label }) => {
        const collapsed = collapsedSlots.includes(id);
        const moduleLabel = mainViewSlotContentDefinitions.find(
          ({ id: content }) => content === slots[id]
        )?.label;
        return (
          <div
            key={id}
            data-testid={`main-view-slot-${id}`}
            data-slot={id}
            data-module={slots[id]}
            data-collapsed={collapsed ? 'true' : 'false'}
            className="main-view-slot group relative min-h-0 min-w-0 overflow-hidden"
            style={slotPositions[id]}
          >
            {collapsed ? (
              <div className="ui-surface flex min-h-11 items-center gap-2 rounded-[var(--ui-radius-panel)] border px-3 shadow-[var(--ui-shadow-sm)]">
                <span className="truncate text-sm font-semibold text-[var(--ui-text-primary)]">
                  {moduleLabel}
                </span>
                <button
                  type="button"
                  aria-label={`Expand ${label}`}
                  onClick={() => toggleSlot(id)}
                  className="ui-icon-button ui-control ml-auto"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            ) : (
              <>
                <div
                  role="group"
                  aria-label={`${label} controls`}
                  className="main-view-slot-actions absolute left-1 top-1 z-20 flex items-center gap-1 transition-opacity"
                >
                  <button
                    type="button"
                    aria-label={`Collapse ${label}`}
                    title={`Collapse ${label}`}
                    onClick={() => toggleSlot(id)}
                    className="ui-icon-button ui-icon-button-sm ui-control"
                  >
                    <Minimize2 size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Customize ${label}`}
                    title={`Customize ${label}`}
                    onClick={() => openSettings('main')}
                    className="ui-icon-button ui-icon-button-sm ui-control"
                  >
                    <Settings2 size={12} />
                  </button>
                </div>
                <MainViewSlotContent content={slots[id]} slot={id} mediaSlot={mediaSlot} />
              </>
            )}
          </div>
        );
      })}
      {settings.resizeHandleVisible !== false && (
        <>
          <div
            role="separator"
            aria-label="Resize main view columns"
            aria-orientation="vertical"
            aria-valuemin={20}
            aria-valuemax={80}
            aria-valuenow={Math.round(columnSplit)}
            tabIndex={0}
            className="resize-handle resize-handle-vertical group flex cursor-col-resize items-center justify-center justify-self-center rounded"
            style={{ gridColumn: 2, gridRow: '1 / 4' }}
            onMouseDown={(event) => {
              event.preventDefault();
              startResize('main-view-columns');
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') resizeWithKeyboard('columns', -2);
              if (event.key === 'ArrowRight') resizeWithKeyboard('columns', 2);
            }}
          >
            <div className="resize-grip resize-grip-vertical rounded-full" />
          </div>
          <div
            role="separator"
            aria-label="Resize main view rows"
            aria-orientation="horizontal"
            aria-valuemin={20}
            aria-valuemax={80}
            aria-valuenow={Math.round(rowSplit)}
            tabIndex={0}
            className="resize-handle resize-handle-horizontal group flex cursor-row-resize items-center justify-center self-center rounded"
            style={{ gridColumn: '1 / 4', gridRow: 2 }}
            onMouseDown={(event) => {
              event.preventDefault();
              startResize('main-view-rows');
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') resizeWithKeyboard('rows', -2);
              if (event.key === 'ArrowDown') resizeWithKeyboard('rows', 2);
            }}
          >
            <div className="resize-grip resize-grip-horizontal rounded-full" />
          </div>
        </>
      )}
    </div>
  );
}
