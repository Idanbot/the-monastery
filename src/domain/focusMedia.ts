export type FocusMediaSource =
  | { kind: 'youtube'; sourceUrl: string; videoId: string; embedUrl: string }
  | { kind: 'audio'; sourceUrl: string }
  | { kind: 'unsupported'; sourceUrl: string };

const youtubeVideoId = /^[A-Za-z0-9_-]{11}$/;
const directAudioExtension = /\.(?:aac|flac|m4a|mp3|oga|ogg|opus|wav)$/i;

const readYoutubeVideoId = (url: URL): string | null => {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let candidate = '';
  if (host === 'youtu.be') candidate = url.pathname.split('/').filter(Boolean)[0] || '';
  if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') candidate = url.searchParams.get('v') || '';
    else candidate = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || '';
  }
  return youtubeVideoId.test(candidate) ? candidate : null;
};

export const parseFocusMediaUrl = (value: string): FocusMediaSource => {
  const sourceUrl = value.trim();
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { kind: 'unsupported', sourceUrl };
    }
    const videoId = readYoutubeVideoId(url);
    if (videoId) {
      return {
        kind: 'youtube',
        sourceUrl,
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
      };
    }
    if (directAudioExtension.test(url.pathname)) return { kind: 'audio', sourceUrl };
  } catch {
    // Invalid URLs fall through to the unsupported result.
  }
  return { kind: 'unsupported', sourceUrl };
};
