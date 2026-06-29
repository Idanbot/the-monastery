export type ProfileMutationResource = 'tasks' | 'settings';

export type PendingProfileMutation = {
  id: string;
  profileId: string;
  resource: ProfileMutationResource;
  payload: unknown;
  queuedAt: string;
};

export const profileMutationQueueStorageKey = 'the-monastery_profile_mutations_v1';

const readQueue = (): PendingProfileMutation[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(profileMutationQueueStorageKey) || '[]');
    return Array.isArray(value)
      ? value.filter(
          (entry) =>
            entry &&
            typeof entry.id === 'string' &&
            typeof entry.profileId === 'string' &&
            (entry.resource === 'tasks' || entry.resource === 'settings')
        )
      : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: PendingProfileMutation[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(profileMutationQueueStorageKey, JSON.stringify(queue));
};

export const getPendingProfileMutation = (
  profileId: string,
  resource: ProfileMutationResource
): PendingProfileMutation | undefined =>
  readQueue().find((entry) => entry.profileId === profileId && entry.resource === resource);

export const queueProfileMutation = (
  profileId: string,
  resource: ProfileMutationResource,
  payload: unknown
): PendingProfileMutation => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    profileId,
    resource,
    payload,
    queuedAt: new Date().toISOString()
  };
  writeQueue([
    ...readQueue().filter((item) => item.profileId !== profileId || item.resource !== resource),
    entry
  ]);
  return entry;
};

export const removeProfileMutation = (entry: Pick<PendingProfileMutation, 'id'>) => {
  writeQueue(readQueue().filter((item) => item.id !== entry.id));
};

export const removeProfileMutationFor = (profileId: string, resource: ProfileMutationResource) => {
  writeQueue(readQueue().filter((item) => item.profileId !== profileId || item.resource !== resource));
};
