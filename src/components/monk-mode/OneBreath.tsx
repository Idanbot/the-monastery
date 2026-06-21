import { useRef, useState } from 'react';
import { useSpring, animated, easings } from '@react-spring/web';

export function OneBreath({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'inhale-1' | 'inhale-2' | 'exhale' | 'done'>('inhale-1');
  const completedRef = useRef(false);

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  // Entrance fade-in for the overlay
  const overlaySpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: phase === 'done' ? 0 : 1 },
    config: { duration: 800, easing: easings.easeInOutSine },
    onRest: () => {
      if (phase === 'done') {
        onComplete();
      }
    }
  });

  // Breathing circle animation (Physiological sigh: long inhale, quick second inhale, long exhale)
  const circleSpring = useSpring({
    from: { scale: 0.5, opacity: 0.1 },
    to: {
      scale: phase === 'inhale-1' ? 1.3 : phase === 'inhale-2' ? 1.6 : phase === 'exhale' ? 0.5 : 0.5,
      opacity: phase === 'inhale-1' || phase === 'inhale-2' ? 0.8 : 0.1
    },
    config: {
      duration: phase === 'inhale-1' ? 2000 : phase === 'inhale-2' ? 500 : phase === 'exhale' ? 4000 : 500,
      easing: easings.easeInOutSine
    },
    onRest: () => {
      if (phase === 'inhale-1') {
        setPhase('inhale-2');
      } else if (phase === 'inhale-2') {
        setTimeout(() => setPhase('exhale'), 400); // Brief hold after second inhale
      } else if (phase === 'exhale') {
        setTimeout(() => setPhase('done'), 500); // Brief hold before completing
      }
    }
  });

  const textSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: {
      opacity: phase === 'done' ? 0 : 0.8,
      transform: phase === 'done' ? 'translateY(-10px)' : 'translateY(0px)'
    },
    config: { duration: 800, easing: easings.easeInOutSine }
  });

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale-1':
        return 'Inhale deep';
      case 'inhale-2':
        return 'One more sip';
      case 'exhale':
        return 'Long exhale';
      default:
        return '';
    }
  };

  return (
    <animated.div
      data-testid="one-breath"
      style={overlaySpring}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Skip breathing intro"
        onClick={() => {
          setPhase('done');
          complete();
        }}
        className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        Skip
      </button>
      <div className="relative flex items-center justify-center w-96 h-96">
        <animated.div
          style={{
            ...circleSpring,
            transform: circleSpring.scale.to((s: number) => `scale(${s})`)
          }}
          className="absolute w-48 h-48 rounded-full border border-indigo-400 dark:border-indigo-400/80 bg-indigo-200/40 dark:bg-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.3)]"
        />
        <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10" />
      </div>

      <animated.div style={textSpring} className="absolute mt-64 text-center">
        <h2 className="text-xl font-medium tracking-widest text-slate-800 dark:text-slate-200 uppercase transition-all duration-300">
          {getPhaseText()}
        </h2>
      </animated.div>
    </animated.div>
  );
}
