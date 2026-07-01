import { ListTodo, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { suggestTaskTags } from '../../domain/taskIntelligence';
import { generateId } from '../../domain/tasks';
import { ThemedSurface } from '../ui/ThemedSurface';
import { TaskModalBody } from './TaskModalBody';

import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import { useTaskDraft } from '../../hooks/useTaskDraft';

type ModalSections = { timer: boolean; notes: boolean; activity: boolean };

export function TaskModal() {
  const { settings } = useSettingsContext();
  const { tasks, setTasks, selectedTaskId, setSelectedTaskId, tagPool, registerTags, resolveTaskTags } =
    useTaskContext();
  const { now } = useUIContext();

  const {
    draftTask,
    draftNote,
    setDraftNote,
    draftIsDirty,
    draftSavedAt,
    draftSaveStatus,
    showDirtyClosePrompt,
    setShowDirtyClosePrompt,
    showDeleteTaskPrompt,
    setShowDeleteTaskPrompt,
    updateDraftTask,
    saveDraftTask,
    closeTaskModal,
    discardDraftTask,
    deleteDraftTask
  } = useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId });

  const [modalSections, setModalSections] = useState<ModalSections>({
    timer: false,
    notes: false,
    activity: false
  });

  const clockFormat = settings.clockFormat;
  const roles = useMemo(() => settings.roles || [], [settings.roles]);

  const setSubtask = (subtaskId: string, updates: any) => {
    updateDraftTask({
      subtasks: (draftTask.subtasks || []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
      )
    });
  };

  const toggleMainTimer = () => {
    if (draftTask.activeLogStart) {
      updateDraftTask({
        activeLogStart: null,
        logs: [...(draftTask.logs || []), { start: draftTask.activeLogStart, end: new Date().toISOString() }]
      });
    } else {
      updateDraftTask({ activeLogStart: new Date().toISOString() });
    }
  };

  const addSubtask = () => {
    updateDraftTask({
      subtasks: [
        ...(draftTask.subtasks || []),
        { id: generateId(), title: '', status: 'backlog', logs: [], activeLogStart: null, tags: [] }
      ]
    });
  };

  const setTaskLog = (index: number, updates: any) => {
    updateDraftTask({
      logs: (draftTask.logs || []).map((log, logIndex) => (logIndex === index ? { ...log, ...updates } : log))
    });
  };

  const addTaskLog = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 60000);
    updateDraftTask({
      logs: [...(draftTask.logs || []), { start: start.toISOString(), end: end.toISOString() }]
    });
  };

  const addNote = () => {
    const text = draftNote.trim();
    if (!text) return;
    updateDraftTask({
      activity: [
        ...(draftTask.activity || []),
        { id: generateId(), type: 'note', text, timestamp: new Date().toISOString() }
      ]
    });
    setDraftNote('');
  };

  const handleSaveDraftTask = () => {
    saveDraftTask();
    closeTaskModal();
  };

  const handleDeleteDraftTask = () => {
    deleteDraftTask();
  };

  const hasUnsavedChanges = draftIsDirty;
  const timeSinceSave =
    draftSavedAt && draftSaveStatus === 'saved'
      ? Math.max(0, Math.floor((now - draftSavedAt.getTime()) / 1000))
      : null;

  const smartSuggestions = useMemo(() => {
    if (!draftTask) return [];
    return suggestTaskTags({
      title: draftTask.title,
      existingTags: draftTask.tags || [],
      roles,
      tagPool
    });
  }, [draftTask, roles, tagPool]);

  if (!draftTask) return null;

  return (
    <ThemedSurface
      variant="overlay"
      data-testid="task-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeTaskModal({ promptToSave: true });
      }}
    >
      <ThemedSurface
        variant="modal"
        data-testid="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 shadow-2xl dark:border-slate-800"
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
              <ListTodo size={18} />
            </div>
            <h3 id="task-modal-title" className="truncate text-base font-bold text-slate-900 dark:text-white">
              Task Details
            </h3>
            <span data-testid="task-save-state" className="text-[10px] text-slate-400">
              {draftSaveStatus === 'saving'
                ? 'Saving...'
                : hasUnsavedChanges
                  ? 'Unsaved changes'
                  : draftSaveStatus === 'saved' && timeSinceSave !== null
                    ? `Saved ${timeSinceSave === 0 ? 'just now' : `${timeSinceSave}s ago`}`
                    : 'Saved'}
            </span>
            {draftSaveStatus === 'saving' && <span className="text-[10px] text-slate-400">saving…</span>}
            {draftSaveStatus === 'saved' && timeSinceSave !== null && (
              <span className="hidden text-[10px] text-slate-400 sm:inline">
                saved {timeSinceSave === 0 ? 'just now' : `${timeSinceSave}s ago`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteTaskPrompt(true)}
              aria-label="Delete task"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => closeTaskModal({ promptToSave: true })}
              aria-label="Close task details"
              title="Close"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4 sm:px-6">
          <TaskModalBody
            draftTask={draftTask}
            draftNote={draftNote}
            setDraftNote={setDraftNote}
            updateDraftTask={updateDraftTask}
            tagPool={tagPool}
            onRegisterTags={registerTags}
            resolveTags={resolveTaskTags}
            now={now}
            clockFormat={clockFormat}
            modalSections={modalSections}
            setModalSections={setModalSections}
            suggestedTags={smartSuggestions}
            sectionButtonClass="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/70"
            toggleMainTimer={toggleMainTimer}
            addTaskLog={addTaskLog}
            setTaskLog={setTaskLog}
            addSubtask={addSubtask}
            setSubtask={setSubtask}
            addNote={addNote}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 flex-col-reverse justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/30 sm:flex-row sm:px-6">
          {hasUnsavedChanges && (
            <div className="flex flex-1 items-center text-xs text-amber-600 dark:text-amber-400">
              Unsaved modifications
            </div>
          )}
          <button
            onClick={() => closeTaskModal({ promptToSave: true })}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Discard
          </button>
          <button
            onClick={handleSaveDraftTask}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Save task
          </button>
        </div>
      </ThemedSurface>

      {/* Delete Dialog Prompt */}
      {showDeleteTaskPrompt && (
        <ThemedSurface
          variant="overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowDeleteTaskPrompt(false);
          }}
        >
          <ThemedSurface
            variant="modal"
            className="w-full max-w-sm rounded-2xl border border-slate-200 p-5 shadow-2xl dark:border-slate-800"
          >
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Delete task?</h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This action cannot be undone. Task duration history will be deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteTaskPrompt(false)}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDraftTask}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </ThemedSurface>
        </ThemedSurface>
      )}

      {/* Close Alert dirty dialog prompt */}
      {showDirtyClosePrompt && (
        <ThemedSurface
          variant="overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowDirtyClosePrompt(false);
          }}
        >
          <ThemedSurface
            variant="modal"
            className="w-full max-w-sm rounded-2xl border border-slate-200 p-5 shadow-2xl dark:border-slate-800"
          >
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Save changes?</h4>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You have unsaved changes. Save them before closing or discard the edit.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDirtyClosePrompt(false)}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Keep editing
              </button>
              <button
                onClick={discardDraftTask}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                Discard
              </button>
              <button
                onClick={() => {
                  saveDraftTask();
                  closeTaskModal();
                }}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Save changes
              </button>
            </div>
          </ThemedSurface>
        </ThemedSurface>
      )}
    </ThemedSurface>
  );
}
