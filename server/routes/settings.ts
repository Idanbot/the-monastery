import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import { settingsPayloadSchema } from '../validation.js';

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

    const parsed = settingsPayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      request.log.warn(
        { profileId: id, validationError: parsed.error.issues.map((issue) => issue.message).join('; ') },
        'invalid settings payload'
      );
      return reply.code(400).send({ error: 'settings object is required.' });
    }

    store.saveSettings(id, parsed.data.settings);
    return { ok: true };
  });
};
