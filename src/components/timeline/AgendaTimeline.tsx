import { useEffect, useRef } from 'react';
import { Calendar, Target } from 'lucide-react';
import { formatDateInputValue, formatTime } from '../../domain/tasks';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';

export function AgendaTimeline() {
  const { settings } = useSettingsContext();
  const { tasks, setTasks, setSelectedTaskId } = useTaskContext();
  const { now } = useUIContext();

  const agendaContainerRef = useRef<HTMLDivElement>(null);
  const agendaScrollTopRef = useRef(0);
  const timelineDragRef = useRef<any>(null);
  const suppressTimelineClickRef = useRef(new Set());

  const todayTasks = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.status !== 'rejected' &&
      t.scheduledDate === formatDateInputValue(new Date()) &&
      t.scheduledStart
  );
  const nowObj = new Date(now);
  const currentMinutes = nowObj.getHours() * 60 + nowObj.getMinutes();

  const minutesToClockTime = (minutes: number) => {
    const clamped = Math.max(0, Math.min(1439, minutes));
    const hours = Math.floor(clamped / 60)
      .toString()
      .padStart(2, '0');
    const mins = Math.floor(clamped % 60)
      .toString()
      .padStart(2, '0');
    return hours + ':' + mins;
  };

  const scrollToCurrent = () => {
    if (agendaContainerRef.current) {
      const scrollTo = Math.max(0, currentMinutes - 150);
      agendaContainerRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  };

  // Implement mouseup logic directly inside AgendaTimeline
  useEffect(() => {
    const handleTimelineMouseUp = (event: MouseEvent) => {
      const drag = timelineDragRef.current;
      if (!drag) return;
      timelineDragRef.current = null;
      const delta = event.clientY - drag.startY;
      const snappedDelta = Math.round(delta / 15) * 15;
      if (Math.abs(snappedDelta) < 15) return;
      suppressTimelineClickRef.current.add(drag.taskId);
      window.setTimeout(() => suppressTimelineClickRef.current.delete(drag.taskId), 0);
      const nextStart = Math.max(0, Math.min(1439 - drag.duration, drag.startTop + snappedDelta));
      setTasks((previous) =>
        previous.map((item) =>
          item.id === drag.taskId
            ? {
                ...item,
                scheduledStart: minutesToClockTime(nextStart),
                scheduledEnd: minutesToClockTime(nextStart + drag.duration)
              }
            : item
        )
      );
    };
    window.addEventListener('mouseup', handleTimelineMouseUp);
    return () => window.removeEventListener('mouseup', handleTimelineMouseUp);
  }, [setTasks]);

  return (
    <div className="timeline-panel h-full min-h-0 flex flex-col border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Calendar size={14} className="text-indigo-500" /> Today's Timeline
        </h3>
        <button
          onClick={scrollToCurrent}
          aria-label="Locate current time"
          className="timeline-current-button grid h-7 w-7 place-items-center rounded-md transition-colors group relative"
          title="Locate Current Time"
        >
          <Target size={14} strokeWidth={2.4} />
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-900 custom-scrollbar"
        ref={agendaContainerRef}
        tabIndex={0}
        aria-label="Scrollable daily schedule"
        onScroll={(e) => {
          agendaScrollTopRef.current = e.currentTarget.scrollTop;
        }}
      >
        <div className="relative h-[1440px] w-full">
          {/* 1 Hour Grid Markers Full Width Transparent */}
          {settings.timelineHourLinesVisible !== false &&
            Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                data-testid="timeline-hour-line"
                className="absolute w-full flex items-center pointer-events-none z-0"
                style={{ top: `${i * 60}px` }}
              >
                <div className="w-20 text-[10px] font-medium text-slate-700 dark:text-slate-200 text-right pr-3 whitespace-nowrap">
                  {formatTime(new Date(new Date().setHours(i, 0, 0, 0)), settings.clockFormat)}
                </div>
                <div className="flex-1 border-t border-slate-300/30 dark:border-slate-600/30 w-full h-px"></div>
              </div>
            ))}

          {/* Current Time Red Line */}
          {settings.timelineNowLineVisible !== false && (
            <div
              data-testid="timeline-now-line"
              className="absolute w-full flex items-center z-20 pointer-events-none"
              style={{ top: `${currentMinutes}px` }}
            >
              <div className="w-20 text-[10px] font-bold text-red-500 text-right pr-3 whitespace-nowrap">
                {formatTime(now, settings.clockFormat)}
              </div>
              <div className="flex-1 h-px bg-red-500/50 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
            </div>
          )}

          {/* Task Blocks */}
          <div className="absolute top-0 bottom-0 left-20 right-2 z-10">
            {todayTasks.map((task) => {
              const [startH, startM] = task.scheduledStart.split(':').map(Number);
              const top = startH * 60 + startM;
              let duration = 60;
              if (task.scheduledEnd) {
                const [endH, endM] = task.scheduledEnd.split(':').map(Number);
                duration = Math.max(15, endH * 60 + endM - top);
              }
              return (
                <button
                  type="button"
                  key={task.id}
                  data-testid={'timeline-task-' + (task.title || 'Untitled')}
                  data-scheduled-start={task.scheduledStart}
                  draggable
                  onDragStart={(event) => {
                    event.currentTarget.dataset.dragStartY = String(event.clientY);
                    event.currentTarget.dataset.dragStartTop = String(top);
                    event.currentTarget.dataset.dragDuration = String(duration);
                  }}
                  onDragEnd={(event) => {
                    const startY = Number(event.currentTarget.dataset.dragStartY || event.clientY);
                    const startTop = Number(event.currentTarget.dataset.dragStartTop || top);
                    const savedDuration = Number(event.currentTarget.dataset.dragDuration || duration);
                    const delta = event.clientY - startY;
                    const snappedDelta = Math.round(delta / 15) * 15;
                    if (Math.abs(snappedDelta) >= 15) {
                      event.currentTarget.dataset.dragMoved = 'true';
                      const nextStart = Math.max(0, Math.min(1439 - savedDuration, startTop + snappedDelta));
                      setTasks((previous) =>
                        previous.map((item) =>
                          item.id === task.id
                            ? {
                                ...item,
                                scheduledStart: minutesToClockTime(nextStart),
                                scheduledEnd: minutesToClockTime(nextStart + savedDuration)
                              }
                            : item
                        )
                      );
                    }
                  }}
                  onMouseDown={(event) => {
                    event.currentTarget.dataset.dragStartY = String(event.clientY);
                    event.currentTarget.dataset.dragStartTop = String(top);
                    event.currentTarget.dataset.dragDuration = String(duration);
                    event.currentTarget.dataset.dragMoved = 'false';
                    timelineDragRef.current = {
                      taskId: task.id,
                      startY: event.clientY,
                      startTop: top,
                      duration
                    };
                  }}
                  onMouseUp={(event) => {
                    const startY = Number(event.currentTarget.dataset.dragStartY || event.clientY);
                    const startTop = Number(event.currentTarget.dataset.dragStartTop || top);
                    const savedDuration = Number(event.currentTarget.dataset.dragDuration || duration);
                    const delta = event.clientY - startY;
                    const snappedDelta = Math.round(delta / 15) * 15;
                    if (Math.abs(snappedDelta) >= 15) {
                      event.currentTarget.dataset.dragMoved = 'true';
                      const nextStart = Math.max(0, Math.min(1439 - savedDuration, startTop + snappedDelta));
                      setTasks((previous) =>
                        previous.map((item) =>
                          item.id === task.id
                            ? {
                                ...item,
                                scheduledStart: minutesToClockTime(nextStart),
                                scheduledEnd: minutesToClockTime(nextStart + savedDuration)
                              }
                            : item
                        )
                      );
                    }
                  }}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    event.currentTarget.dataset.dragStartY = String(event.clientY);
                    event.currentTarget.dataset.dragStartTop = String(top);
                    event.currentTarget.dataset.dragDuration = String(duration);
                    event.currentTarget.dataset.dragMoved = 'false';
                    timelineDragRef.current = {
                      taskId: task.id,
                      startY: event.clientY,
                      startTop: top,
                      duration
                    };
                  }}
                  onPointerUp={(event) => {
                    const startY = Number(event.currentTarget.dataset.dragStartY || event.clientY);
                    const startTop = Number(event.currentTarget.dataset.dragStartTop || top);
                    const savedDuration = Number(event.currentTarget.dataset.dragDuration || duration);
                    const delta = event.clientY - startY;
                    const snappedDelta = Math.round(delta / 15) * 15;
                    if (Math.abs(snappedDelta) >= 15) {
                      const nextStart = Math.max(0, Math.min(1439 - savedDuration, startTop + snappedDelta));
                      setTasks((previous) =>
                        previous.map((item) =>
                          item.id === task.id
                            ? {
                                ...item,
                                scheduledStart: minutesToClockTime(nextStart),
                                scheduledEnd: minutesToClockTime(nextStart + savedDuration)
                              }
                            : item
                        )
                      );
                    }
                  }}
                  onClick={(event) => {
                    if (suppressTimelineClickRef.current.has(task.id)) {
                      suppressTimelineClickRef.current.delete(task.id);
                      return;
                    }
                    if (event.currentTarget.dataset.dragMoved === 'true') {
                      event.currentTarget.dataset.dragMoved = 'false';
                      return;
                    }
                    setSelectedTaskId(task.id);
                  }}
                  className="absolute left-1 right-1 rounded-md p-2 text-left text-xs cursor-pointer overflow-hidden border transition-all shadow-sm group hover:z-30 hover:shadow-md bg-white/95 dark:bg-slate-800/95 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{ top: `${top}px`, height: `${duration}px` }}
                  title={task.title || 'Untitled'}
                  aria-label={`${task.title || 'Untitled task'}, scheduled from ${task.scheduledStart}${task.scheduledEnd ? ` to ${task.scheduledEnd}` : ''}`}
                >
                  <div className="font-semibold leading-snug text-slate-800 dark:text-slate-200 line-clamp-3 break-words">
                    {task.title || 'Untitled'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
