import { formatDateInputValue, statusLabels, taskStatuses } from '../../domain/tasks';
import { parseTagString } from '../../domain/tags';
import type { Task, TaskRecurrence, TaskStatus } from '../../domain/types';
import { TagPicker } from '../tag-picker/TagPicker';

type Props = {
  draftTask: Task;
  updateDraftTask: (updates: Partial<Task>) => void;
  suggestedTags: string[];
  tagPool: string[];
  onRegisterTags?: (tags: string[]) => void;
  resolveTags: (tags: string[]) => string[];
};

export function TaskDetailsFields({
  draftTask,
  updateDraftTask,
  suggestedTags,
  tagPool,
  onRegisterTags,
  resolveTags
}: Props) {
  const applyTemplate = (template: 'deep-work' | 'review') => {
    const deepWork = template === 'deep-work';
    updateDraftTask({
      title: deepWork ? 'Deep Work Block' : 'Review Queue',
      urgency: deepWork ? 7 : 4,
      tags: Array.from(new Set([...(draftTask.tags || []), deepWork ? 'focus' : 'review'])),
      scheduledDate: formatDateInputValue(new Date()),
      scheduledStart: deepWork ? '09:00' : '15:00',
      scheduledEnd: deepWork ? '11:00' : '16:00'
    });
  };

  return (
    <>
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Templates</div>
        <div className="flex flex-wrap gap-2">
          <TemplateButton onClick={() => applyTemplate('deep-work')}>Deep work template</TemplateButton>
          <TemplateButton onClick={() => applyTemplate('review')}>Review template</TemplateButton>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="md:col-span-2 flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Title
          <input
            value={draftTask.title}
            onChange={(event) => updateDraftTask({ title: event.target.value })}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Status
          <select
            value={draftTask.status}
            onChange={(event) => updateDraftTask({ status: event.target.value as TaskStatus })}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Move task</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {taskStatuses.map((status) => (
              <button
                key={status}
                type="button"
                aria-label={`Move task to ${statusLabels[status]}`}
                onClick={() => updateDraftTask({ status })}
                disabled={draftTask.status === status}
                className={
                  'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-default ' +
                  (draftTask.status === status
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500')
                }
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          Urgency
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={draftTask.urgency}
              onChange={(event) => updateDraftTask({ urgency: Number(event.target.value) })}
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
            onChange={(event) => updateDraftTask({ scheduledDate: event.target.value })}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TimeField
            label="Start"
            value={draftTask.scheduledStart}
            onChange={(scheduledStart) => updateDraftTask({ scheduledStart })}
          />
          <TimeField
            label="End"
            value={draftTask.scheduledEnd}
            onChange={(scheduledEnd) => updateDraftTask({ scheduledEnd })}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            Repeat
            <select
              value={draftTask.recurrence || 'none'}
              onChange={(event) => {
                const recurrence = event.target.value as TaskRecurrence;
                updateDraftTask({
                  recurrence,
                  recurrenceRootId: recurrence === 'none' ? null : draftTask.recurrenceRootId
                });
              }}
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
            onChange={(value) => updateDraftTask({ tags: resolveTags(parseTagString(value)) })}
            onCommit={(value) => onRegisterTags?.(resolveTags(parseTagString(value)))}
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
    </>
  );
}

function TemplateButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium hover:border-indigo-300"
    >
      {children}
    </button>
  );
}

function TimeField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
      {label}
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
    </label>
  );
}
