import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cloneTask, generateId, normalizeTask } from '../domain/tasks';
import { executeTaskCommand } from '../domain/taskCommands';

export function useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId }) {
  const [draftTask, setDraftTask] = useState(null);
  const [draftNote, setDraftNoteState] = useState('');
  const [showDirtyClosePrompt, setShowDirtyClosePrompt] = useState(false);
  const [showDeleteTaskPrompt, setShowDeleteTaskPrompt] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [modalBaselineSnapshot, setModalBaselineSnapshot] = useState('');
  const [modalOpeningSnapshot, setModalOpeningSnapshot] = useState('');
  const modalBaselineRef = useRef(null);
  const modalOpeningSnapshotRef = useRef(null);
  const draftSessionActiveRef = useRef(false);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const selected = tasksRef.current.find((task) => task.id === selectedTaskId);
    if (!selected) {
      draftSessionActiveRef.current = false;
      setDraftTask(null);
      modalBaselineRef.current = null;
      modalOpeningSnapshotRef.current = null;
      setDraftNoteState('');
      setShowDirtyClosePrompt(false);
      setShowDeleteTaskPrompt(false);
      setDraftSavedAt(null);
      setDraftSaveStatus('saved');
      setModalBaselineSnapshot('');
      setModalOpeningSnapshot('');
      return;
    }

    const nextDraft = cloneTask(selected);
    const nextBaseline = cloneTask(selected);
    draftSessionActiveRef.current = true;
    setDraftTask(nextDraft);
    modalBaselineRef.current = nextBaseline;
    modalOpeningSnapshotRef.current = cloneTask(selected);
    setModalBaselineSnapshot(JSON.stringify(nextBaseline));
    setModalOpeningSnapshot(JSON.stringify(selected));
    setDraftNoteState('');
    setShowDirtyClosePrompt(false);
    setShowDeleteTaskPrompt(false);
    setDraftSavedAt(null);
    setDraftSaveStatus('saved');
  }, [selectedTaskId]);

  const draftTaskIsDirty = useMemo(() => {
    if (!draftTask || !modalBaselineSnapshot) return false;
    return JSON.stringify(draftTask) !== modalBaselineSnapshot;
  }, [draftTask, modalBaselineSnapshot]);

  const draftTaskDiffersFromOpening = useMemo(() => {
    if (!draftTask || !modalOpeningSnapshot) return false;
    return JSON.stringify(draftTask) !== modalOpeningSnapshot;
  }, [draftTask, modalOpeningSnapshot]);

  const draftIsDirty = useMemo(() => {
    return draftTaskIsDirty || draftNote.trim().length > 0;
  }, [draftNote, draftTaskIsDirty]);

  const draftHasChangesSinceOpen = useMemo(() => {
    return draftTaskDiffersFromOpening || draftNote.trim().length > 0;
  }, [draftNote, draftTaskDiffersFromOpening]);

  const updateDraftTask = (updates) =>
    setDraftTask((prev) => {
      if (!prev) return prev;
      setDraftSaveStatus('unsaved');
      return { ...prev, ...updates };
    });

  const setDraftNote = (value) => {
    setDraftNoteState(value);
    if (value.trim()) setDraftSaveStatus('unsaved');
  };

  const persistDraftTask = useCallback(
    ({ includePendingNote = true } = {}) => {
      if (!draftTask || !draftSessionActiveRef.current) return false;
      const noteText = includePendingNote ? draftNote.trim() : '';
      const withPendingNote = noteText
        ? {
            ...draftTask,
            activity: [
              ...draftTask.activity,
              { id: generateId(), type: 'note' as const, text: noteText, timestamp: new Date().toISOString() }
            ]
          }
        : draftTask;
      const normalized = normalizeTask(withPendingNote);
      const currentTask = tasksRef.current.find((task) => task.id === normalized.id);
      const persisted =
        currentTask && currentTask.status !== normalized.status
          ? executeTaskCommand([{ ...normalized, status: currentTask.status }], {
              type: 'move',
              taskId: normalized.id,
              status: normalized.status
            }).tasks[0]
          : normalized;
      setTasks((prev) => prev.map((task) => (task.id === persisted.id ? persisted : task)));
      modalBaselineRef.current = cloneTask(persisted);
      setModalBaselineSnapshot(JSON.stringify(modalBaselineRef.current));
      setDraftTask(persisted);
      if (includePendingNote) setDraftNoteState('');
      setDraftSavedAt(new Date());
      setDraftSaveStatus(!includePendingNote && draftNote.trim() ? 'unsaved' : 'saved');
      return true;
    },
    [draftNote, draftTask, setTasks]
  );

  useEffect(() => {
    if (!draftTask || !draftTaskIsDirty) return undefined;
    const timeout = window.setTimeout(() => {
      setDraftSaveStatus('saving');
      persistDraftTask({ includePendingNote: false });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [draftTask, draftTaskIsDirty, persistDraftTask]);

  const hasDraftChanges = () => draftHasChangesSinceOpen;

  const saveDraftTask = () => {
    persistDraftTask({ includePendingNote: true });
  };

  const closeTaskModal = ({ promptToSave = false } = {}) => {
    if (promptToSave && hasDraftChanges()) {
      setShowDirtyClosePrompt(true);
      return;
    }
    draftSessionActiveRef.current = false;
    setSelectedTaskId(null);
  };

  const discardDraftTask = () => {
    // Invalidate the session before restoring the task so an autosave callback
    // already queued by the browser cannot reapply the discarded draft.
    draftSessionActiveRef.current = false;
    if (modalOpeningSnapshotRef.current) {
      const baseline = cloneTask(modalOpeningSnapshotRef.current);
      setTasks((previous) =>
        previous.map((task) => (task.id === baseline.id ? normalizeTask(baseline) : task))
      );
    }
    setSelectedTaskId(null);
  };

  const deleteDraftTask = () => {
    if (!draftTask) return;
    draftSessionActiveRef.current = false;
    setTasks((prev) => executeTaskCommand(prev, { type: 'delete', taskId: draftTask.id }).tasks);
    setSelectedTaskId(null);
  };

  return {
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
  };
}
