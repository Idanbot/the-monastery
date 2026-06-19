import { calculateTotalDuration } from './tasks';

export const calculateAnalytics = ({ tasks, roles, tagGoals = [], now }) => {
  const tagDurations = new Map<string, number>();
  const statusCounts = { new: 0, done: 0, rejected: 0 };

  const addDuration = (tags, durationMs) => {
    if (!durationMs) return;
    const normalizedTags = Array.from(
      new Set((tags || []).map((tag) => String(tag).trim()).filter(Boolean))
    ) as string[];
    normalizedTags.forEach((tag) => {
      tagDurations.set(tag, (tagDurations.get(tag) || 0) + durationMs);
    });
  };

  const itemDuration = (item) =>
    calculateTotalDuration(item.logs || []) +
    (item.activeLogStart ? Math.max(0, now - new Date(item.activeLogStart).getTime()) : 0);

  tasks.forEach((task) => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    addDuration(task.tags || [], itemDuration(task));

    (task.subtasks || []).forEach((subtask) => {
      addDuration([...(task.tags || []), ...(subtask.tags || [])], itemDuration(subtask));
    });
  });

  const goalsByTag = new Map((tagGoals || []).map((goal) => [String(goal.tag || '').toLowerCase(), goal]));

  const tagRows = Array.from(tagDurations.entries())
    .map(([tag, durationMs]) => {
      const goal = goalsByTag.get(tag.toLowerCase()) || {};
      const hours = durationMs / 3600000;
      return {
        tag,
        durationMs,
        hours,
        dailyTargetHours: Number(goal.dailyTargetHours) || 0,
        weeklyTargetHours: Number(goal.weeklyTargetHours) || 0,
        monthlyTargetHours: Number(goal.monthlyTargetHours) || 0,
        weeklyBalanceHours: Math.max(0, (Number(goal.weeklyTargetHours) || 0) - hours)
      };
    })
    .sort((a, b) => b.durationMs - a.durationMs);

  const roleRows = (roles || [])
    .map((role) => {
      const roleTags = Array.from(new Set((role.tags || []).map((tag) => String(tag).toLowerCase())));
      const durationMs = tagRows.reduce(
        (total, row) => (roleTags.includes(row.tag.toLowerCase()) ? total + row.durationMs : total),
        0
      );
      const hours = durationMs / 3600000;
      const weeklyTargetHours = Number(role.weeklyTargetHours) || 0;
      return {
        ...role,
        durationMs,
        hours,
        weeklyBalanceHours: Math.max(0, weeklyTargetHours - hours),
        weeklyProgress: weeklyTargetHours > 0 ? Math.min(1, hours / weeklyTargetHours) : 0,
        matchingTags: tagRows.filter((row) => roleTags.includes(row.tag.toLowerCase())).map((row) => row.tag)
      };
    })
    .sort((a, b) => b.durationMs - a.durationMs);

  return {
    tagRows,
    roleRows,
    statusCounts,
    totalTrackedMs: tasks.reduce(
      (total, task) =>
        total +
        itemDuration(task) +
        (task.subtasks || []).reduce((subTotal, subtask) => subTotal + itemDuration(subtask), 0),
      0
    )
  };
};
