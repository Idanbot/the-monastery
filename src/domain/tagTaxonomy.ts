import type { AppSettings, Task } from './types';
import { generateId } from './tasks';

type GoalKey = 'dailyTargetHours' | 'weeklyTargetHours' | 'monthlyTargetHours';

export type TagTaxonomyCommand =
  | { type: 'rename'; source: string; target: string }
  | { type: 'merge'; source: string; target: string }
  | { type: 'delete'; tag: string }
  | { type: 'set-alias'; alias: string; target: string }
  | { type: 'remove-alias'; alias: string }
  | { type: 'toggle-role'; tag: string; roleId: string }
  | { type: 'set-goal'; tag: string; goal: GoalKey; hours: number };

const keyOf = (tag: string) => tag.trim().toLowerCase();

const uniqueTags = (tags: string[]) => {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = keyOf(tag);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const canonicalizeTags = (tags: string[], aliases: Record<string, string> = {}) => {
  const byKey = new Map(Object.entries(aliases).map(([alias, target]) => [keyOf(alias), target]));
  return uniqueTags(tags.map((tag) => byKey.get(keyOf(tag)) || tag));
};

const replaceTag = (tags: string[], source: string, target: string) =>
  uniqueTags(tags.map((tag) => (keyOf(tag) === keyOf(source) ? target : tag)));

const removeTag = (tags: string[], tag: string) => tags.filter((item) => keyOf(item) !== keyOf(tag));

const mapTasks = (tasks: Task[], source: string, target?: string) =>
  tasks.map((task) => ({
    ...task,
    tags: target ? replaceTag(task.tags, source, target) : removeTag(task.tags, source),
    subtasks: task.subtasks.map((subtask) => ({
      ...subtask,
      tags: target ? replaceTag(subtask.tags, source, target) : removeTag(subtask.tags, source)
    }))
  }));

const mergeTagGoals = (settings: AppSettings, source: string, target: string) => {
  const matching = settings.tagGoals.filter(
    (goal) => keyOf(goal.tag) === keyOf(source) || keyOf(goal.tag) === keyOf(target)
  );
  if (matching.length === 0) return settings.tagGoals;

  const preferred = matching.find((goal) => keyOf(goal.tag) === keyOf(target)) || matching[0];
  const merged = {
    ...preferred,
    tag: target,
    dailyTargetHours: Math.max(...matching.map((goal) => goal.dailyTargetHours)),
    weeklyTargetHours: Math.max(...matching.map((goal) => goal.weeklyTargetHours)),
    monthlyTargetHours: Math.max(...matching.map((goal) => goal.monthlyTargetHours))
  };
  return [
    ...settings.tagGoals.filter(
      (goal) => keyOf(goal.tag) !== keyOf(source) && keyOf(goal.tag) !== keyOf(target)
    ),
    merged
  ];
};

const replaceSettingsTag = (
  settings: AppSettings,
  source: string,
  target: string,
  keepAlias: boolean
): AppSettings => ({
  ...settings,
  tagInventory: replaceTag(settings.tagInventory, source, target),
  tagAliases: Object.fromEntries([
    ...Object.entries(settings.tagAliases || {})
      .filter(([alias]) => keyOf(alias) !== keyOf(source))
      .map(([alias, value]) => [alias, keyOf(value) === keyOf(source) ? target : value]),
    ...(keepAlias ? [[source, target]] : [])
  ]),
  roles: settings.roles.map((role) => ({ ...role, tags: replaceTag(role.tags, source, target) })),
  tagGoals: mergeTagGoals(settings, source, target)
});

const deleteSettingsTag = (settings: AppSettings, tag: string): AppSettings => ({
  ...settings,
  tagInventory: removeTag(settings.tagInventory, tag),
  tagAliases: Object.fromEntries(
    Object.entries(settings.tagAliases || {}).filter(
      ([alias, target]) => keyOf(alias) !== keyOf(tag) && keyOf(target) !== keyOf(tag)
    )
  ),
  roles: settings.roles.map((role) => ({ ...role, tags: removeTag(role.tags, tag) })),
  tagGoals: settings.tagGoals.filter((goal) => keyOf(goal.tag) !== keyOf(tag))
});

export const applyTagTaxonomyCommand = (
  tasks: Task[],
  settings: AppSettings,
  command: TagTaxonomyCommand
): { tasks: Task[]; settings: AppSettings } => {
  if (command.type === 'rename' || command.type === 'merge') {
    const source = command.source.trim();
    const target = command.target.trim();
    if (!source || !target || keyOf(source) === keyOf(target)) return { tasks, settings };
    return {
      tasks: mapTasks(tasks, source, target),
      settings: replaceSettingsTag(settings, source, target, command.type === 'merge')
    };
  }

  if (command.type === 'delete') {
    const tag = command.tag.trim();
    if (!tag) return { tasks, settings };
    return { tasks: mapTasks(tasks, tag), settings: deleteSettingsTag(settings, tag) };
  }

  if (command.type === 'set-alias') {
    const alias = command.alias.trim();
    const target = command.target.trim();
    if (!alias || !target || keyOf(alias) === keyOf(target)) return { tasks, settings };
    return {
      tasks,
      settings: { ...settings, tagAliases: { ...(settings.tagAliases || {}), [alias]: target } }
    };
  }

  if (command.type === 'remove-alias') {
    const aliases = { ...(settings.tagAliases || {}) };
    const match = Object.keys(aliases).find((alias) => keyOf(alias) === keyOf(command.alias));
    if (match) delete aliases[match];
    return { tasks, settings: { ...settings, tagAliases: aliases } };
  }

  if (command.type === 'toggle-role') {
    return {
      tasks,
      settings: {
        ...settings,
        roles: settings.roles.map((role) =>
          role.id !== command.roleId
            ? role
            : {
                ...role,
                tags: role.tags.some((tag) => keyOf(tag) === keyOf(command.tag))
                  ? removeTag(role.tags, command.tag)
                  : uniqueTags([...role.tags, command.tag])
              }
        )
      }
    };
  }

  const hours = Math.max(0, Number(command.hours) || 0);
  const existing = settings.tagGoals.find((goal) => keyOf(goal.tag) === keyOf(command.tag));
  const tagGoals = existing
    ? settings.tagGoals.map((goal) => (goal.id === existing.id ? { ...goal, [command.goal]: hours } : goal))
    : [
        ...settings.tagGoals,
        {
          id: generateId(),
          tag: command.tag,
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0,
          [command.goal]: hours
        }
      ];

  return { tasks, settings: { ...settings, tagGoals } };
};
