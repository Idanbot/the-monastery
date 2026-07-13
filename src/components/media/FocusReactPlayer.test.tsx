import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FocusReactPlayer } from './FocusReactPlayer';

describe('FocusReactPlayer', () => {
  it('recognizes YouTube and uses native media for allowed audio sources', () => {
    expect(FocusReactPlayer.canPlay?.('https://www.youtube-nocookie.com/embed/4e839orj52w?rel=0')).toBe(true);
    expect(FocusReactPlayer.canPlay?.('https://vimeo.com/123456')).toBe(false);

    const { container } = render(
      <FocusReactPlayer src="https://media.example/focus.mp3" controls preload="metadata" />
    );
    const audio = container.querySelector('audio');
    expect(audio).toHaveAttribute('src', 'https://media.example/focus.mp3');
    expect(audio).toHaveAttribute('controls');
  });
});
