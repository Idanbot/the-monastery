import { useEffect, useState } from 'react';
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
  const [error, setError] = useState('');
  const media = parseFocusMediaUrl(url);

  useEffect(() => setDraftUrl(url), [url]);

  if (!active) return null;

  const loadMedia = () => {
    const next = parseFocusMediaUrl(draftUrl);
    if (next.kind === 'unsupported') {
      setError('Use a YouTube link or a direct audio file URL.');
      return;
    }
    setError('');
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
          {media.kind === 'youtube' && (
            <iframe
              title="Focus media video"
              src={media.embedUrl}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          {media.kind === 'audio' && (
            <div className="p-4">
              <audio
                aria-label="Focus audio player"
                src={media.sourceUrl}
                controls
                preload="metadata"
                className="w-full"
              />
            </div>
          )}
          {media.kind === 'unsupported' && (
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
          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
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
