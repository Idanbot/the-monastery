import { useEffect, useMemo, useRef, useState } from 'react';
import { cloneTask, generateId, normalizeTask } from '../domain/tasks';

export function useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId }) {
  const [draftTask, setDraftTask] = useState(null);
  const [draftNote, setDraftNote] = useState('');
  const [showDirtyClosePrompt, setShowDirtyClosePrompt] = useState(false);
  const [showDeleteTaskPrompt, setShowDeleteTaskPrompt] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [modalBaselineSnapshot, setModalBaselineSnapshot] = useState('');
  const modalBaselineRef = useRef(null);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const selected = tasksRef.current.find((task) => task.id === selectedTaskId);
    if (!selected) {
      setDraftTask(null);
      modalBaselineRef.current = null;
      setDraftNote('');
      setShowDirtyClosePrompt(false);
      setShowDeleteTaskPrompt(false);
      setDraftSavedAt(null);
      setModalBaselineSnapshot('');
      return;
    }

    const nextDraft = cloneTask(selected);
    const nextBaseline = cloneTask(selected);
    setDraftTask(nextDraft);
    modalBaselineRef.current = nextBaseline;
    setModalBaselineSnapshot(JSON.stringify(nextBaseline));
    setDraftNote('');
    setShowDirtyClosePrompt(false);
    setShowDeleteTaskPrompt(false);
    setDraftSavedAt(null);
  }, [selectedTaskId]);

  const updateDraftTask = (updates) => setDraftTask((prev) => (prev ? { ...prev, ...updates } : prev));

  const draftIsDirty = useMemo(() => {
    if (!draftTask || !modalBaselineSnapshot) return false;
    return JSON.stringify(draftTask) !== modalBaselineSnapshot || draftNote.trim().length > 0;
  }, [draftNote, draftTask, modalBaselineSnapshot]);

  const hasDraftChanges = () => draftIsDirty;

  const saveDraftTask = () => {
    if (!draftTask) return;
    const noteText = draftNote.trim();
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
    setTasks((prev) => prev.map((task) => (task.id === normalized.id ? normalized : task)));
    modalBaselineRef.current = cloneTask(normalized);
    setModalBaselineSnapshot(JSON.stringify(modalBaselineRef.current));
    setDraftTask(normalized);
    setDraftNote('');
    setDraftSavedAt(new Date());
  };

  const closeTaskModal = ({ promptToSave = false } = {}) => {
    if (promptToSave && hasDraftChanges()) {
      setShowDirtyClosePrompt(true);
      return;
    }
    setSelectedTaskId(null);
  };

  const discardDraftTask = () => {
    setSelectedTaskId(null);
  };

  const deleteDraftTask = () => {
    if (!draftTask) return;
    setTasks((prev) => prev.filter((task) => task.id !== draftTask.id));
    setSelectedTaskId(null);
  };

  return {
    draftTask,
    draftNote,
    setDraftNote,
    draftIsDirty,
    draftSavedAt,
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
