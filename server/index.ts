import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };
import { createDataStore } from './db.js';
import { registerBackupRoutes } from './routes/backup.js';
import { registerProfileRoutes } from './routes/profiles.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerTaskRoutes } from './routes/tasks.js';
import type { ServerOptions } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const defaultPublicDir = join(projectRoot, 'dist');
const defaultDataDir = process.env.THE_MONASTERY_DATA_DIR || join(projectRoot, 'data');
const defaultDbPath = process.env.THE_MONASTERY_DB_PATH || join(defaultDataDir, 'the-monastery.sqlite');
const appVersion = process.env.THE_MONASTERY_VERSION || packageJson.version;
const buildRef = process.env.THE_MONASTERY_BUILD_REF || process.env.GITHUB_SHA || 'local';

export const createApp = (options: ServerOptions = {}): FastifyInstance => {
  const store = createDataStore(options.dbPath || defaultDbPath);
  const app = Fastify({
    logger: options.logger ?? {
      level: process.env.LOG_LEVEL || 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie']
    }
  });

  app.addHook('onClose', async () => {
    store.close();
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500;
    request.log.error({ err: error, statusCode }, 'request failed');
    reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error.' : error.message
    });
  });

  app.get('/api/health', async () => ({
    ok: true,
    version: appVersion,
    buildRef,
    uptimeSeconds: Math.round(process.uptime()),
    storage: store.health()
  }));
  registerProfileRoutes(app, store);
  registerTaskRoutes(app, store);
  registerSettingsRoutes(app, store);
  registerBackupRoutes(app, store);

  app.register(fastifyStatic, {
    root: options.publicDir || defaultPublicDir,
    wildcard: false
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith('/api/')) {
      reply.code(404).send({ error: 'Not found.' });
      return;
    }

    reply.sendFile('index.html');
  });

  return app;
};

const isEntrypoint = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isEntrypoint) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const app = createApp();

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  app.listen({ port, host }).catch((error) => {
    app.log.error(error);
    void app.close().finally(() => process.exit(1));
  });
}
