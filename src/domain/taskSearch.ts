export const taskMatchesSearch = (task, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const searchable = [
    task.title,
    task.status,
    task.scheduledDate,
    task.scheduledStart,
    task.scheduledEnd,
    ...(task.tags || []),
    ...(task.activity || []).flatMap((entry) => [entry.text, entry.type]),
    ...(task.subtasks || []).flatMap((subtask) => [subtask.title, subtask.status, ...(subtask.tags || [])])
  ];
  return searchable.some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(normalizedQuery)
  );
};
