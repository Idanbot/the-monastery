import { useState } from 'react';
import { executeTaskCommand } from '../domain/taskCommands';
import type { TaskStatus } from '../domain/types';

export function useBoardController(setTasks) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{
    status: TaskStatus;
    id: string | null;
    position: 'top' | 'bottom';
  } | null>(null);
  const [columnSorts, setColumnSorts] = useState<Record<TaskStatus, 'none' | 'urgency' | 'time'>>({
    backlog: 'none',
    'in-progress': 'none',
    done: 'none',
    rejected: 'none'
  });

  const handleDragStart = (event, id: string) => {
    setDraggedTaskId(id);
    event.dataTransfer.effectAllowed = 'move';
    const preview = event.currentTarget.cloneNode(true);
    preview.style.opacity = '0';
    preview.style.position = 'absolute';
    preview.style.top = '-1000px';
    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(preview, 0, 0);
    window.setTimeout(() => {
      preview.remove();
      event.target.style.opacity = '0.5';
    }, 10);
  };

  const handleDragOver = (event, status: TaskStatus, targetTaskId: string | null = null) => {
    event.preventDefault();
    if (!draggedTaskId) return;
    if (!targetTaskId) {
      setDragOverInfo({ status, id: null, position: 'bottom' });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';
    setDragOverInfo((previous) =>
      previous?.id === targetTaskId && previous.position === position
        ? previous
        : { status, id: targetTaskId, position }
    );
  };

  const handleDrop = (event, status: TaskStatus) => {
    event.preventDefault();
    if (!draggedTaskId) return;

    setTasks((previous) => {
      const movedTasks = executeTaskCommand(previous, {
        type: 'move',
        taskId: draggedTaskId,
        status
      }).tasks;
      const draggedTask = movedTasks.find((task) => task.id === draggedTaskId);
      if (!draggedTask) return previous;
      const next = movedTasks.filter((task) => task.id !== draggedTaskId);
      const targetDrop = dragOverInfo?.status === status ? dragOverInfo : null;
      if (!targetDrop?.id) next.push(draggedTask);
      else {
        const targetIndex = next.findIndex((task) => task.id === targetDrop.id);
        const insertIndex =
          targetIndex < 0 ? next.length : targetIndex + (targetDrop.position === 'bottom' ? 1 : 0);
        next.splice(insertIndex, 0, draggedTask);
      }
      return next;
    });

    setDraggedTaskId(null);
    setDragOverInfo(null);
    event.target.style.opacity = '1';
  };

  const moveTask = (taskId: string, status: TaskStatus) => {
    setTasks((previous) => executeTaskCommand(previous, { type: 'move', taskId, status }).tasks);
  };

  const reorderTask = (taskId: string, direction: 'earlier' | 'later') => {
    setTasks((previous) => {
      const task = previous.find((item) => item.id === taskId);
      if (!task) return previous;
      const laneIndexes = previous.reduce((indexes: number[], item, index) => {
        if (item.status === task.status) indexes.push(index);
        return indexes;
      }, []);
      const currentLaneIndex = laneIndexes.findIndex((index) => previous[index].id === taskId);
      const targetLaneIndex = currentLaneIndex + (direction === 'earlier' ? -1 : 1);
      if (currentLaneIndex < 0 || targetLaneIndex < 0 || targetLaneIndex >= laneIndexes.length) {
        return previous;
      }
      const next = [...previous];
      const currentIndex = laneIndexes[currentLaneIndex];
      const targetIndex = laneIndexes[targetLaneIndex];
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      return next;
    });
  };

  const cycleSort = (status: TaskStatus) => {
    setColumnSorts((previous) => {
      const current = previous[status];
      const next = current === 'none' ? 'urgency' : current === 'urgency' ? 'time' : 'none';
      return { ...previous, [status]: next };
    });
  };

  return {
    columnSorts,
    cycleSort,
    draggedTaskId,
    dragOverInfo,
    setDraggedTaskId,
    setDragOverInfo,
    handleDragStart,
    handleDragOver,
    handleDrop,
    moveTask,
    reorderTask
  };
}
