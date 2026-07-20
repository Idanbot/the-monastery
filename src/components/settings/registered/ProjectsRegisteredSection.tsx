import { Plus, Trash2 } from 'lucide-react';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useTaskContext } from '../../../contexts/TaskContext';
import { generateId } from '../../../domain/tasks';
import { parseTagString } from '../../../domain/tags';
import type { Project } from '../../../domain/types';
import { Button } from '../../ui/Button';
import { SettingSection } from '../SettingSection';
import { SettingsSelect } from '../SettingsSelect';
import type { RegisteredSectionProps } from './types';

export default function ProjectsRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  const { tasks } = useTaskContext();
  const updateProject = (projectId: string, updates: Partial<Project>) =>
    setSettings((previous) => ({
      ...previous,
      projects: previous.projects.map((project) =>
        project.id === projectId ? { ...project, ...updates } : project
      )
    }));
  const addProject = () =>
    setSettings((previous) => ({
      ...previous,
      projects: [
        ...previous.projects,
        {
          id: generateId(),
          name: 'New project',
          description: '',
          status: 'active',
          tags: [],
          taskIds: [],
          milestones: []
        }
      ]
    }));
  return (
    <SettingSection id="projects" title="Projects" {...props}>
      <Button onClick={addProject} variant="secondary">
        <Plus size={13} /> Add project
      </Button>
      {settings.projects.map((project) => (
        <div
          key={project.id}
          className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
        >
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              aria-label="Project name"
              value={project.name}
              onChange={(event) => updateProject(project.id, { name: event.target.value })}
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              aria-label="Delete project"
              onClick={() =>
                setSettings((previous) => ({
                  ...previous,
                  projects: previous.projects.filter((item) => item.id !== project.id)
                }))
              }
              className="rounded-lg p-2 text-slate-400 hover:text-rose-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
          <textarea
            aria-label="Project description"
            value={project.description}
            onChange={(event) => updateProject(project.id, { description: event.target.value })}
            placeholder="Outcome and scope"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <div className="grid grid-cols-2 gap-2">
            <SettingsSelect
              ariaLabel="Project status"
              value={project.status}
              onValueChange={(value) => updateProject(project.id, { status: value as Project['status'] })}
              options={[
                { id: 'active', label: 'Active' },
                { id: 'paused', label: 'Paused' },
                { id: 'completed', label: 'Completed' }
              ]}
            />
            <input
              aria-label="Project tags"
              value={project.tags.join(', ')}
              onChange={(event) => updateProject(project.id, { tags: parseTagString(event.target.value) })}
              placeholder="cloud, migration"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <SettingsSelect
            ariaLabel="Link task to project"
            value=""
            onValueChange={(value) => {
              if (value)
                updateProject(project.id, {
                  taskIds: Array.from(new Set([...project.taskIds, value]))
                });
            }}
            placeholder="Link task..."
            options={tasks
              .filter((task) => !project.taskIds.includes(task.id))
              .map((task) => ({ id: task.id, label: task.title || 'Untitled task' }))}
          />
          <div className="flex flex-wrap gap-1">
            {project.taskIds.map((taskId) => (
              <button
                key={taskId}
                title="Unlink task"
                onClick={() =>
                  updateProject(project.id, { taskIds: project.taskIds.filter((id) => id !== taskId) })
                }
                className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
              >
                {tasks.find((task) => task.id === taskId)?.title || taskId} ×
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <input
                  aria-label="Milestone complete"
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={(event) =>
                    updateProject(project.id, {
                      milestones: project.milestones.map((item) =>
                        item.id === milestone.id ? { ...item, completed: event.target.checked } : item
                      )
                    })
                  }
                />
                <input
                  aria-label="Milestone title"
                  value={milestone.title}
                  onChange={(event) =>
                    updateProject(project.id, {
                      milestones: project.milestones.map((item) =>
                        item.id === milestone.id ? { ...item, title: event.target.value } : item
                      )
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  aria-label="Delete milestone"
                  onClick={() =>
                    updateProject(project.id, {
                      milestones: project.milestones.filter((item) => item.id !== milestone.id)
                    })
                  }
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateProject(project.id, {
                  milestones: [
                    ...project.milestones,
                    { id: generateId(), title: 'New milestone', completed: false }
                  ]
                })
              }
              className="text-xs font-medium text-indigo-600"
            >
              + milestone
            </button>
          </div>
        </div>
      ))}
      {settings.projects.length === 0 && <div className="text-sm text-slate-400">No projects yet.</div>}
    </SettingSection>
  );
}
