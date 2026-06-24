import {
  Activity,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Play,
  Plus,
  Square,
  Trash2
} from 'lucide-react';
import {
  calculateTotalDuration,
  formatDate,
  formatDateInputValue,
  formatDurationString,
  formatLiveTimer,
  formatTime,
  fromDateTimeLocal,
  toDateTimeLocal
} from '../../domain/tasks';
import { parseTagString } from '../../domain/tags';
import { TagPicker } from '../tag-picker/TagPicker';

export function TaskModalBody({
  draftTask,
  draftNote,
  setDraftNote,
  modalSections,
  setModalSections,
  now,
  clockFormat,
  updateDraftTask,
  suggestedTags,
  sectionButtonClass,
  toggleMainTimer,
  addTaskLog,
  setTaskLog,
  addSubtask,
  setSubtask,
  addNote,
  tagPool
}) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Templates</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              updateDraftTask({
                title: 'Deep Work Block',
                urgency: 7,
                tags: Array.from(new Set([...(draftTask.tags || []), 'focus'])),
                scheduledDate: formatDateInputValue(new Date()),
                scheduledStart: '09:00',
                scheduledEnd: '11:00'
              })
            }
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium hover:border-indigo-300"
          >
            Deep work template
          </button>
          <button
            type="button"
            onClick={() =>
              updateDraftTask({
                title: 'Review Queue',
                urgency: 4,
                tags: Array.from(new Set([...(draftTask.tags || []), 'review'])),
                scheduledDate: formatDateInputValue(new Date()),
                scheduledStart: '15:00',
                scheduledEnd: '16:00'
              })
            }
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium hover:border-indigo-300"
          >
            Review template
          </button>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="md:col-span-2 flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Title
          <input
            value={draftTask.title}
            onChange={(e) => updateDraftTask({ title: e.target.value })}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Status
          <select
            value={draftTask.status}
            onChange={(e) => updateDraftTask({ status: e.target.value })}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="new">New</option>
            <option value="done">Done</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Urgency
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={draftTask.urgency}
              onChange={(e) => updateDraftTask({ urgency: Number(e.target.value) })}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-10 text-center rounded-md bg-slate-100 dark:bg-slate-800 py-1 font-mono text-sm">
              {draftTask.urgency}
            </span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Date
          <input
            type="date"
            value={draftTask.scheduledDate}
            onChange={(e) => updateDraftTask({ scheduledDate: e.target.value })}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            Start
            <input
              type="time"
              value={draftTask.scheduledStart}
              onChange={(e) => updateDraftTask({ scheduledStart: e.target.value })}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            End
            <input
              type="time"
              value={draftTask.scheduledEnd}
              onChange={(e) => updateDraftTask({ scheduledEnd: e.target.value })}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            Repeat
            <select
              value={draftTask.recurrence || 'none'}
              onChange={(e) =>
                updateDraftTask({
                  recurrence: e.target.value,
                  recurrenceRootId: e.target.value === 'none' ? null : draftTask.recurrenceRootId
                })
              }
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        <div className="md:col-span-2 space-y-2">
          <TagPicker
            label="Tags"
            value={(draftTask.tags || []).join(', ')}
            onChange={(nextValue) => updateDraftTask({ tags: parseTagString(nextValue) })}
            placeholder="Backend, High Priority"
            tagPool={tagPool}
          />
          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span>Suggested</span>
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-label={`Add suggested tag ${tag}`}
                  onClick={() =>
                    updateDraftTask({ tags: Array.from(new Set([...(draftTask.tags || []), tag])) })
                  }
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setModalSections((prev) => ({ ...prev, timer: !prev.timer }))}
          className={`${sectionButtonClass} px-4 py-3 bg-slate-50 dark:bg-slate-800/60`}
        >
          <span className="flex items-center gap-2">
            <Clock size={15} /> Timer
          </span>
          {modalSections.timer ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {modalSections.timer && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {draftTask.activeLogStart
                    ? formatLiveTimer(draftTask.activeLogStart, now)
                    : formatDurationString(calculateTotalDuration(draftTask.logs))}
                </div>
                <div className="text-xs text-slate-500">
                  {draftTask.logs.length} completed log{draftTask.logs.length === 1 ? '' : 's'}
                </div>
              </div>
              <button
                onClick={toggleMainTimer}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${draftTask.activeLogStart ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              >
                {draftTask.activeLogStart ? <Square size={14} /> : <Play size={14} />}
                {draftTask.activeLogStart ? 'Stop' : 'Start'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Manual Logs</h4>
                <button
                  onClick={addTaskLog}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-xs font-medium flex items-center gap-1.5"
                >
                  <Plus size={13} /> Add log
                </button>
              </div>
              {draftTask.logs.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 py-4 text-center text-xs text-slate-400">
                  No completed logs
                </div>
              )}
              {draftTask.logs.map((log, index) => (
                <div
                  key={`${log.start}-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                >
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    Start
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(log.start)}
                      onChange={(e) =>
                        setTaskLog(index, { start: fromDateTimeLocal(e.target.value) || log.start })
                      }
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                    End
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(log.end)}
                      onChange={(e) => setTaskLog(index, { end: fromDateTimeLocal(e.target.value) })}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                  </label>
                  <button
                    onClick={() =>
                      updateDraftTask({
                        logs: draftTask.logs.filter((_, logIndex) => logIndex !== index)
                      })
                    }
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    title="Delete log"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <CheckSquare size={15} /> Subtasks
          </h3>
          <button
            onClick={addSubtask}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-sm font-medium flex items-center gap-1.5"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {draftTask.subtasks.map((subtask) => (
            <div key={subtask.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input
                value={subtask.title}
                onChange={(e) => setSubtask(subtask.id, { title: e.target.value })}
                placeholder="Subtask title"
                className="min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <select
                value={subtask.status}
                onChange={(e) => setSubtask(subtask.id, { status: e.target.value })}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="new">New</option>
                <option value="done">Done</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() =>
                  updateDraftTask({
                    subtasks: draftTask.subtasks.filter((item) => item.id !== subtask.id)
                  })
                }
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                title="Delete subtask"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {draftTask.subtasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 py-6 text-center text-sm text-slate-400">
              No subtasks
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setModalSections((prev) => ({ ...prev, notes: !prev.notes }))}
          className={`${sectionButtonClass} px-4 py-3 bg-slate-50 dark:bg-slate-800/60`}
        >
          <span className="flex items-center gap-2">
            <MessageSquare size={15} /> Notes
          </span>
          {modalSections.notes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {modalSections.notes && (
          <div className="p-4 space-y-3">
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={3}
              placeholder="Add a note..."
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={addNote}
              className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium"
            >
              Add note
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setModalSections((prev) => ({ ...prev, activity: !prev.activity }))}
          className={`${sectionButtonClass} px-4 py-3 bg-slate-50 dark:bg-slate-800/60`}
        >
          <span className="flex items-center gap-2">
            <Activity size={15} /> Activity
          </span>
          {modalSections.activity ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {modalSections.activity && (
          <div className="p-4 space-y-3">
            {[...draftTask.activity].reverse().map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${entry.type === 'note' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                ></div>
                <div className="min-w-0">
                  <div className="text-slate-700 dark:text-slate-200 break-words">{entry.text}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(entry.timestamp)} at {formatTime(entry.timestamp, clockFormat)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
