import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaPlaybackProvider, useMediaPlayback } from './MediaPlaybackContext';

function PlaybackProbe() {
  const { playerRef, currentTime, volume, muted, setPlaying, seekTo, toggleMuted, setVolume } =
    useMediaPlayback();
  return (
    <div>
      <video ref={playerRef} data-testid="media-element" />
      <output data-testid="media-time">{currentTime}</output>
      <output data-testid="media-volume">{volume}</output>
      <output data-testid="media-muted">{String(muted)}</output>
      <button type="button" onClick={() => setPlaying(true)}>
        Play
      </button>
      <button type="button" onClick={() => seekTo(45)}>
        Seek
      </button>
      <button type="button" onClick={toggleMuted}>
        Mute
      </button>
      <button type="button" onClick={() => setVolume(0.4)}>
        Volume
      </button>
    </div>
  );
}

describe('MediaPlaybackContext', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps controls and the background seek clock synchronized with one media element', () => {
    vi.useFakeTimers();
    render(
      <MediaPlaybackProvider>
        <PlaybackProbe />
      </MediaPlaybackProvider>
    );

    const media = screen.getByTestId('media-element') as HTMLVideoElement;
    Object.defineProperty(media, 'duration', { configurable: true, value: 120 });
    Object.defineProperty(media, 'currentTime', { configurable: true, value: 20, writable: true });

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByTestId('media-time')).toHaveTextContent('20');

    fireEvent.click(screen.getByRole('button', { name: 'Seek' }));
    expect(media.currentTime).toBe(45);
    expect(screen.getByTestId('media-time')).toHaveTextContent('45');

    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(screen.getByTestId('media-muted')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: 'Volume' }));
    expect(screen.getByTestId('media-volume')).toHaveTextContent('0.4');
    expect(screen.getByTestId('media-muted')).toHaveTextContent('false');
  });
});
