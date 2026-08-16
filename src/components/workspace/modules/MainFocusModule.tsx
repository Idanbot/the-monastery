import { Target } from 'lucide-react';
import type { AppSettings, MainViewSlotId, Task } from '../../../domain/types';
import { CurrentTaskPin } from '../../CurrentTaskPin';
import { PomodoroTimer } from '../../monk-mode/PomodoroTimer';

export function MainFocusModule({
  slot,
  showCurrent,
  settings,
  now,
  currentTask,
  onOpenTask,
  onAddTask,
  onToggleTimer,
  onCompleteTask,
  onEnterMonkMode,
  onUpdateDailyGoal,
  onPomodoroComplete
}: {
  slot: MainViewSlotId;
  showCurrent: boolean;
  settings: AppSettings;
  now: number;
  currentTask: Task | null;
  onOpenTask: (taskId: string) => void;
  onAddTask: () => void;
  onToggleTimer: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onEnterMonkMode: () => void;
  onUpdateDailyGoal: (value: string) => void;
  onPomodoroComplete: (minutes: number) => void;
}) {
  return (
    <section
      data-testid="main-focus-module"
      data-slot={slot}
      data-emphasis="primary"
      data-material="panel"
      aria-label="Focus session"
      className="focus-module ui-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--ui-radius-panel)] border p-4 shadow-[var(--ui-shadow-md)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="ui-eyebrow text-[var(--ui-info)]">Focus session</div>
          <h3 className="mt-1 text-xl font-semibold text-[var(--ui-text-primary)]">
            One task, full attention
          </h3>
        </div>
        <button
          type="button"
          onClick={onEnterMonkMode}
          className="ui-control ui-focus-ring flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
        >
          <Target size={16} /> Immerse
        </button>
      </div>
      <div className={`mt-3 grid min-h-0 flex-1 gap-3 ${showCurrent ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="focus-timer-well custom-scrollbar min-h-0 overflow-y-auto rounded-[var(--ui-radius-control)] p-3">
          <PomodoroTimer compact onComplete={onPomodoroComplete} />
          <label className="mt-2 flex items-center gap-2 border-t border-[var(--ui-border-subtle)] pt-2">
            <span className="ui-eyebrow shrink-0">Goal</span>
            <input
              value={settings.dailyGoal || ''}
              onChange={(event) => onUpdateDailyGoal(event.target.value)}
              placeholder="One outcome for today"
              aria-label="One outcome for today"
              className="min-w-0 flex-1 bg-transparent text-right text-xs font-medium outline-none"
            />
          </label>
        </div>
        {showCurrent && (
          <div className="custom-scrollbar min-h-0 overflow-y-auto">
            <CurrentTaskPin
              task={currentTask}
              now={now}
              onOpen={onOpenTask}
              onAdd={onAddTask}
              onToggleTimer={onToggleTimer}
              onComplete={onCompleteTask}
            />
          </div>
        )}
      </div>
    </section>
  );
}
