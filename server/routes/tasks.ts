import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';
import type { Task } from '../types.js';
import type { ZodType } from 'zod';
import { taskMutationPayloadSchema, tasksPayloadSchema, validationErrorResponse } from '../validation.js';
import { rejectStaleTasksRevision } from './revisions.js';
import { contractResponse, tasksResponseSchema } from '../../shared/apiContracts.js';

const validateBody = <T>(schema: ZodType<T>, body: unknown) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: result.error.issues ?? [] };
  }
  return { data: result.data };
};

export const registerTaskRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/profiles/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    return contractResponse(tasksResponseSchema, {
      tasks: store.listTasks(id),
      revision: store.getTasksRevision(id)
    });
  });

  app.put('/api/profiles/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const parsed = validateBody(tasksPayloadSchema, request.body);
    if ('error' in parsed) {
      request.log.warn({ profileId: id, validationError: parsed.error }, 'invalid tasks payload');
      return reply.code(400).send(validationErrorResponse(parsed.error));
    }
    if (rejectStaleTasksRevision(store, id, parsed.data.baseRevision, reply)) return;

    store.replaceTasks(id, parsed.data.tasks as Task[]);
    return { ok: true, revision: store.getTasksRevision(id) };
  });

  app.post('/api/profiles/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const parsed = validateBody(taskMutationPayloadSchema, request.body);
    if ('error' in parsed) {
      request.log.warn({ profileId: id, validationError: parsed.error }, 'invalid task create payload');
      return reply.code(400).send(validationErrorResponse(parsed.error));
    }
    if (rejectStaleTasksRevision(store, id, parsed.data.baseRevision, reply)) return;

    store.saveTask(id, parsed.data.task as Task, parsed.data.position);
    return reply.code(201).send({
      ok: true,
      task: parsed.data.task,
      revision: store.getTasksRevision(id)
    });
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
      return reply.code(400).send(validationErrorResponse(parsed.error));
    }
    if (parsed.data.task.id !== taskId) {
      return reply.code(400).send({ error: 'task id mismatch.' });
    }
    if (rejectStaleTasksRevision(store, id, parsed.data.baseRevision, reply)) return;

    store.saveTask(id, parsed.data.task as Task, parsed.data.position);
    return { ok: true, task: parsed.data.task, revision: store.getTasksRevision(id) };
  });

  app.delete('/api/profiles/:id/tasks/:taskId', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };

    if (!store.getProfile(id)) {
      return reply.code(404).send({ error: 'Profile not found.' });
    }

    const body = request.body as { baseRevision?: unknown } | undefined;
    const baseRevision = typeof body?.baseRevision === 'number' ? body.baseRevision : undefined;
    if (rejectStaleTasksRevision(store, id, baseRevision, reply)) return;

    store.deleteTask(id, taskId);
    return { ok: true, revision: store.getTasksRevision(id) };
  });
};
