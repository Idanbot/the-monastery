import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DataStore } from '../db.js';

/**
 * Shared `preHandler` that resolves the `:id` profile param once per request.
 *
 * Previously every profile-scoped route (tasks, settings, reset, delete)
 * repeated `const { id } = request.params as { id: string }; if
 * (!store.getProfile(id)) return reply.code(404)`. This guard centralises that
 * lookup, returns a consistent 404 payload, and stashes the resolved id on
 * `request.profileId` so handlers don't need to re-parse params.
 */
export const requireProfile = (store: DataStore) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id?: string };
    if (!id || !store.getProfile(id)) {
      reply.code(404).send({ error: 'Profile not found.' });
      return;
    }
    request.profileId = id;
  };
};
