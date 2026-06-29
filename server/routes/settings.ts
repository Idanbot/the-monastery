import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import { settingsPayloadSchema, validationErrorResponse } from '../validation.js';
import { rejectStaleSettingsRevision } from './revisions.js';
import { contractResponse, settingsResponseSchema } from '../../shared/apiContracts.js';

export const registerSettingsRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/profiles/:id/settings', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    return contractResponse(settingsResponseSchema, {
      settings: store.getSettings(id),
      revision: store.getSettingsRevision(id)
    });
  });

  app.put('/api/profiles/:id/settings', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const parsed = settingsPayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      request.log.warn({ profileId: id, validationError: parsed.error.issues }, 'invalid settings payload');
      return reply.code(400).send(validationErrorResponse(parsed.error.issues ?? []));
    }
    if (rejectStaleSettingsRevision(store, id, parsed.data.baseRevision, reply)) return;

    store.saveSettings(id, parsed.data.settings);
    return { ok: true, revision: store.getSettingsRevision(id) };
  });
};
