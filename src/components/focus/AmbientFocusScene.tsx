import { animated, useSpring } from '@react-spring/web';
import { Canvas } from '@react-three/fiber';

const isJsdom = () => typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');

function FocusOrb() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1.35, 32, 32]} />
      <meshStandardMaterial color="#a7f3d0" roughness={0.18} metalness={0.08} />
    </mesh>
  );
}

export function AmbientFocusScene({ enabled = true }: { enabled?: boolean }) {
  const spring = useSpring({
    from: { opacity: 0.72, transform: 'scale(0.985)' },
    to: { opacity: 1, transform: 'scale(1)' },
    loop: enabled ? { reverse: true } : false,
    immediate: !enabled,
    config: { tension: 55, friction: 26 }
  });
  const renderCanvas = enabled && !isJsdom();

  return (
    <animated.div
      data-testid="spring-focus-scene"
      style={spring}
      className="relative h-28 overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-slate-950 dark:to-sky-950/30"
    >
      {renderCanvas ? (
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} data-testid="three-focus-canvas">
          <ambientLight intensity={1.2} />
          <pointLight position={[3, 3, 4]} intensity={2.1} />
          <FocusOrb />
        </Canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center" data-testid="three-focus-fallback">
          <div className="h-14 w-14 rounded-full bg-emerald-300/50 blur-sm shadow-[0_0_48px_rgba(16,185,129,0.45)]" />
        </div>
      )}
      <div className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-200/80">
        Focus field
      </div>
    </animated.div>
  );
}
