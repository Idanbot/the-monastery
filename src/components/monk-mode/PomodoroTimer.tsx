import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function PomodoroTimer({ onComplete }: { onComplete?: (minutes: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'work') {
        if (onComplete) onComplete(25);
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex gap-2 mb-6 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full">
        <button
          onClick={() => switchMode('work')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
            mode === 'work'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
            mode === 'break'
              ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Break
        </button>
      </div>

      <div
        className="text-7xl md:text-8xl font-mono font-bold text-slate-800 dark:text-slate-100 mb-8 tabular-nums tracking-tighter"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTimer}
          className={`flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            mode === 'work'
              ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25'
              : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
          }`}
        >
          {isActive ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={resetTimer}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
