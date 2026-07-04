import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import { requireProfile } from './profileGuard.js';

export const registerSearchRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/profiles/:id/search', { preHandler: requireProfile(store) }, async (request, reply) => {
    const query = request.query as { q?: unknown; limit?: unknown };
    const text = typeof query.q === 'string' ? query.q.trim() : '';
    if (!text) return { results: [] };
    if (text.length > 200) return reply.code(400).send({ error: 'Search query is too long.' });
    const parsedLimit = typeof query.limit === 'string' ? Number(query.limit) : 20;
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    return { results: store.searchProfile(request.profileId!, text, limit) };
  });
};
