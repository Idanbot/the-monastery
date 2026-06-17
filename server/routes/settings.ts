import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';

export const registerSettingsRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/profiles/:id/settings', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    return { settings: store.getSettings(id) };
  });

  app.put('/api/profiles/:id/settings', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const body = request.body as { settings?: unknown } | undefined;
    if (!body?.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
      return reply.code(400).send({ error: 'settings object is required.' });
    }

    store.saveSettings(id, body.settings);
    return { ok: true };
  });
};
