import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type BreathPhase = 'inhale-1' | 'inhale-2' | 'exhale' | 'done';

const phaseDuration: Record<Exclude<BreathPhase, 'done'>, number> = {
  'inhale-1': 2000,
  'inhale-2': 900,
  exhale: 4500
};

const nextPhase: Record<Exclude<BreathPhase, 'done'>, BreathPhase> = {
  'inhale-1': 'inhale-2',
  'inhale-2': 'exhale',
  exhale: 'done'
};

const phaseText: Record<BreathPhase, string> = {
  'inhale-1': 'Inhale deep',
  'inhale-2': 'One more sip',
  exhale: 'Long exhale',
  done: ''
};

export function OneBreath({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<BreathPhase>('inhale-1');
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (shouldReduceMotion || phase === 'done') {
      complete();
      return undefined;
    }

    const timeout = window.setTimeout(() => setPhase(nextPhase[phase]), phaseDuration[phase]);
    return () => window.clearTimeout(timeout);
  }, [complete, phase, shouldReduceMotion]);

  const scale = phase === 'inhale-1' ? 1.3 : phase === 'inhale-2' ? 1.6 : 0.5;
  const circleOpacity = phase === 'inhale-1' || phase === 'inhale-2' ? 0.82 : 0.12;
  const duration = phase === 'done' ? 0.3 : phaseDuration[phase] / 1000;

  return (
    <motion.div
      data-testid="one-breath"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'done' ? 0 : 1 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--ui-canvas)_82%,transparent)] backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="Skip breathing intro"
        onClick={() => {
          setPhase('done');
          complete();
        }}
        className="ui-control ui-focus-ring absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-semibold"
      >
        Skip
      </button>

      <div className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
        <motion.div
          initial={{ scale: 0.5, opacity: 0.1 }}
          animate={{ scale, opacity: circleOpacity }}
          transition={{ duration, ease: 'easeInOut' }}
          className="absolute h-44 w-44 rounded-full border border-[color-mix(in_srgb,var(--ui-info)_55%,transparent)] bg-[color-mix(in_srgb,var(--ui-info)_14%,transparent)] shadow-[0_0_70px_color-mix(in_srgb,var(--ui-info)_24%,transparent)] sm:h-48 sm:w-48"
        />
        <div className="z-10 h-3 w-3 rounded-full bg-[var(--ui-info)] shadow-[0_0_18px_color-mix(in_srgb,var(--ui-info)_46%,transparent)]" />
      </div>

      <motion.h2
        key={phase}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: phase === 'done' ? 0 : 0.84, y: phase === 'done' ? -8 : 0 }}
        className="absolute mt-64 text-center text-lg font-medium text-[var(--ui-text-primary)]"
      >
        {phaseText[phase]}
      </motion.h2>
    </motion.div>
  );
}
