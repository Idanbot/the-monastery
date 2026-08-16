import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import { KanbanBoard } from '../board/TaskBoard';
import { ThemedPortalSurface } from '../ui/ThemedPortalSurface';

export function WorkspaceKanbanDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, openSettings, startResize, toggleBoardLane } = useSettingsContext();
  const {
    filteredTasks,
    setSelectedTaskId,
    columnSorts,
    cycleSort,
    draggedTaskId,
    dragOverInfo,
    setDraggedTaskId,
    setDragOverInfo,
    handleDragOver,
    handleDrop,
    handleDragStart,
    moveTask,
    reorderTask
  } = useTaskContext();
  const { now, quickAddText, setQuickAddText, submitQuickAddTask, keyboardFocusedTaskId } = useUIContext();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <ThemedPortalSurface variant="overlay" className="fixed inset-0 z-[80]" />
        </Dialog.Overlay>
        <Dialog.Content asChild aria-describedby={undefined}>
          <ThemedPortalSurface
            variant="modal"
            className="fixed inset-3 z-[81] flex min-h-0 flex-col overflow-hidden rounded-2xl border p-3 shadow-2xl md:inset-6"
          >
            <div className="mb-3 flex shrink-0 items-center gap-3">
              <Dialog.Title className="text-lg font-semibold text-[var(--ui-text-primary)]">
                Kanban board
              </Dialog.Title>
              <form
                onSubmit={submitQuickAddTask}
                className="ui-control ml-auto hidden min-w-0 max-w-xl flex-1 items-center gap-2 rounded-xl px-2 py-1.5 sm:flex"
                aria-label="Quick add task"
              >
                <input
                  value={quickAddText}
                  onChange={(event) => setQuickAddText(event.target.value)}
                  placeholder="Quick add task"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={!quickAddText.trim()}
                  className="ui-accent-button rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Add
                </button>
              </form>
              <button
                type="button"
                onClick={() => openSettings('board')}
                className="ui-control ui-focus-ring hidden min-h-9 rounded-lg px-3 text-xs font-semibold sm:block"
              >
                Board settings
              </button>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close Kanban" className="ui-icon-button ui-control">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1">
              <KanbanBoard
                filteredTasks={filteredTasks}
                settings={settings}
                columnSorts={columnSorts}
                cycleSort={cycleSort}
                draggedTaskId={draggedTaskId}
                dragOverInfo={dragOverInfo}
                setDraggedTaskId={setDraggedTaskId}
                setDragOverInfo={setDragOverInfo}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragStart={handleDragStart}
                onMoveTask={moveTask}
                onReorderTask={reorderTask}
                setSelectedTaskId={setSelectedTaskId}
                keyboardFocusedTaskId={keyboardFocusedTaskId}
                now={now}
                startResize={startResize}
                onToggleLane={toggleBoardLane}
              />
            </div>
          </ThemedPortalSurface>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
