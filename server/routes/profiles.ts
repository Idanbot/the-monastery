import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';

export const registerProfileRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/profiles', async () => ({ profiles: store.listProfiles() }));

  app.post('/api/profiles', async (request, reply) => {
    const body = request.body as { name?: unknown } | undefined;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return reply.code(400).send({ error: 'Profile name is required.' });
    }

    return reply.code(201).send({ profile: store.createProfile(name) });
  });

  app.delete('/api/profiles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    if (store.countProfiles() <= 1) {
      return reply.code(400).send({ error: 'Cannot remove the last profile.' });
    }

    store.deleteProfile(id);
    return { ok: true };
  });

  app.post('/api/profiles/:id/reset', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    store.resetProfile(id);
    return { ok: true, revision: store.getProfileRevision(id) };
  });
};
