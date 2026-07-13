import { useEffect, useState } from 'react';
import { FocusReactPlayer as ReactPlayer } from './FocusReactPlayer';
import { ChevronDown, ExternalLink, Maximize2, Music2, Square, Upload } from 'lucide-react';
import { parseFocusMediaUrl } from '../../domain/focusMedia';

type Props = {
  active: boolean;
  expanded: boolean;
  url: string;
  onChangeUrl: (url: string) => void;
  onExpand: () => void;
  onMinimize: () => void;
  onStop: () => void;
};

export function FocusMediaDock({ active, expanded, url, onChangeUrl, onExpand, onMinimize, onStop }: Props) {
  const [draftUrl, setDraftUrl] = useState(url);
  const [validationError, setValidationError] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const media = parseFocusMediaUrl(url);
  const playbackUrl =
    media.kind === 'youtube' ? media.embedUrl : media.kind === 'audio' ? media.sourceUrl : '';
  const playerLabel = media.kind === 'audio' ? 'Focus audio player' : 'Focus media video';

  useEffect(() => {
    setDraftUrl(url);
    setValidationError('');
    setPlaybackError('');
  }, [url]);

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

  return (
    <section
      data-testid="focus-media-dock"
      data-expanded={expanded ? 'true' : 'false'}
      data-material="widget"
      aria-label="Focus media player"
      className={`fixed z-[45] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 ${
        expanded
          ? 'inset-x-2 bottom-20 max-h-[calc(100vh-6rem)] md:bottom-4 md:left-auto md:right-4 md:w-[28rem]'
          : 'bottom-20 right-2 w-56 md:bottom-4 md:right-4'
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
                src={playbackUrl}
                controls
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
    </section>
  );
}
