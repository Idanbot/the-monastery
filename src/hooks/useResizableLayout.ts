import { useEffect, useState } from 'react';

const widthKey = (status) => (status === 'in-progress' ? 'inProgress' : status);

const adjustColumnPair = (columnWidths, leftStatus, rightStatus, deltaPercent) => {
  const leftKey = widthKey(leftStatus);
  const rightKey = widthKey(rightStatus);
  const next = { ...columnWidths };
  if ((next[leftKey] || 0) + deltaPercent > 15 && (next[rightKey] || 0) - deltaPercent > 15) {
    next[leftKey] += deltaPercent;
    next[rightKey] -= deltaPercent;
  }
  return next;
};

const adjustColumnGroup = (columnWidths, leftStatus, rightStatuses, deltaPercent) => {
  const leftKey = widthKey(leftStatus);
  const rightKeys = rightStatuses.map(widthKey);
  const next = { ...columnWidths };
  const rightDelta = deltaPercent / Math.max(1, rightKeys.length);
  const canResize =
    (next[leftKey] || 0) + deltaPercent > 15 && rightKeys.every((key) => (next[key] || 0) - rightDelta > 15);
  if (canResize) {
    next[leftKey] += deltaPercent;
    rightKeys.forEach((key) => {
      next[key] -= rightDelta;
    });
  }
  return next;
};

export function useResizableLayout(setSettings) {
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizer, setActiveResizer] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !activeResizer) return;
      const boardWidth = document.getElementById('kanban-board')?.clientWidth || 1000;

      setSettings((prev) => {
        if (activeResizer === 'main-sidebar') {
          return {
            ...prev,
            sidebarWidth: Math.min(560, Math.max(240, (prev.sidebarWidth || 320) - e.movementX))
          };
        }

        if (activeResizer === 'sidebar-clock') {
          return {
            ...prev,
            clockHeight: Math.min(360, Math.max(96, (prev.clockHeight || 160) + e.movementY))
          };
        }

        if (activeResizer.startsWith('columns-group:')) {
          const [, leftStatus, rightGroup] = activeResizer.split(':');
          const rightStatuses = rightGroup.split(',').filter(Boolean);
          const deltaPercent = (e.movementX / boardWidth) * 100;
          return {
            ...prev,
            columnWidths: adjustColumnGroup(prev.columnWidths, leftStatus, rightStatuses, deltaPercent)
          };
        }

        if (activeResizer.startsWith('columns:')) {
          const [, leftStatus, rightStatus] = activeResizer.split(':');
          const deltaPercent = (e.movementX / boardWidth) * 100;
          return {
            ...prev,
            columnWidths: adjustColumnPair(prev.columnWidths, leftStatus, rightStatus, deltaPercent)
          };
        }

        if (activeResizer === 'backlog-in-progress') {
          const deltaPercent = (e.movementX / boardWidth) * 100;
          return {
            ...prev,
            columnWidths: adjustColumnPair(prev.columnWidths, 'backlog', 'in-progress', deltaPercent)
          };
        }

        if (activeResizer === 'in-progress-done') {
          const deltaPercent = (e.movementX / boardWidth) * 100;
          return {
            ...prev,
            columnWidths: adjustColumnPair(prev.columnWidths, 'in-progress', 'done', deltaPercent)
          };
        }

        if (activeResizer === 'done-rejected') {
          const deltaPercent = (e.movementX / boardWidth) * 100;
          return {
            ...prev,
            columnWidths: adjustColumnPair(prev.columnWidths, 'done', 'rejected', deltaPercent)
          };
        }

        if (activeResizer === 'compact-horizontal') {
          const deltaPercent = (e.movementX / boardWidth) * 100;
          const compactColumnWidths = { ...prev.compactColumnWidths };
          if (compactColumnWidths.left + deltaPercent > 20 && compactColumnWidths.right - deltaPercent > 20) {
            compactColumnWidths.left += deltaPercent;
            compactColumnWidths.right -= deltaPercent;
          }
          return { ...prev, compactColumnWidths };
        }

        if (activeResizer.startsWith('stack:')) {
          const [, topStatus, bottomStatus, containerId] = activeResizer.split(':');
          const containerHeight = document.getElementById(containerId)?.clientHeight || 800;
          const deltaPercent = (e.movementY / containerHeight) * 100;
          const compactHeights = { ...prev.compactHeights };
          const topKey = widthKey(topStatus);
          const bottomKey = widthKey(bottomStatus);
          if (compactHeights[topKey] + deltaPercent > 15 && compactHeights[bottomKey] - deltaPercent > 15) {
            compactHeights[topKey] += deltaPercent;
            compactHeights[bottomKey] -= deltaPercent;
          }
          return { ...prev, compactHeights };
        }

        if (activeResizer === 'compact-vertical') {
          const containerHeight = document.getElementById('compact-right-col')?.clientHeight || 800;
          const deltaPercent = (e.movementY / containerHeight) * 100;
          const compactHeights = { ...prev.compactHeights };
          if (compactHeights.done + deltaPercent > 15 && compactHeights.rejected - deltaPercent > 15) {
            compactHeights.done += deltaPercent;
            compactHeights.rejected -= deltaPercent;
          }
          return { ...prev, compactHeights };
        }

        return prev;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveResizer(null);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor =
        activeResizer.startsWith('stack:') ||
        activeResizer.includes('vertical') ||
        activeResizer === 'sidebar-clock'
          ? 'row-resize'
          : 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, activeResizer, setSettings]);

  const startResize = (resizer) => {
    setIsResizing(true);
    setActiveResizer(resizer);
  };

  return { startResize };
}
