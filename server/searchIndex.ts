export type SearchDocument = {
  entityType: 'task' | 'role' | 'project';
  entityId: string;
  title: string;
  content: string;
};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item)
      )
    : [];

const text = (value: unknown) => (typeof value === 'string' ? value : '');

export const taskSearchDocument = (task: Record<string, unknown>): SearchDocument | null => {
  const entityId = text(task.id);
  if (!entityId) return null;
  const subtasks = records(task.subtasks);
  const activity = records(task.activity);
  const title = text(task.title) || 'Untitled task';
  return {
    entityType: 'task',
    entityId,
    title,
    content: [
      title,
      text(task.status),
      ...strings(task.tags),
      ...strings(task.notes),
      ...subtasks.flatMap((subtask) => [text(subtask.title), text(subtask.status), ...strings(subtask.tags)]),
      ...activity.flatMap((entry) => [text(entry.text), text(entry.type)])
    ]
      .filter(Boolean)
      .join(' ')
  };
};

export const settingsSearchDocuments = (settings: unknown): SearchDocument[] => {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return [];
  const source = settings as Record<string, unknown>;
  const roles = records(source.roles).flatMap((role) => {
    const entityId = text(role.id);
    if (!entityId) return [];
    const title = text(role.name) || 'Untitled role';
    return [
      { entityType: 'role' as const, entityId, title, content: [title, ...strings(role.tags)].join(' ') }
    ];
  });
  const projects = records(source.projects).flatMap((project) => {
    const entityId = text(project.id);
    if (!entityId) return [];
    const title = text(project.name) || 'Untitled project';
    return [
      {
        entityType: 'project' as const,
        entityId,
        title,
        content: [
          title,
          text(project.description),
          text(project.status),
          ...strings(project.tags),
          ...records(project.milestones).map((milestone) => text(milestone.title))
        ]
          .filter(Boolean)
          .join(' ')
      }
    ];
  });
  return [...roles, ...projects];
};

export const toFtsQuery = (query: string) => {
  const terms = query.toLowerCase().match(/[\p{L}\p{N}_-]+/gu) || [];
  return terms.length ? terms.map((term) => `"${term.replaceAll('"', '""')}"*`).join(' AND ') : null;
};
