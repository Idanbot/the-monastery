import { Clock3, FolderKanban, Settings2, Target } from 'lucide-react';
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
      className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <FolderKanban size={19} /> Projects
          </h2>
          <p className="text-xs text-slate-500">
            {summaries.filter((project) => project.status === 'active').length} active
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"
        >
          <Settings2 size={14} className="mr-1 inline" /> Manage
        </button>
      </header>
      {summaries.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-center dark:border-slate-700">
          <FolderKanban size={24} className="mb-2 text-slate-400" />
          <p className="text-sm font-medium">No projects yet</p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {summaries.map((project) => (
            <article
              key={project.id}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{project.name}</h3>
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
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                <span>
                  <Target size={13} className="mr-1 inline" />
                  {project.completedItems}/{project.totalItems}
                </span>
                <span>{project.tasks.length} tasks</span>
                <span>
                  <Clock3 size={13} className="mr-1 inline" />
                  {formatDurationString(project.trackedMs)}
                </span>
              </div>
              {project.nextTask ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(project.nextTask!.id)}
                  className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2 text-left text-sm font-medium text-white"
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
