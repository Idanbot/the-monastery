import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react';

const normalizeTime = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

type MediaPlaybackContextValue = {
  playerRef: RefObject<HTMLVideoElement | null>;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  resetPlayback: () => void;
};

const MediaPlaybackContext = createContext<MediaPlaybackContextValue | null>(null);

export function MediaPlaybackProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  const setCurrentTime = useCallback((time: number) => setCurrentTimeState(normalizeTime(time)), []);
  const setDuration = useCallback((nextDuration: number) => {
    setDurationState(normalizeTime(nextDuration));
  }, []);
  const seekTo = useCallback(
    (time: number) => {
      const elementDuration = normalizeTime(playerRef.current?.duration || 0);
      const maximum = elementDuration || duration;
      const nextTime = Math.min(normalizeTime(time), maximum || 0);
      if (playerRef.current) playerRef.current.currentTime = nextTime;
      setCurrentTimeState(nextTime);
    },
    [duration]
  );
  const setVolume = useCallback((nextVolume: number) => {
    const boundedVolume = Math.min(Math.max(Number.isFinite(nextVolume) ? nextVolume : 0, 0), 1);
    setVolumeState(boundedVolume);
    if (boundedVolume > 0) setMuted(false);
  }, []);
  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      if (volume === 0) {
        setVolumeState(1);
        return false;
      }
      return !current;
    });
  }, [volume]);
  const resetPlayback = useCallback(() => {
    setPlaying(false);
    setCurrentTimeState(0);
    setDurationState(0);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const syncPosition = () => {
      const player = playerRef.current;
      if (!player) return;
      setCurrentTimeState(normalizeTime(player.currentTime));
      const nextDuration = normalizeTime(player.duration);
      if (nextDuration > 0) setDurationState(nextDuration);
    };
    syncPosition();
    const timer = window.setInterval(syncPosition, 500);
    return () => window.clearInterval(timer);
  }, [playing]);

  const value = useMemo<MediaPlaybackContextValue>(
    () => ({
      playerRef,
      playing,
      currentTime,
      duration,
      volume,
      muted,
      setPlaying,
      setCurrentTime,
      setDuration,
      seekTo,
      setVolume,
      setMuted,
      toggleMuted,
      resetPlayback
    }),
    [
      playing,
      currentTime,
      duration,
      volume,
      muted,
      setCurrentTime,
      setDuration,
      seekTo,
      setVolume,
      toggleMuted,
      resetPlayback
    ]
  );

  return <MediaPlaybackContext.Provider value={value}>{children}</MediaPlaybackContext.Provider>;
}

export function useMediaPlayback() {
  const context = useContext(MediaPlaybackContext);
  if (!context) throw new Error('useMediaPlayback must be used within a MediaPlaybackProvider');
  return context;
}
