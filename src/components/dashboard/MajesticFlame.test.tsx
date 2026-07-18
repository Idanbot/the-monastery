import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MajesticFlame } from './MajesticFlame';

const renderer = vi.hoisted(() => ({
  dispose: vi.fn(),
  mount: vi.fn((_canvas: HTMLCanvasElement, options: { onReady: () => void }) => {
    options.onReady();
    return { dispose: renderer.dispose };
  })
}));

vi.mock('./majesticFlameRenderer', () => ({ mountMajesticFlame: renderer.mount }));

describe('MajesticFlame', () => {
  beforeEach(() => {
    vi.stubGlobal('WebGLRenderingContext', class WebGLRenderingContextMock {});
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  afterEach(() => {
    cleanup();
    renderer.dispose.mockClear();
    renderer.mount.mockClear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lazily starts and disposes its transparent Three.js renderer', async () => {
    const { unmount } = render(<MajesticFlame />);

    expect(screen.getByTestId('streak-flame-canvas')).toHaveAttribute('aria-hidden', 'true');
    await waitFor(() => expect(renderer.mount).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('streak-flame')).toHaveAttribute('data-renderer', 'ready');

    unmount();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });

  it('uses a static accessible fallback when reduced motion is requested', async () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    render(<MajesticFlame />);

    expect(screen.getByTestId('streak-flame')).toHaveAttribute('data-renderer', 'reduced-motion');
    expect(screen.getByTestId('streak-flame-fallback')).toBeInTheDocument();
    await Promise.resolve();
    expect(renderer.mount).not.toHaveBeenCalled();
  });

  it('keeps the static fallback when WebGL is unavailable', async () => {
    vi.stubGlobal('WebGLRenderingContext', undefined);
    vi.stubGlobal('WebGL2RenderingContext', undefined);

    render(<MajesticFlame />);

    await waitFor(() => expect(screen.getByTestId('streak-flame')).toHaveAttribute('data-renderer', 'error'));
    expect(renderer.mount).not.toHaveBeenCalled();
  });
});
