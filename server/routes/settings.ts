import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import { settingsPayloadSchema, validationErrorResponse } from '../validation.js';
import { rejectStaleSettingsRevision } from './revisions.js';
import { contractResponse, settingsResponseSchema } from '../../shared/apiContracts.js';
import { requireProfile } from './profileGuard.js';

export const registerSettingsRoutes = (app: FastifyInstance, store: DataStore) => {
  const loadProfile = requireProfile(store);

  app.get('/api/profiles/:id/settings', { preHandler: loadProfile }, async (request) => {
    const id = request.profileId!;
    return contractResponse(settingsResponseSchema, {
      settings: store.getSettings(id),
      revision: store.getSettingsRevision(id)
    });
  });

  app.put('/api/profiles/:id/settings', { preHandler: loadProfile }, async (request, reply) => {
    const id = request.profileId!;

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
