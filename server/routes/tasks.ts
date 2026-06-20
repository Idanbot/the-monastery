import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import type { Task } from '../types.js';
import type { ZodType } from 'zod';
import { taskMutationPayloadSchema, tasksPayloadSchema } from '../validation.js';

const validateBody = <T>(schema: ZodType<T>, body: unknown) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: result.error.issues.map((issue: { message: string }) => issue.message).join('; ') };
  }
  return { data: result.data };
};

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

    const parsed = validateBody(tasksPayloadSchema, request.body);
    if ('error' in parsed) {
      request.log.warn({ profileId: id, validationError: parsed.error }, 'invalid tasks payload');
      return reply.code(400).send({ error: 'tasks array is required.' });
    }

    store.replaceTasks(id, parsed.data.tasks as Task[]);
    return { ok: true };
  });

  app.post('/api/profiles/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const parsed = validateBody(taskMutationPayloadSchema, request.body);
    if ('error' in parsed) {
      request.log.warn({ profileId: id, validationError: parsed.error }, 'invalid task create payload');
      return reply.code(400).send({ error: 'valid task object is required.' });
    }

    store.saveTask(id, parsed.data.task as Task, parsed.data.position);
    return reply.code(201).send({ ok: true, task: parsed.data.task });
  });

  app.patch('/api/profiles/:id/tasks/:taskId', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const parsed = validateBody(taskMutationPayloadSchema, request.body);
    if ('error' in parsed) {
      request.log.warn(
        { profileId: id, taskId, validationError: parsed.error },
        'invalid task update payload'
      );
      return reply.code(400).send({ error: 'valid task object is required.' });
    }
    if (parsed.data.task.id !== taskId) {
      return reply.code(400).send({ error: 'task id mismatch.' });
    }

    store.saveTask(id, parsed.data.task as Task, parsed.data.position);
    return { ok: true, task: parsed.data.task };
  });

  app.delete('/api/profiles/:id/tasks/:taskId', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    store.deleteTask(id, taskId);
    return { ok: true };
  });
};
