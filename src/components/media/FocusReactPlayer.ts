import { lazy } from 'react';
import HtmlPlayer from 'react-player/HtmlPlayer';
import { createReactPlayer } from 'react-player/ReactPlayer';
import type { PlayerEntry } from 'react-player/players';

const youtubeUrlPattern =
  /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;

const youtubePlayer: PlayerEntry = {
  key: 'youtube',
  name: 'YouTube',
  canPlay: (src) => youtubeUrlPattern.test(src),
  player: lazy(() => import('youtube-video-element/react')) as NonNullable<PlayerEntry['player']>
};

const htmlPlayer: PlayerEntry = {
  key: 'html',
  name: 'HTML media',
  canPlay: () => true,
  canEnablePIP: () => true,
  player: HtmlPlayer
};

// Keep ReactPlayer's normalized API while excluding providers our URL allowlist rejects.
export const FocusReactPlayer = createReactPlayer([youtubePlayer], htmlPlayer);
