import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import { contractResponse, profilesResponseSchema } from '../../shared/apiContracts.js';
import { requireProfile } from './profileGuard.js';

export const registerProfileRoutes = (app: FastifyInstance, store: DataStore) => {
  const loadProfile = requireProfile(store);

  app.get('/api/profiles', async () =>
    contractResponse(profilesResponseSchema, { profiles: store.listProfiles() })
  );

  app.post('/api/profiles', async (request, reply) => {
    const body = request.body as { name?: unknown } | undefined;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return reply.code(400).send({ error: 'Profile name is required.' });
    }

    return reply.code(201).send({ profile: store.createProfile(name) });
  });

  app.delete('/api/profiles/:id', { preHandler: loadProfile }, async (request, reply) => {
    const id = request.profileId!;

    if (store.countProfiles() <= 1) {
      return reply.code(400).send({ error: 'Cannot remove the last profile.' });
    }

    store.deleteProfile(id);
    return { ok: true };
  });

  app.post('/api/profiles/:id/reset', { preHandler: loadProfile }, async (request) => {
    const id = request.profileId!;
    store.resetProfile(id);
    return {
      ok: true,
      tasksRevision: store.getTasksRevision(id),
      settingsRevision: store.getSettingsRevision(id)
    };
  });
};
