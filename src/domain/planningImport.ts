import { generateId } from './ids';
import { emptyGoalCadence, normalizeImportedProfileSettings } from './settingsCodec';
import { getEffectiveTags, normalizeStringArray, normalizeTasksPayload } from './taskCodec';

const normalizeImportedTagList = (tags) =>
  Array.from(
    new Set(
      normalizeStringArray(tags)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );

const normalizeGoalMap = (goals) => {
  if (!goals || typeof goals !== 'object' || Array.isArray(goals)) return [];
  return Object.entries(goals)
    .filter(([tag]) => tag.trim())
    .map(([tag, value]) => ({
      id: generateId(),
      tag,
      ...(typeof value === 'number'
        ? { weeklyTargetHours: value }
        : value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : {})
    }));
};

export const normalizePlanningImportPayload = (payload) => {
  const source = payload?.profile || payload?.profiles?.[0] || payload;
  const settingsSource = source?.settings || source || {};
  const rawTasks = Array.isArray(source)
    ? source.map((item) => (typeof item === 'string' ? { title: item } : item))
    : source?.tasks || [];
  const rawGoals = settingsSource.tagGoals || settingsSource.goals || [];
  const mappedGoals = normalizeGoalMap(settingsSource.goals);
  const tasks = normalizeTasksPayload({ tasks: rawTasks });
  const normalized = normalizeImportedProfileSettings({
    roles: settingsSource.roles || [],
    tagGoals: [...(Array.isArray(rawGoals) ? rawGoals : []), ...mappedGoals],
    projects: settingsSource.projects
  });
  const { projects, roles } = normalized;
  const goals = normalized.tagGoals;
  const explicitTags = normalizeImportedTagList(settingsSource.tags);
  const roleTags = roles.flatMap((role) => role.tags || []);
  const taskTags = tasks.flatMap((task) => getEffectiveTags(task));
  const goalTags = goals.map((goal) => goal.tag);
  const tags = Array.from(new Set([...explicitTags, ...roleTags, ...taskTags, ...goalTags].filter(Boolean)));
  const existingGoalTags = new Set(goals.map((goal) => goal.tag.toLowerCase()));
  const tagGoals = [
    ...goals,
    ...explicitTags
      .filter((tag) => !existingGoalTags.has(tag.toLowerCase()))
      .map((tag) => ({ id: generateId(), tag, ...emptyGoalCadence() }))
  ];

  if (!tasks.length && !roles.length && !tags.length && !tagGoals.length && !projects.length) {
    throw new Error('Import must include tasks, roles, projects, tags, tagGoals, or goals.');
  }

  return { tasks, roles, projects, tags, tagGoals };
};
