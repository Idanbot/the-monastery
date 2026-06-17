import { calculateTotalDuration } from './tasks';

export const calculateAnalytics = ({ tasks, roles, now }) => {
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

  const tagRows = Array.from(tagDurations.entries())
    .map(([tag, durationMs]) => ({ tag, durationMs, hours: durationMs / 3600000 }))
    .sort((a, b) => b.durationMs - a.durationMs);

  const roleRows = (roles || [])
    .map((role) => {
      const roleTags = Array.from(new Set((role.tags || []).map((tag) => String(tag).toLowerCase())));
      const durationMs = tagRows.reduce(
        (total, row) => (roleTags.includes(row.tag.toLowerCase()) ? total + row.durationMs : total),
        0
      );
      return {
        ...role,
        durationMs,
        hours: durationMs / 3600000,
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
