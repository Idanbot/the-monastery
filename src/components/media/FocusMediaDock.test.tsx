import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef, useState, type ReactEventHandler } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaPlaybackProvider, useMediaPlayback } from '../../contexts/MediaPlaybackContext';
import { FocusMediaDock } from './FocusMediaDock';

const youtubeUrl = 'https://youtu.be/4e839orj52w';

type MockPlayerProps = {
  src?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: string;
  playing?: boolean;
  volume?: number;
  muted?: boolean;
  onError?: () => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: ReactEventHandler<HTMLVideoElement>;
  onDurationChange?: ReactEventHandler<HTMLVideoElement>;
};

const playerPropsSpy = vi.hoisted(() => vi.fn());

vi.mock('./FocusReactPlayer', () => ({
  FocusReactPlayer: forwardRef<HTMLVideoElement, MockPlayerProps>((props, ref) => {
    playerPropsSpy(props);
    return (
      <video
        ref={ref}
        data-testid="react-player"
        data-source={props.src}
        onPlay={props.onPlay}
        onPause={props.onPause}
        onTimeUpdate={props.onTimeUpdate}
        onDurationChange={props.onDurationChange}
      />
    );
  })
}));

describe('FocusMediaDock', () => {
  beforeEach(() => playerPropsSpy.mockClear());
  it('loads and persists a YouTube or direct-audio source', async () => {
    const user = userEvent.setup();
    const onChangeUrl = vi.fn();
    const { rerender } = render(
      <FocusMediaDock
        active
        expanded
        url={youtubeUrl}
        onChangeUrl={onChangeUrl}
        onExpand={vi.fn()}
        onMinimize={vi.fn()}
        onStop={vi.fn()}
      />,
      { wrapper: MediaPlaybackProvider }
    );

    expect(screen.getByTestId('react-player')).toHaveAttribute(
      'data-source',
      'https://www.youtube-nocookie.com/embed/4e839orj52w?rel=0'
    );
    expect(playerPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ controls: true, playsInline: true, preload: 'metadata' })
    );

    await user.clear(screen.getByLabelText('Media URL'));
    await user.type(screen.getByLabelText('Media URL'), 'https://media.example/focus.mp3');
    await user.click(screen.getByRole('button', { name: 'Load media' }));
    expect(onChangeUrl).toHaveBeenCalledWith('https://media.example/focus.mp3');

    rerender(
      <FocusMediaDock
        active
        expanded
        url="https://media.example/focus.mp3"
        onChangeUrl={onChangeUrl}
        onExpand={vi.fn()}
        onMinimize={vi.fn()}
        onStop={vi.fn()}
      />
    );
    expect(screen.getByTestId('react-player')).toHaveAttribute(
      'data-source',
      'https://media.example/focus.mp3'
    );
  });

  it('keeps the media mounted while minimized and unmounts it only when stopped', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [active, setActive] = useState(true);
      const [expanded, setExpanded] = useState(true);
      return (
        <FocusMediaDock
          active={active}
          expanded={expanded}
          url={youtubeUrl}
          onChangeUrl={vi.fn()}
          onExpand={() => setExpanded(true)}
          onMinimize={() => setExpanded(false)}
          onStop={() => setActive(false)}
        />
      );
    };

    render(<Harness />, { wrapper: MediaPlaybackProvider });
    const player = screen.getByTestId('react-player');
    await user.click(screen.getByRole('button', { name: 'Minimize media player' }));
    expect(screen.getByTestId('react-player')).toBe(player);
    expect(screen.getByTestId('focus-media-dock')).toHaveAttribute('data-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Stop media' }));
    expect(screen.queryByTestId('focus-media-dock')).not.toBeInTheDocument();
  });

  it('honors a play command that activates the player from an external control', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [active, setActive] = useState(false);
      const { playing, setPlaying } = useMediaPlayback();
      return (
        <>
          <output data-testid="external-playback-state">{String(playing)}</output>
          <button
            type="button"
            onClick={() => {
              setPlaying(true);
              setActive(true);
            }}
          >
            Play from settings
          </button>
          <FocusMediaDock
            active={active}
            expanded={false}
            url={youtubeUrl}
            onChangeUrl={vi.fn()}
            onExpand={vi.fn()}
            onMinimize={vi.fn()}
            onStop={() => setActive(false)}
          />
        </>
      );
    };

    render(<Harness />, { wrapper: MediaPlaybackProvider });
    await user.click(screen.getByRole('button', { name: 'Play from settings' }));

    expect(screen.getByTestId('external-playback-state')).toHaveTextContent('true');
    expect(playerPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ playing: true }));
  });

  it('keeps seek, playback, and volume controls usable while minimized', async () => {
    const user = userEvent.setup();
    render(
      <FocusMediaDock
        active
        expanded={false}
        url={youtubeUrl}
        onChangeUrl={vi.fn()}
        onExpand={vi.fn()}
        onMinimize={vi.fn()}
        onStop={vi.fn()}
      />,
      { wrapper: MediaPlaybackProvider }
    );

    const player = screen.getByTestId('react-player') as HTMLVideoElement;
    Object.defineProperty(player, 'duration', { configurable: true, value: 240 });
    Object.defineProperty(player, 'currentTime', { configurable: true, value: 30, writable: true });
    fireEvent.durationChange(player);
    fireEvent.timeUpdate(player);

    const seek = screen.getByRole('slider', { name: 'Seek media' });
    expect(seek).toHaveValue('30');
    expect(seek).toHaveAttribute('max', '240');
    expect(screen.getByText('0:30 / 4:00')).toBeInTheDocument();

    fireEvent.change(seek, { target: { value: '90' } });
    expect(player.currentTime).toBe(90);

    await user.click(screen.getByRole('button', { name: 'Play media' }));
    expect(playerPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ playing: true }));

    fireEvent.change(screen.getByRole('slider', { name: 'Media volume' }), {
      target: { value: '0.4' }
    });
    expect(playerPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ volume: 0.4 }));

    await user.click(screen.getByRole('button', { name: 'Mute media' }));
    expect(playerPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ muted: true }));
    expect(screen.getByRole('slider', { name: 'Media volume' })).toHaveValue('0');
    await user.click(screen.getByRole('button', { name: 'Unmute media' }));
    expect(playerPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ muted: false }));
    expect(screen.getByRole('slider', { name: 'Media volume' })).toHaveValue('0.4');
  });

  it('keeps the playback engine stable while minimized controls follow the active workspace host', async () => {
    const host = document.createElement('div');
    host.id = 'workspace-media-host';
    document.body.appendChild(host);

    render(
      <FocusMediaDock
        active
        expanded={false}
        dockTargetId="workspace-media-host"
        url={youtubeUrl}
        onChangeUrl={vi.fn()}
        onExpand={vi.fn()}
        onMinimize={vi.fn()}
        onStop={vi.fn()}
      />,
      { wrapper: MediaPlaybackProvider }
    );

    const dock = await screen.findByTestId('focus-media-dock');
    const player = screen.getByTestId('react-player');
    const controls = screen.getByTestId('compact-media-controls');
    expect(dock).toHaveAttribute('data-docked', 'true');
    expect(host).toContainElement(controls);
    expect(host).not.toContainElement(player);
    expect(player.isConnected).toBe(true);

    const replacement = document.createElement('div');
    replacement.id = host.id;
    host.replaceWith(replacement);
    await waitFor(() => expect(replacement).toContainElement(screen.getByTestId('compact-media-controls')));
    expect(screen.getByTestId('react-player')).toBe(player);
    expect(player.isConnected).toBe(true);
    replacement.remove();
  });

  it('surfaces player failures and clears them once media is ready', () => {
    render(
      <FocusMediaDock
        active
        expanded
        url={youtubeUrl}
        onChangeUrl={vi.fn()}
        onExpand={vi.fn()}
        onMinimize={vi.fn()}
        onStop={vi.fn()}
      />,
      { wrapper: MediaPlaybackProvider }
    );

    act(() => (playerPropsSpy.mock.lastCall?.[0] as MockPlayerProps).onError?.());
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be played/i);

    act(() => (playerPropsSpy.mock.lastCall?.[0] as MockPlayerProps).onReady?.());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
