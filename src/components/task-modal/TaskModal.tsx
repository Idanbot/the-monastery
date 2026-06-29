import { ListTodo, Trash2, X } from 'lucide-react';
import { useMemo } from 'react';
import { generateId } from '../../domain/tasks';
import { suggestTaskTags } from '../../domain/taskIntelligence';
import type { RoleDefinition, Task } from '../../domain/types';
import { ThemedSurface } from '../ui/ThemedSurface';
import { TaskModalBody } from './TaskModalBody';

type ModalSections = { timer: boolean; notes: boolean; activity: boolean };
type DraftSaveStatus = 'saved' | 'saving' | 'unsaved';

type TaskModalProps = {
  draftTask: Task | null;
  draftNote: string;
  setDraftNote: (note: string) => void;
  draftIsDirty?: boolean;
  draftSavedAt?: Date | null;
  draftSaveStatus?: DraftSaveStatus;
  modalSections: ModalSections;
  setModalSections: (sections: ModalSections) => void;
  now: number;
  clockFormat: '12h' | '24h';
  updateDraftTask: (updates: Partial<Task>) => void;
  closeTaskModal: (options?: { promptToSave?: boolean }) => void;
  saveDraftTask: () => void;
  closeAfterSave: () => void;
  showDeleteTaskPrompt: boolean;
  setShowDeleteTaskPrompt: (show: boolean) => void;
  deleteDraftTask: () => void;
  showDirtyClosePrompt: boolean;
  setShowDirtyClosePrompt: (show: boolean) => void;
  discardDraftTask: () => void;
  tagPool?: string[];
  roles?: RoleDefinition[];
  onRegisterTags?: (tags: string[]) => void;
  resolveTags?: (tags: string[]) => string[];
};

export function TaskModal({
  draftTask,
  draftNote,
  setDraftNote,
  draftIsDirty = false,
  draftSavedAt = null,
  draftSaveStatus = 'saved',
  modalSections,
  setModalSections,
  now,
  clockFormat,
  updateDraftTask,
  closeTaskModal,
  saveDraftTask,
  closeAfterSave,
  showDeleteTaskPrompt,
  setShowDeleteTaskPrompt,
  deleteDraftTask,
  showDirtyClosePrompt,
  setShowDirtyClosePrompt,
  discardDraftTask,
  tagPool = [],
  roles = [],
  onRegisterTags,
  resolveTags
}: TaskModalProps) {
  const suggestedTags = useMemo(
    () =>
      draftTask
        ? suggestTaskTags({
            title: draftTask.title,
            existingTags: draftTask.tags || [],
            tagPool,
            roles
          })
        : [],
    [draftTask, tagPool, roles]
  );

  if (!draftTask) return null;

  const setSubtask = (subtaskId, updates) => {
    updateDraftTask({
      subtasks: draftTask.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
      )
    });
  };

  const toggleMainTimer = () => {
    if (draftTask.activeLogStart) {
      updateDraftTask({
        activeLogStart: null,
        logs: [...draftTask.logs, { start: draftTask.activeLogStart, end: new Date().toISOString() }]
      });
    } else {
      updateDraftTask({ activeLogStart: new Date().toISOString() });
    }
  };

  const addSubtask = () => {
    updateDraftTask({
      subtasks: [
        ...draftTask.subtasks,
        { id: generateId(), title: '', status: 'backlog', logs: [], activeLogStart: null, tags: [] }
      ]
    });
  };

  const setTaskLog = (index, updates) => {
    updateDraftTask({
      logs: draftTask.logs.map((log, logIndex) => (logIndex === index ? { ...log, ...updates } : log))
    });
  };

  const addTaskLog = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 60000);
    updateDraftTask({
      logs: [...draftTask.logs, { start: start.toISOString(), end: end.toISOString() }]
    });
  };

  const addNote = () => {
    const text = draftNote.trim();
    if (!text) return;
    updateDraftTask({
      activity: [
        ...draftTask.activity,
        { id: generateId(), type: 'note', text, timestamp: new Date().toISOString() }
      ]
    });
    setDraftNote('');
  };

  const saveAndClose = () => {
    saveDraftTask();
    closeAfterSave();
  };

  const sectionButtonClass =
    'w-full flex items-center justify-between text-left text-sm font-bold text-slate-700 dark:text-slate-200';

  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeTaskModal({ promptToSave: true });
      }}
    >
      <ThemedSurface
        variant="modal"
        className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ListTodo size={18} className="text-indigo-500 shrink-0" />
            <h2 className="font-bold text-lg truncate">{draftTask.title || 'Untitled Task'}</h2>
            <span
              data-testid="task-save-state"
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                draftSaveStatus === 'saving'
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                  : draftIsDirty || draftSaveStatus === 'unsaved'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              }`}
            >
              {draftSaveStatus === 'saving'
                ? 'Saving...'
                : draftIsDirty || draftSaveStatus === 'unsaved'
                  ? 'Unsaved changes'
                  : draftSavedAt
                    ? 'Saved ' + draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Saved'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveAndClose}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => closeTaskModal({ promptToSave: true })}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <TaskModalBody
          draftTask={draftTask}
          draftNote={draftNote}
          setDraftNote={setDraftNote}
          modalSections={modalSections}
          setModalSections={setModalSections}
          now={now}
          clockFormat={clockFormat}
          updateDraftTask={updateDraftTask}
          suggestedTags={suggestedTags}
          sectionButtonClass={sectionButtonClass}
          toggleMainTimer={toggleMainTimer}
          addTaskLog={addTaskLog}
          setTaskLog={setTaskLog}
          addSubtask={addSubtask}
          setSubtask={setSubtask}
          addNote={addNote}
          tagPool={tagPool}
          onRegisterTags={onRegisterTags}
          resolveTags={resolveTags}
        />

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center shrink-0">
          <button
            onClick={() => closeTaskModal({ promptToSave: true })}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Discard
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteTaskPrompt(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <Trash2 size={15} /> Delete
            </button>
            <button
              onClick={saveAndClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
            >
              Save task
            </button>
          </div>
        </div>

        {showDeleteTaskPrompt && (
          <ThemedSurface
            variant="overlay"
            className="absolute inset-0 z-10 flex items-center justify-center p-4"
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete task?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This will permanently remove {draftTask.title || 'this task'} from the active profile.
                </p>
              </div>
              <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  onClick={() => setShowDeleteTaskPrompt(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteDraftTask}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Delete task
                </button>
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}

        {showDirtyClosePrompt && (
          <ThemedSurface
            variant="overlay"
            className="absolute inset-0 z-10 flex items-center justify-center p-4"
          >
            <ThemedSurface
              variant="modal"
              className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Save changes?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This task has unsaved edits. Save them before closing?
                </p>
              </div>
              <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  onClick={() => setShowDirtyClosePrompt(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={discardDraftTask}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                >
                  Discard
                </button>
                <button
                  onClick={saveAndClose}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save changes
                </button>
              </div>
            </ThemedSurface>
          </ThemedSurface>
        )}
      </ThemedSurface>
    </ThemedSurface>
  );
}
