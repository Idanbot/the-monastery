import { useEffect, useRef, useState } from 'react';
import { cloneTask, normalizeTask } from '../domain/tasks';

export function useTaskDraft({ tasks, setTasks, selectedTaskId, setSelectedTaskId }) {
  const [draftTask, setDraftTask] = useState(null);
  const [draftNote, setDraftNote] = useState('');
  const [showDirtyClosePrompt, setShowDirtyClosePrompt] = useState(false);
  const [showDeleteTaskPrompt, setShowDeleteTaskPrompt] = useState(false);
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
      return;
    }

    const nextDraft = cloneTask(selected);
    setDraftTask(nextDraft);
    modalBaselineRef.current = cloneTask(selected);
    setDraftNote('');
    setShowDirtyClosePrompt(false);
    setShowDeleteTaskPrompt(false);
  }, [selectedTaskId]);

  const updateDraftTask = (updates) => setDraftTask((prev) => (prev ? { ...prev, ...updates } : prev));

  const hasDraftChanges = () => {
    if (!draftTask || !modalBaselineRef.current) return false;
    return JSON.stringify(draftTask) !== JSON.stringify(modalBaselineRef.current);
  };

  const saveDraftTask = () => {
    if (!draftTask) return;
    const normalized = normalizeTask(draftTask);
    setTasks((prev) => prev.map((task) => (task.id === normalized.id ? normalized : task)));
    modalBaselineRef.current = cloneTask(normalized);
    setDraftTask(normalized);
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
