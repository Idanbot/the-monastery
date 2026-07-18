import { Maximize2, Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { useMediaPlayback } from '../../../contexts/MediaPlaybackContext';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useUIContext } from '../../../contexts/UIContext';
import { SettingSection } from '../SettingSection';
import type { RegisteredSectionProps } from './types';

export default function MediaRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  const { isMediaPlayerActive, activateMediaPlayer, openMediaPlayer, stopMediaPlayer } = useUIContext();
  const {
    playing,
    currentTime,
    duration,
    volume,
    muted,
    setPlaying,
    seekTo,
    setVolume,
    toggleMuted,
    resetPlayback
  } = useMediaPlayback();

  const togglePlayback = () => {
    if (!isMediaPlayerActive) activateMediaPlayer();
    setPlaying(!playing);
  };
  const stopPlayback = () => {
    resetPlayback();
    stopMediaPlayer();
  };

  return (
    <SettingSection id="media" title="Media" {...props}>
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--ui-text-primary)]">
        Focus media URL
        <input
          aria-label="Focus media URL"
          type="url"
          value={settings.focusMediaUrl}
          onChange={(event) => {
            const focusMediaUrl = event.currentTarget.value;
            setSettings((previous) => ({ ...previous, focusMediaUrl }));
          }}
          placeholder="https://youtu.be/..."
          className="ui-control w-full rounded-lg border px-3 py-2 outline-none focus:border-[var(--ui-focus-ring)]"
        />
      </label>

      <div className="ui-control space-y-3 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={playing ? 'Pause media' : 'Play media'}
            onClick={togglePlayback}
            className="ui-icon-button size-10 bg-[var(--ui-info)] text-white"
          >
            {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          </button>
          <button
            type="button"
            aria-label={muted || volume === 0 ? 'Unmute media' : 'Mute media'}
            onClick={toggleMuted}
            className="ui-icon-button size-10"
          >
            {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            type="button"
            aria-label="Open media player"
            onClick={openMediaPlayer}
            className="ui-icon-button size-10"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            aria-label="Stop media"
            disabled={!isMediaPlayerActive}
            onClick={stopPlayback}
            className="ui-icon-button size-10 disabled:opacity-40"
          >
            <Square size={15} />
          </button>
        </div>

        <label className="flex flex-col gap-1 text-xs text-[var(--ui-text-secondary)]">
          Seek
          <input
            aria-label="Settings media seek"
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            disabled={duration <= 0}
            onChange={(event) => seekTo(Number(event.target.value))}
            className="h-6 w-full accent-[var(--ui-info)] disabled:opacity-40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--ui-text-secondary)]">
          Volume {Math.round((muted ? 0 : volume) * 100)}%
          <input
            aria-label="Settings media volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-6 w-full accent-[var(--ui-info)]"
          />
        </label>
      </div>
    </SettingSection>
  );
}
