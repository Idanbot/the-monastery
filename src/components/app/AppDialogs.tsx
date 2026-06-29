import { Fragment } from 'react';
import { X } from 'lucide-react';
import { ThemedSurface } from '../ui/ThemedSurface';

export function ShortcutHelpDialog({ open, onClose }) {
  if (!open) return null;
  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <ThemedSurface
        role="dialog"
        aria-label="Keyboard shortcuts"
        variant="modal"
        className="w-full max-w-sm rounded-xl border p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold">Keyboard shortcuts</h3>
          <button aria-label="Close keyboard shortcuts" onClick={onClose} className="text-slate-400">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          {[
            ['Ctrl+K', 'Command palette'],
            ['n', 'Backlog task'],
            ['f', 'Focus task'],
            ['p', 'Plan day'],
            ['j/k', 'Move task focus'],
            ['Enter', 'Open focused task'],
            ['d', 'Analytics'],
            ['b', 'Board'],
            ['?', 'Shortcuts']
          ].map(([key, label]) => (
            <Fragment key={key}>
              <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
                {key}
              </kbd>
              <span>{label}</span>
            </Fragment>
          ))}
        </div>
      </ThemedSurface>
    </ThemedSurface>
  );
}

export function ProfileActionDialog({ action, profileName, onCancel, onConfirm }) {
  if (!action) return null;
  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <ThemedSurface
        variant="modal"
        className="pointer-events-auto w-full max-w-sm rounded-xl border shadow-2xl"
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-bold">{action === 'reset' ? 'Reset profile?' : 'Remove profile?'}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {action === 'reset'
              ? `This will delete every task in ${profileName || 'this profile'} and keep the profile.`
              : `This will delete ${profileName || 'this profile'} and all of its tasks.`}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
          >
            {action === 'reset' ? 'Reset profile' : 'Remove profile'}
          </button>
        </div>
      </ThemedSurface>
    </ThemedSurface>
  );
}
