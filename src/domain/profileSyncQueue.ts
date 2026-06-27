type RevisionResult = { revision: number };

export const createProfileSyncQueue = (initialRevision = 0) => {
  let revision = initialRevision;
  let tail: Promise<unknown> = Promise.resolve();
  let generation = 0;

  return {
    getRevision: () => revision,
    setRevision: (nextRevision: number) => {
      if (Number.isInteger(nextRevision) && nextRevision >= 0) revision = Math.max(revision, nextRevision);
    },
    resetRevision: (nextRevision = 0) => {
      revision = nextRevision;
      generation += 1;
    },
    enqueue: <T extends RevisionResult>(operation: (baseRevision: number) => Promise<T>): Promise<T> => {
      const operationGeneration = generation;
      const result = tail.then(() => operation(revision));
      tail = result
        .then((value) => {
          if (operationGeneration === generation) revision = value.revision;
        })
        .catch(() => undefined);
      return result;
    }
  };
};

export type ProfileSyncQueue = ReturnType<typeof createProfileSyncQueue>;
