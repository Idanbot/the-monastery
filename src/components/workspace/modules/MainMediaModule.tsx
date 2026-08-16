import { Music2 } from 'lucide-react';
import type { MainViewSlotId } from '../../../domain/types';

export function MainMediaModule({
  slot,
  url,
  active,
  expanded,
  isDockHost,
  onOpen
}: {
  slot: MainViewSlotId;
  url: string;
  active: boolean;
  expanded: boolean;
  isDockHost: boolean;
  onOpen: () => void;
}) {
  if (isDockHost && active && !expanded) {
    return (
      <div
        id="main-focus-media-host"
        data-testid="main-media-dock-host"
        data-slot={slot}
        className="flex h-full min-h-0 items-center"
      />
    );
  }
  let source = 'Saved focus source';
  try {
    source = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // Legacy profile values may not be valid URLs.
  }
  return (
    <section
      data-testid="main-media-module"
      data-slot={slot}
      className="ui-surface flex items-center gap-3 rounded-[var(--ui-radius-panel)] border p-4 shadow-[var(--ui-shadow-sm)]"
    >
      <div className="ui-accent-button grid size-10 shrink-0 place-items-center rounded-xl">
        <Music2 size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">Focus media</h3>
        <p className="truncate text-xs text-[var(--ui-text-secondary)]">{source}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="ui-control ui-focus-ring min-h-9 rounded-lg px-3 text-xs font-semibold"
      >
        Open
      </button>
    </section>
  );
}
