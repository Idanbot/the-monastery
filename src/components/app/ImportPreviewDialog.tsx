import React from 'react';
import { useProfileContext } from '../../contexts/ProfileContext';
import { ThemedSurface } from '../ui/ThemedSurface';

export const ImportPreviewDialog: React.FC = () => {
  const { importPreview, setImportPreview, confirmImportTasks } = useProfileContext();

  if (!importPreview) return null;

  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setImportPreview(null);
      }}
    >
      <ThemedSurface
        variant="modal"
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Import preview</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Matching task IDs will be updated, new IDs will be added, and all other current tasks stay
            in place.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-mono font-bold text-emerald-600">
                {importPreview.newTasks.length}
              </div>
              <div className="text-xs text-slate-500">Backlog</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-mono font-bold text-indigo-600">
                {importPreview.updatedTasks.length}
              </div>
              <div className="text-xs text-slate-500">Changed</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-mono font-bold text-slate-500">
                {importPreview.unchangedTasks.length}
              </div>
              <div className="text-xs text-slate-500">Same</div>
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto custom-scrollbar rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {importPreview.imported.slice(0, 8).map((task: any) => (
              <div key={task.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                <span className="truncate">{task.title || 'Untitled Task'}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-400">
                  {task.status}
                </span>
              </div>
            ))}
            {importPreview.imported.length > 8 && (
              <div className="px-3 py-2 text-xs text-slate-400">
                +{importPreview.imported.length - 8} more
              </div>
            )}
          </div>
        </div>
        <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setImportPreview(null)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={confirmImportTasks}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Merge import
          </button>
        </div>
      </ThemedSurface>
    </ThemedSurface>
  );
};
