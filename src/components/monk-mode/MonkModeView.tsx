import { useState, type Dispatch, type SetStateAction } from 'react';
import { ListTree, LogOut, Plus } from 'lucide-react';
import { activeTaskStatuses } from '../../domain/tasks';
import type { AppSettings, Task } from '../../domain/types';
import { OneBreath } from './OneBreath';
import { PomodoroTimer } from './PomodoroTimer';

export function MonkModeView({
  settings,
  setSettings,
  tasks,
  currentTask,
  now,
  isEnteringMonkMode,
  mantra,
  onExit,
  onIntroComplete,
  onAddTask,
  onPomodoroComplete
}: {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  tasks: Task[];
  currentTask: Task | null;
  now: number;
  isEnteringMonkMode: boolean;
  mantra: string;
  onExit: () => void;
  onIntroComplete: () => void;
  onAddTask: () => void;
  onPomodoroComplete: (minutes: number) => void;
}) {
  const [focusMapOpen, setFocusMapOpen] = useState(false);
  const nextTasks = tasks
    .filter((task) => activeTaskStatuses.includes(task.status) && task.id !== currentTask?.id)
    .slice(0, 3);
  const activeMinutes = settings.monkModeOpenedAt
    ? Math.max(0, Math.floor((now - new Date(settings.monkModeOpenedAt).getTime()) / 60_000))
    : 0;
  const activeLabel =
    activeMinutes >= 60 ? `${Math.floor(activeMinutes / 60)}h ${activeMinutes % 60}m` : `${activeMinutes}m`;

  return (
    <div
      data-testid="monk-mode-view"
      className="monk-mode-shell ui-canvas relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--ui-border-subtle)]"
    >
      {isEnteringMonkMode && settings.animationsEnabled !== false && (
        <OneBreath onComplete={onIntroComplete} />
      )}

      <header className="z-10 flex shrink-0 items-center justify-between px-5 py-4 sm:px-7">
        <div>
          <h1 className="text-lg font-semibold text-[var(--ui-text-primary)]">Monk Mode</h1>
          <p className="mt-0.5 text-xs text-[var(--ui-text-secondary)]">Focused for {activeLabel}</p>
        </div>
        <button
          onClick={onExit}
          aria-label="Exit monk mode"
          className="ui-control ui-focus-ring flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold"
        >
          <LogOut size={15} /> Exit
        </button>
      </header>

      <div className="custom-scrollbar z-10 flex min-h-0 flex-1 overflow-y-auto px-4 pb-16 sm:px-7">
        <div className="mx-auto w-full max-w-xl py-2 sm:py-4">
          <section className="monk-focus-unit ui-surface overflow-hidden rounded-2xl border shadow-sm">
            <div className="p-4">
              <PomodoroTimer onComplete={onPomodoroComplete} />
            </div>
            <div className="border-t border-[var(--ui-border-subtle)] px-5 py-4 text-center sm:px-8">
              <div className="ui-eyebrow text-[var(--ui-info)]">Current focus</div>
              {currentTask ? (
                <>
                  <h2 className="mt-2 text-xl font-semibold leading-snug text-[var(--ui-text-primary)] sm:text-2xl">
                    {currentTask.title || 'Untitled task'}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ui-text-secondary)]">
                    {currentTask.activeLogStart
                      ? `Started at ${new Date(currentTask.activeLogStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Timer paused'}
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-sm text-[var(--ui-text-secondary)]">Choose one task to begin.</p>
                  <button
                    onClick={onAddTask}
                    className="ui-accent-button ui-focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
                  >
                    <Plus size={16} /> Add task
                  </button>
                </div>
              )}
            </div>
          </section>

          <label className="mt-4 block border-t border-[var(--ui-border-subtle)] pt-4">
            <span className="ui-eyebrow">One outcome for today</span>
            <input
              value={settings.dailyGoal || ''}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, dailyGoal: event.target.value }))
              }
              placeholder="One outcome for today"
              className="mt-2 w-full bg-transparent text-center text-base font-medium text-[var(--ui-text-primary)] outline-none placeholder:text-[var(--ui-text-secondary)]"
            />
          </label>
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-20 flex items-end justify-between gap-3 sm:inset-x-7">
        <div className="relative">
          {focusMapOpen && (
            <div
              data-testid="monk-minimap"
              className="ui-surface absolute bottom-[calc(100%+0.5rem)] left-0 w-72 rounded-2xl border p-3 shadow-lg"
            >
              <div className="ui-eyebrow text-[var(--ui-info)]">Focus map</div>
              <div className="mt-2 truncate text-sm font-semibold text-[var(--ui-text-primary)]">
                {currentTask?.title || 'No active task'}
              </div>
              {nextTasks.length > 0 ? (
                <ol className="mt-2 space-y-1 text-xs text-[var(--ui-text-secondary)]">
                  {nextTasks.map((task, index) => (
                    <li key={task.id} className="truncate">
                      {index + 1}. {task.title || 'Untitled task'}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-xs text-[var(--ui-text-secondary)]">Nothing queued.</p>
              )}
            </div>
          )}
          <button
            type="button"
            aria-label={focusMapOpen ? 'Hide focus map' : 'Show focus map'}
            aria-expanded={focusMapOpen}
            onClick={() => setFocusMapOpen((open) => !open)}
            className="ui-control ui-focus-ring flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold"
          >
            <ListTree size={15} /> Queue
          </button>
        </div>
        <p className="max-w-[55%] truncate text-right text-xs italic text-[var(--ui-text-secondary)]">
          “{mantra}”
        </p>
      </div>
    </div>
  );
}
