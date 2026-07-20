import { Flame } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type RendererStatus = 'loading' | 'ready' | 'error' | 'reduced-motion';

export function MajesticFlame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
  const [status, setStatus] = useState<RendererStatus>(reducedMotion ? 'reduced-motion' : 'loading');

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.WebGLRenderingContext && !window.WebGL2RenderingContext) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    let dispose: (() => void) | undefined;

    import('./majesticFlameRenderer')
      .then(({ mountMajesticFlame }) => {
        if (cancelled) return;
        const controller = mountMajesticFlame(canvas, {
          onReady: () => {
            if (!cancelled) setStatus('ready');
          }
        });
        dispose = controller.dispose;
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reducedMotion]);

  const showFallback = status !== 'ready';

  return (
    <span
      data-testid="streak-flame"
      data-animated="true"
      data-renderer={status}
      aria-hidden="true"
      className="relative inline-grid size-7 shrink-0 place-items-center"
    >
      <canvas
        ref={canvasRef}
        data-testid="streak-flame-canvas"
        aria-hidden="true"
        width="56"
        height="56"
        className={`pointer-events-none absolute inset-0 size-full transition-opacity ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {showFallback && (
        <Flame data-testid="streak-flame-fallback" size={14} className="text-amber-500" fill="currentColor" />
      )}
    </span>
  );
}
