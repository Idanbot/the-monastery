import { useEffect, useState } from 'react';

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

        if (activeResizer === 'new-done') {
          const deltaPercent = (e.movementX / boardWidth) * 100;
          const columnWidths = { ...prev.columnWidths };
          if (columnWidths.new + deltaPercent > 15 && columnWidths.done - deltaPercent > 15) {
            columnWidths.new += deltaPercent;
            columnWidths.done -= deltaPercent;
          }
          return { ...prev, columnWidths };
        }

        if (activeResizer === 'done-rejected') {
          const deltaPercent = (e.movementX / boardWidth) * 100;
          const columnWidths = { ...prev.columnWidths };
          if (columnWidths.done + deltaPercent > 15 && columnWidths.rejected - deltaPercent > 15) {
            columnWidths.done += deltaPercent;
            columnWidths.rejected -= deltaPercent;
          }
          return { ...prev, columnWidths };
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
        activeResizer.includes('vertical') || activeResizer === 'sidebar-clock' ? 'row-resize' : 'col-resize';
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
