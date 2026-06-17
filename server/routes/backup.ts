import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../db.js';

export const registerBackupRoutes = (app: FastifyInstance, store: DataStore) => {
  app.get('/api/backup', async () => store.backup());
};
