import { FolderKanban, Settings2 } from 'lucide-react';
import type { Project, Task } from '../../domain/types';
import { calculateProjectSummaries } from '../../domain/projects';
import { formatDurationString } from '../../domain/tasks';

export function ProjectsView({
  projects,
  tasks,
  now,
  onOpenTask,
  onOpenSettings
}: {
  projects: Project[];
  tasks: Task[];
  now: number;
  onOpenTask: (taskId: string) => void;
  onOpenSettings: () => void;
}) {
  const summaries = calculateProjectSummaries(projects, tasks, now);
  return (
    <section
      data-testid="projects-view"
      className="custom-scrollbar min-h-0 w-full flex-1 overflow-y-auto bg-transparent p-0 sm:rounded-xl sm:border sm:border-[var(--ui-border-subtle)] sm:bg-[var(--ui-surface)] sm:p-5"
    >
      <header className="mb-3 flex items-end justify-between gap-3 px-1 pt-1 sm:mb-4 sm:items-center sm:px-0 sm:pt-0">
        <div>
          <div className="ui-eyebrow sm:hidden">Outcomes</div>
          <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-semibold sm:mt-0 sm:text-lg sm:font-bold">
            <FolderKanban size={20} className="hidden sm:block" /> Projects
          </h1>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary)] sm:text-xs">
            {summaries.filter((project) => project.status === 'active').length} active
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="ui-control ui-focus-ring flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold"
        >
          <Settings2 size={16} /> Manage
        </button>
      </header>
      {summaries.length === 0 ? (
        <div className="ui-surface flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
          <FolderKanban size={24} className="mb-2 text-slate-400" />
          <p className="text-base font-semibold">No projects yet</p>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
            Group related tasks around one outcome.
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="ui-accent-button ui-focus-ring mt-4 min-h-12 rounded-xl px-4 text-base font-semibold"
          >
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {summaries.map((project) => (
            <article key={project.id} className="ui-surface rounded-2xl border p-4 shadow-sm sm:rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-lg font-semibold leading-snug">{project.name}</h2>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize dark:bg-slate-800">
                  {project.status}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums">{project.progressPercent}%</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[var(--ui-text-secondary)]">
                <span className="rounded-xl bg-[var(--ui-control)] px-1.5 py-2">
                  <strong className="block text-sm text-[var(--ui-text-primary)]">
                    {project.completedItems}/{project.totalItems}
                  </strong>
                  Items
                </span>
                <span className="rounded-xl bg-[var(--ui-control)] px-1.5 py-2">
                  <strong className="block text-sm text-[var(--ui-text-primary)]">
                    {project.tasks.length}
                  </strong>
                  Tasks
                </span>
                <span className="rounded-xl bg-[var(--ui-control)] px-1.5 py-2">
                  <strong className="block truncate text-sm text-[var(--ui-text-primary)]">
                    {formatDurationString(project.trackedMs)}
                  </strong>
                  Tracked
                </span>
              </div>
              {project.nextTask ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(project.nextTask!.id)}
                  className="ui-accent-button ui-focus-ring mt-4 min-h-12 w-full rounded-xl px-3 py-2 text-left text-base font-semibold"
                >
                  Next: {project.nextTask.title}
                </button>
              ) : (
                <div className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                  No pending linked tasks
                </div>
              )}
              {project.milestones.some((milestone) => !milestone.completed) && (
                <div className="mt-3 space-y-1">
                  {project.milestones
                    .filter((milestone) => !milestone.completed)
                    .slice(0, 3)
                    .map((milestone) => (
                      <div key={milestone.id} className="truncate text-xs text-slate-500">
                        • {milestone.title}
                      </div>
                    ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
