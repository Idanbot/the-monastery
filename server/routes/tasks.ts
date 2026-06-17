import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import type { Task } from '../types.js';

export const registerTaskRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/profiles/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    return { tasks: store.listTasks(id) };
  });

  app.put('/api/profiles/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const body = request.body as { tasks?: unknown } | undefined;
    if (!Array.isArray(body?.tasks)) {
      return reply.code(400).send({ error: 'tasks array is required.' });
    }

    store.replaceTasks(id, body.tasks as Task[]);
    return { ok: true };
  });
};
