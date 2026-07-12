import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FocusMediaDock } from './FocusMediaDock';

const youtubeUrl = 'https://youtu.be/4e839orj52w';

describe('FocusMediaDock', () => {
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

    expect(screen.getByTitle('Focus media video')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/4e839orj52w?rel=0'
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
    expect(screen.getByLabelText('Focus audio player')).toHaveAttribute(
      'src',
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
    const frame = screen.getByTitle('Focus media video');
    await user.click(screen.getByRole('button', { name: 'Minimize media player' }));
    expect(screen.getByTitle('Focus media video')).toBe(frame);
    expect(screen.getByTestId('focus-media-dock')).toHaveAttribute('data-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Stop media' }));
    expect(screen.queryByTestId('focus-media-dock')).not.toBeInTheDocument();
  });
});
