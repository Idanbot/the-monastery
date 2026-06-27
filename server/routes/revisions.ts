import type { FastifyReply } from 'fastify';
import type { DataStore } from '../db.js';

type RevisionGetter = (id: string) => number;

export const rejectStaleRevision = (
  store: DataStore,
  profileId: string,
  baseRevision: number | undefined,
  reply: FastifyReply,
  getRevision: RevisionGetter = (id) => store.getTasksRevision(id)
) => {
  const revision = getRevision(profileId);
  if (baseRevision === undefined || baseRevision === revision) return false;
  reply.code(409).send({ error: 'Profile changed elsewhere.', revision });
  return true;
};

export const rejectStaleTasksRevision = (
  store: DataStore,
  profileId: string,
  baseRevision: number | undefined,
  reply: FastifyReply
) => rejectStaleRevision(store, profileId, baseRevision, reply, (id) => store.getTasksRevision(id));

export const rejectStaleSettingsRevision = (
  store: DataStore,
  profileId: string,
  baseRevision: number | undefined,
  reply: FastifyReply
) => rejectStaleRevision(store, profileId, baseRevision, reply, (id) => store.getSettingsRevision(id));
