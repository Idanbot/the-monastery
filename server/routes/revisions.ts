import type { FastifyReply } from 'fastify';
import type { DataStore } from '../db.js';

export const rejectStaleRevision = (
  store: DataStore,
  profileId: string,
  baseRevision: number | undefined,
  reply: FastifyReply
) => {
  const revision = store.getProfileRevision(profileId);
  if (baseRevision === undefined || baseRevision === revision) return false;
  reply.code(409).send({ error: 'Profile changed elsewhere.', revision });
  return true;
};
