import type { Dispatch, SetStateAction } from 'react';
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
  const nextTasks = tasks
    .filter((task) => activeTaskStatuses.includes(task.status) && task.id !== currentTask?.id)
    .slice(0, 3);

  return (
    <div
      data-testid="monk-mode-view"
      className="flex-1 min-h-0 relative overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center"
    >
      {isEnteringMonkMode && settings.animationsEnabled !== false && (
        <OneBreath onComplete={onIntroComplete} />
      )}

      <div className="absolute top-0 left-0 right-0 p-5 md:p-8 flex items-center justify-between z-10 pointer-events-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Monk Mode</h2>
          {settings.monkModeOpenedAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Active for{' '}
              {(() => {
                const ms = now - new Date(settings.monkModeOpenedAt).getTime();
                const mins = Math.floor(ms / 60000);
                return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
              })()}
            </p>
          )}
        </div>
        <button
          onClick={onExit}
          className="pointer-events-auto px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
        >
          Exit
        </button>
      </div>

      <div className="w-full max-w-2xl px-6 flex flex-col items-center justify-center gap-12 z-10">
        <div className="w-full max-w-sm pointer-events-auto">
          <PomodoroTimer onComplete={onPomodoroComplete} />
        </div>

        <div className="w-full pointer-events-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {currentTask ? (
            <div className="flex flex-col items-center text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-3">
                Current Focus
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {currentTask.title || 'Untitled task'}
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {currentTask.activeLogStart
                  ? 'Started at ' +
                    new Date(currentTask.activeLogStart).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Not active (timer paused)'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                No active task
              </div>
              <button
                onClick={onAddTask}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Start Backlog Task
              </button>
            </div>
          )}
        </div>

        <label className="w-full pointer-events-auto rounded-2xl border border-slate-200 bg-white/55 p-4 text-left shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/55">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daily goal
          </span>
          <input
            value={settings.dailyGoal || ''}
            onChange={(event) => setSettings((prev) => ({ ...prev, dailyGoal: event.target.value }))}
            placeholder="One outcome for today"
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>
      </div>

      <div
        data-testid="monk-minimap"
        className="absolute bottom-8 left-6 z-10 flex max-w-[180px] flex-col gap-2 rounded-2xl border border-slate-200 bg-white/55 p-3 text-xs shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/55"
      >
        <span className="font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">
          Focus map
        </span>
        <span className="truncate text-slate-700 dark:text-slate-200">
          {currentTask?.title || 'No active task'}
        </span>
        {nextTasks.length > 0 && (
          <span className="truncate text-slate-500 dark:text-slate-400">
            Next: {nextTasks.map((task) => task.title).join(' · ')}
          </span>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center px-4 z-10 pointer-events-none">
        <p className="text-sm font-serif italic text-slate-400 dark:text-slate-500 tracking-wide">
          "{mantra}"
        </p>
      </div>
    </div>
  );
}
