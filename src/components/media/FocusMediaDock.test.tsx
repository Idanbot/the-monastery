import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusMediaDock } from './FocusMediaDock';

const youtubeUrl = 'https://youtu.be/4e839orj52w';

type MockPlayerProps = {
  src?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: string;
  onError?: () => void;
  onReady?: () => void;
};

const playerPropsSpy = vi.hoisted(() => vi.fn());

vi.mock('./FocusReactPlayer', () => ({
  FocusReactPlayer: (props: MockPlayerProps) => {
    playerPropsSpy(props);
    return <div data-testid="react-player" data-source={props.src} />;
  }
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
      />
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

    render(<Harness />);
    const player = screen.getByTestId('react-player');
    await user.click(screen.getByRole('button', { name: 'Minimize media player' }));
    expect(screen.getByTestId('react-player')).toBe(player);
    expect(screen.getByTestId('focus-media-dock')).toHaveAttribute('data-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Stop media' }));
    expect(screen.queryByTestId('focus-media-dock')).not.toBeInTheDocument();
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
      />
    );

    act(() => (playerPropsSpy.mock.lastCall?.[0] as MockPlayerProps).onError?.());
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be played/i);

    act(() => (playerPropsSpy.mock.lastCall?.[0] as MockPlayerProps).onReady?.());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
