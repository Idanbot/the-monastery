import React from 'react';
import { useProfileContext } from '../../contexts/ProfileContext';
import { ThemedSurface } from '../ui/ThemedSurface';

export const PlanningImportDialog: React.FC = () => {
  const { planningImportPreview, setPlanningImportPreview, confirmPlanningImport } = useProfileContext();

  if (!planningImportPreview) return null;

  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setPlanningImportPreview(null);
      }}
    >
      <ThemedSurface
        variant="modal"
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Import planning data?</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tasks merge by ID, roles merge by ID or name, and tag goals merge by tag.
          </p>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
          {[
            ['Tasks', planningImportPreview.tasks.length],
            ['Roles', planningImportPreview.roles.length],
            ['Tags', planningImportPreview.tags.length],
            ['Goals', planningImportPreview.tagGoals.length]
          ].map(([label, count]) => (
            <div
              key={label}
              className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-2xl font-mono font-bold text-indigo-600">{count}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
        <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setPlanningImportPreview(null)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={confirmPlanningImport}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Merge planning data
          </button>
        </div>
      </ThemedSurface>
    </ThemedSurface>
  );
};
