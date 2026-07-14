import React from 'react';
import { useProfileContext } from '../../contexts/ProfileContext';
import { ThemedSurface } from '../ui/ThemedSurface';
import { toast } from 'sonner';

export const ProfileImportDialog: React.FC = () => {
  const { profileImportPreview, setProfileImportPreview, confirmProfileImport } = useProfileContext();

  if (!profileImportPreview) return null;

  const handleConfirmProfileImport = () => {
    confirmProfileImport();
    toast.success('Profile restored.');
  };

  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setProfileImportPreview(null);
      }}
    >
      <ThemedSurface
        variant="modal"
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore profile?</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {profileImportPreview.name} has {profileImportPreview.tasks.length} tasks. Current profile has{' '}
            {profileImportPreview.currentTaskCount} tasks.
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            <div className="text-xs text-slate-400">Current</div>
            <div className="font-mono text-lg">{profileImportPreview.currentTaskCount}</div>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            <div className="text-xs text-slate-400">Imported</div>
            <div className="font-mono text-lg">{profileImportPreview.tasks.length}</div>
          </div>
        </div>
        <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setProfileImportPreview(null)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmProfileImport}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Restore profile
          </button>
        </div>
      </ThemedSurface>
    </ThemedSurface>
  );
};
