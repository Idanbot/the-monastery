import { Download, RotateCcw, Trash2, Upload, UserPlus } from 'lucide-react';
import { useProfileContext } from '../../../contexts/ProfileContext';
import { SettingSection } from '../SettingSection';
import { SettingsSelect } from '../SettingsSelect';
import type { RegisteredSectionProps } from './types';

export default function ProfilesRegisteredSection(props: RegisteredSectionProps) {
  const {
    isBackendAvailable,
    profiles,
    activeProfileId,
    selectProfile,
    newProfileName,
    setNewProfileName,
    createProfile,
    setProfileAction,
    profileError,
    exportActiveProfile,
    importProfileInputRef,
    importActiveProfile
  } = useProfileContext();
  const requestProfileAction = (action: 'reset' | 'remove') => {
    props.onClose?.();
    setProfileAction(action);
  };

  return (
    <SettingSection id="profiles" title="Profiles" {...props}>
      {isBackendAvailable ? (
        <div className="space-y-3">
          <SettingsSelect
            ariaLabel="Active profile"
            value={activeProfileId}
            onValueChange={selectProfile}
            options={profiles.map((profile) => ({
              id: profile.id,
              label: `${profile.name} (${profile.taskCount ?? 0})`
            }))}
          />
          <div className="flex gap-2">
            <input
              aria-label="New profile name"
              value={newProfileName}
              onChange={(event) => setNewProfileName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  createProfile();
                }
              }}
              placeholder="New profile name"
              className="ui-input min-w-0 flex-1 px-3 py-2 text-sm"
            />
            <button type="button" onClick={createProfile} className="ui-accent-button px-3 py-2 text-sm">
              <UserPlus size={14} /> Create
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={exportActiveProfile}
              className="ui-secondary-button px-3 py-2 text-sm"
            >
              <Download size={14} /> Export profile
            </button>
            <button
              type="button"
              onClick={() => importProfileInputRef.current?.click()}
              className="ui-secondary-button px-3 py-2 text-sm"
            >
              <Upload size={14} /> Import profile
            </button>
          </div>
          <input
            ref={importProfileInputRef}
            data-testid="profile-import-input"
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => importActiveProfile(event.target.files?.[0])}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => requestProfileAction('reset')}
              className="ui-secondary-button px-3 py-2 text-sm"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={() => requestProfileAction('remove')}
              disabled={profiles.length <= 1}
              className="ui-secondary-button px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
          {profileError && <p className="text-xs text-rose-500">{profileError}</p>}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Server sync is unavailable. This browser is using local fallback storage.
        </p>
      )}
    </SettingSection>
  );
}
