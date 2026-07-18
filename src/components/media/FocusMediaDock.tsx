import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FocusReactPlayer as ReactPlayer } from './FocusReactPlayer';
import {
  ChevronDown,
  ExternalLink,
  Maximize2,
  Music2,
  Pause,
  Play,
  Square,
  Upload,
  Volume2,
  VolumeX
} from 'lucide-react';
import { parseFocusMediaUrl } from '../../domain/focusMedia';

type Props = {
  active: boolean;
  expanded: boolean;
  url: string;
  onChangeUrl: (url: string) => void;
  onExpand: () => void;
  onMinimize: () => void;
  onStop: () => void;
  dockTargetId?: string;
};

const validMediaTime = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const formatMediaTime = (seconds: number) => {
  const totalSeconds = Math.floor(validMediaTime(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
    : `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export function FocusMediaDock({
  active,
  expanded,
  url,
  onChangeUrl,
  onExpand,
  onMinimize,
  onStop,
  dockTargetId
}: Props) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const homeRef = useRef<HTMLSpanElement>(null);
  const [docked, setDocked] = useState(false);
  const [draftUrl, setDraftUrl] = useState(url);
  const [validationError, setValidationError] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const media = parseFocusMediaUrl(url);
  const playbackUrl =
    media.kind === 'youtube' ? media.embedUrl : media.kind === 'audio' ? media.sourceUrl : '';
  const playerLabel = media.kind === 'audio' ? 'Focus audio player' : 'Focus media video';

  useEffect(() => {
    setDraftUrl(url);
    setValidationError('');
    setPlaybackError('');
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  useLayoutEffect(() => {
    const dock = dockRef.current;
    const home = homeRef.current;
    if (!active || !dock || !home) return;
    const placeDock = () => {
      const target = !expanded && dockTargetId ? document.getElementById(dockTargetId) : null;
      if (target && dock.parentElement !== target) target.appendChild(dock);
      if (!target && home.isConnected && dock.previousSibling !== home) home.after(dock);
      setDocked((current) => (current === Boolean(target) ? current : Boolean(target)));
    };
    placeDock();
    const observer = new MutationObserver(placeDock);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (home.isConnected) home.after(dock);
    };
  }, [active, dockTargetId, expanded]);

  if (!active) return null;

  const loadMedia = () => {
    const next = parseFocusMediaUrl(draftUrl);
    if (next.kind === 'unsupported') {
      setValidationError('Use a YouTube link or a direct audio file URL.');
      return;
    }
    setValidationError('');
    setPlaybackError('');
    onChangeUrl(next.sourceUrl);
  };

  const seekTo = (nextTime: number) => {
    const boundedTime = Math.min(Math.max(validMediaTime(nextTime), 0), duration || 0);
    if (playerRef.current) playerRef.current.currentTime = boundedTime;
    setCurrentTime(boundedTime);
  };

  const updateVolume = (nextVolume: number) => {
    const boundedVolume = Math.min(Math.max(nextVolume, 0), 1);
    setVolume(boundedVolume);
    if (boundedVolume > 0) setMuted(false);
  };

  return (
    <>
      <span ref={homeRef} hidden aria-hidden="true" />
      <section
        ref={dockRef}
        data-testid="focus-media-dock"
        data-expanded={expanded ? 'true' : 'false'}
        data-docked={docked ? 'true' : 'false'}
        data-material="widget"
        aria-label="Focus media player"
        className={`z-[45] overflow-hidden rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 ${
          expanded
            ? 'fixed inset-x-2 bottom-20 max-h-[calc(100vh-6rem)] shadow-2xl md:bottom-4 md:left-auto md:right-4 md:w-[28rem]'
            : docked
              ? 'relative w-full shadow-sm'
              : 'fixed bottom-20 right-2 w-[calc(100vw-1rem)] max-w-sm shadow-2xl md:bottom-4 md:right-4'
        }`}
      >
        <header className="flex min-h-11 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-700">
          <Music2 size={17} className="shrink-0 text-indigo-500" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">Focus media</span>
          {expanded ? (
            <button
              type="button"
              aria-label="Minimize media player"
              title="Minimize"
              onClick={onMinimize}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronDown size={16} />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Expand media player"
              title="Expand"
              onClick={onExpand}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Maximize2 size={15} />
            </button>
          )}
          <button
            type="button"
            aria-label="Stop media"
            title="Stop and close"
            onClick={onStop}
            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
          >
            <Square size={14} />
          </button>
        </header>

        <div className={expanded ? 'block' : 'hidden'}>
          <div className="bg-black">
            {media.kind !== 'unsupported' ? (
              <div
                data-testid="focus-media-player"
                data-source={playbackUrl}
                title={playerLabel}
                aria-label={playerLabel}
                className={media.kind === 'youtube' ? 'aspect-video w-full' : 'p-4'}
              >
                <ReactPlayer
                  ref={playerRef}
                  src={playbackUrl}
                  controls
                  playing={playing}
                  volume={volume}
                  muted={muted}
                  playsInline
                  preload="metadata"
                  width="100%"
                  height={media.kind === 'youtube' ? '100%' : 54}
                  config={{
                    youtube: { rel: 0, referrerpolicy: 'strict-origin-when-cross-origin' }
                  }}
                  fallback={
                    <div
                      role="status"
                      className="grid h-full min-h-14 place-items-center text-sm text-slate-300"
                    >
                      Loading media...
                    </div>
                  }
                  onReady={() => setPlaybackError('')}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onTimeUpdate={(event) => setCurrentTime(validMediaTime(event.currentTarget.currentTime))}
                  onDurationChange={(event) => setDuration(validMediaTime(event.currentTarget.duration))}
                  onVolumeChange={(event) => {
                    setVolume(event.currentTarget.volume);
                    setMuted(event.currentTarget.muted);
                  }}
                  onError={() =>
                    setPlaybackError(
                      'This media could not be played here. Try another URL or open it at the source.'
                    )
                  }
                />
              </div>
            ) : (
              <div className="grid aspect-video place-items-center px-6 text-center text-sm text-slate-300">
                Load a YouTube link or direct audio file.
              </div>
            )}
          </div>

          <form
            className="space-y-2 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              loadMedia();
            }}
          >
            <label
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
              htmlFor="focus-media-url"
            >
              YouTube or audio URL
            </label>
            <div className="flex gap-2">
              <input
                id="focus-media-url"
                aria-label="Media URL"
                type="url"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                placeholder="https://youtu.be/..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="submit"
                aria-label="Load media"
                title="Load media"
                className="rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-700"
              >
                <Upload size={16} />
              </button>
            </div>
            {(validationError || playbackError) && (
              <p role="alert" className="text-xs text-rose-600">
                {validationError || playbackError}
              </p>
            )}
            {media.kind === 'youtube' && (
              <a
                href={media.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-300"
              >
                Open on YouTube <ExternalLink size={12} />
              </a>
            )}
          </form>
        </div>

        {!expanded && media.kind !== 'unsupported' && (
          <div
            data-testid="compact-media-controls"
            className="space-y-1.5 bg-slate-50/90 px-3 py-2.5 dark:bg-slate-950/70"
          >
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label={playing ? 'Pause media' : 'Play media'}
                title={playing ? 'Pause' : 'Play'}
                onClick={() => setPlaying((value) => !value)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
              </button>
              <div className="min-w-0 flex-1">
                <input
                  aria-label="Seek media"
                  aria-valuetext={`${formatMediaTime(currentTime)} of ${formatMediaTime(duration)}`}
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={Math.min(currentTime, duration || 0)}
                  disabled={duration <= 0}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  className="h-5 w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                />
                <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  <span>{`${formatMediaTime(currentTime)} / ${formatMediaTime(duration)}`}</span>
                  <span className="truncate pl-2">{media.kind === 'youtube' ? 'YouTube' : 'Audio'}</span>
                </div>
              </div>
            </div>
            <div className="flex min-h-9 items-center gap-2">
              <button
                type="button"
                aria-label={muted || volume === 0 ? 'Unmute media' : 'Mute media'}
                title={muted || volume === 0 ? 'Unmute' : 'Mute'}
                onClick={() => {
                  if (volume === 0) setVolume(1);
                  setMuted(volume > 0 && !muted);
                }}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                aria-label="Media volume"
                aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)} percent`}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(event) => updateVolume(Number(event.target.value))}
                className="h-5 min-w-0 flex-1 cursor-pointer accent-indigo-600"
              />
              <span className="w-9 text-right text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                {Math.round((muted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
