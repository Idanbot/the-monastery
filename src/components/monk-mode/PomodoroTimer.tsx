import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function PomodoroTimer({
  onComplete,
  compact = false
}: {
  onComplete?: (minutes: number) => void;
  compact?: boolean;
}) {
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
    <div className="flex flex-col items-center justify-center">
      <div className={`ui-control flex gap-1 rounded-full p-1 ${compact ? 'mb-1' : 'mb-5'}`}>
        <button
          onClick={() => switchMode('work')}
          className={`ui-focus-ring rounded-full text-xs font-semibold transition-colors ${
            compact ? 'px-3 py-1' : 'px-4 py-1.5'
          } ${
            mode === 'work'
              ? 'bg-[var(--ui-surface-raised)] text-[var(--ui-info)] shadow-sm'
              : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`ui-focus-ring rounded-full text-xs font-semibold transition-colors ${
            compact ? 'px-3 py-1' : 'px-4 py-1.5'
          } ${
            mode === 'break'
              ? 'bg-[var(--ui-surface-raised)] text-[var(--ui-success)] shadow-sm'
              : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
          }`}
        >
          Break
        </button>
      </div>

      <div
        className={`font-mono font-semibold tabular-nums text-[var(--ui-text-primary)] ${
          compact ? 'mb-1 text-4xl' : 'mb-6 text-6xl sm:text-7xl'
        }`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTime(timeLeft)}
      </div>

      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'}`}>
        <button
          aria-label={isActive ? 'Pause focus timer' : 'Start focus timer'}
          onClick={toggleTimer}
          className={`ui-accent-button ui-focus-ring flex items-center justify-center rounded-full ${
            compact ? 'h-9 w-9' : 'h-14 w-14'
          }`}
        >
          {isActive ? (
            <Pause size={compact ? 18 : 24} fill="currentColor" />
          ) : (
            <Play size={compact ? 18 : 24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          aria-label="Reset focus timer"
          onClick={resetTimer}
          className={`ui-icon-button ui-control ${compact ? 'size-9' : ''}`}
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
