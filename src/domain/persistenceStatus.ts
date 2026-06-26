export type PersistenceStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'offline';

export const getPersistenceStatusPresentation = (status: PersistenceStatus, lastSavedAt: Date | null) => {
  const label =
    status === 'saving'
      ? 'Saving'
      : status === 'saved'
        ? 'Saved'
        : status === 'error'
          ? 'Save failed'
          : status === 'offline'
            ? 'Local mode'
            : 'Loading';

  const description =
    status === 'error'
      ? 'Sync failed. Your latest edits remain in this browser; export a backup if the issue persists.'
      : status === 'offline'
        ? 'Backend unavailable. Changes are stored locally on this device until sync is available.'
        : status === 'saving'
          ? 'Saving changes to the active profile.'
          : status === 'saved'
            ? 'All recent changes were persisted.'
            : 'Loading profile data.';

  const title = lastSavedAt ? description + ' Last saved ' + lastSavedAt.toLocaleTimeString() : description;
  const className =
    status === 'error'
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
      : status === 'saving' || status === 'loading'
        ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
        : status === 'offline'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';

  return { label, title, description, className };
};
