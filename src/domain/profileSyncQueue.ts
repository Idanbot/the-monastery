type RevisionResult = { revision: number };

/**
 * Serialises profile writes and tracks independent revisions for the task and
 * settings resources. Previously a single shared revision meant a settings
 * save could spuriously invalidate a concurrent task save's base revision (and
 * vice versa). Per-resource revisions let each resource advance independently
 * while still funnelling every write through one promise chain so a second
 * writer (e.g. another hook) cannot race ahead.
 */
export const createProfileSyncQueue = (initialTasksRevision = 0, initialSettingsRevision = 0) => {
  let tasksRevision = initialTasksRevision;
  let settingsRevision = initialSettingsRevision;
  let tail: Promise<unknown> = Promise.resolve();
  let generation = 0;

  const run = <T extends RevisionResult>(
    operation: (baseRevision: number) => Promise<T>,
    getRevision: () => number,
    applyRevision: (next: number) => void
  ): Promise<T> => {
    const operationGeneration = generation;
    const result = tail.then(() => operation(getRevision()));
    tail = result
      .then((value) => {
        if (operationGeneration === generation) applyRevision(value.revision);
      })
      .catch(() => undefined);
    return result;
  };

  return {
    getTasksRevision: () => tasksRevision,
    setTasksRevision: (nextRevision: number) => {
      if (Number.isInteger(nextRevision) && nextRevision >= 0)
        tasksRevision = Math.max(tasksRevision, nextRevision);
    },
    getSettingsRevision: () => settingsRevision,
    setSettingsRevision: (nextRevision: number) => {
      if (Number.isInteger(nextRevision) && nextRevision >= 0)
        settingsRevision = Math.max(settingsRevision, nextRevision);
    },
    resetRevision: (nextTasksRevision = 0, nextSettingsRevision = 0) => {
      tasksRevision = nextTasksRevision;
      settingsRevision = nextSettingsRevision;
      generation += 1;
    },
    enqueueTask: <T extends RevisionResult>(operation: (baseRevision: number) => Promise<T>): Promise<T> =>
      run(
        operation,
        () => tasksRevision,
        (next) => {
          tasksRevision = next;
        }
      ),
    enqueueSettings: <T extends RevisionResult>(
      operation: (baseRevision: number) => Promise<T>
    ): Promise<T> =>
      run(
        operation,
        () => settingsRevision,
        (next) => {
          settingsRevision = next;
        }
      )
  };
};

export type ProfileSyncQueue = ReturnType<typeof createProfileSyncQueue>;
