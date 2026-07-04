import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance, type FastifyRequest } from 'fastify';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };
import { createAlertScheduler } from './alertScheduler.js';
import { createOwnerTokenGuard, readOwnerToken } from './auth.js';
import { createDataStore } from './db.js';
import { readIntegrationConfig, registerIntegrationRoutes } from './integrationRoutes.js';
import { registerBackupRoutes } from './routes/backup.js';
import { registerProfileRoutes } from './routes/profiles.js';
import { registerSearchRoutes } from './routes/search.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerTaskRoutes } from './routes/tasks.js';
import type { ServerOptions } from './types.js';

const projectRoot = process.cwd();
const defaultPublicDir = join(projectRoot, 'dist');
const defaultDataDir = process.env.THE_MONASTERY_DATA_DIR || join(projectRoot, 'data');
const defaultDbPath = process.env.THE_MONASTERY_DB_PATH || join(defaultDataDir, 'the-monastery.sqlite');
const appVersion = process.env.THE_MONASTERY_VERSION || packageJson.version;
const buildRef = process.env.THE_MONASTERY_BUILD_REF || process.env.GITHUB_SHA || 'local';
const ownerToken = readOwnerToken();
const defaultApiRateLimit = {
  max: Number(process.env.THE_MONASTERY_API_RATE_LIMIT_MAX || 300),
  timeWindow: process.env.THE_MONASTERY_API_RATE_LIMIT_WINDOW || '1 minute',
  errorResponseBuilder: () => Object.assign(new Error('Too many requests.'), { statusCode: 429 }),
  onExceeded: (request: FastifyRequest, key: string) => {
    request.log.warn({ key, method: request.method, url: request.url }, 'rate limit exceeded');
  }
};
export const createApp = (options: ServerOptions = {}): FastifyInstance => {
  const store = createDataStore(options.dbPath || defaultDbPath);
  const token = options.ownerToken !== undefined ? options.ownerToken : ownerToken;
  const ownerTokenGuard = createOwnerTokenGuard(token);
  const bodyLimit = options.bodyLimit ?? Number(process.env.THE_MONASTERY_BODY_LIMIT || 1024 * 1024);
  const integrations = options.integrations ?? readIntegrationConfig();
  const alertScheduler =
    options.alertScheduler === false
      ? null
      : createAlertScheduler(store, integrations, options.integrationFetch, options.alertScheduler);
  const app = Fastify({
    logger: options.logger ?? {
      level: process.env.LOG_LEVEL || 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie']
    },
    bodyLimit
  });

  app.addHook('onClose', async () => {
    alertScheduler?.stop();
    store.close();
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500;
    request.log.error({ err: error, statusCode, method: request.method, url: request.url }, 'request failed');
    reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error.' : error.message
    });
  });

  app.register(async (api) => {
    if (options.apiRateLimit !== false) {
      await api.register(fastifyRateLimit, {
        ...defaultApiRateLimit,
        ...(options.apiRateLimit ?? {})
      });
    }

    api.get(
      '/api/health',
      options.apiRateLimit === false ? {} : { preHandler: api.rateLimit() },
      async () => ({
        ok: true,
        version: appVersion,
        buildRef,
        uptimeSeconds: Math.round(process.uptime()),
        authRequired: Boolean(token)
      })
    );

    // Every authenticated route is gated by the owner token when configured.
    if (ownerTokenGuard) {
      api.addHook('preHandler', ownerTokenGuard);
    }

    registerProfileRoutes(api, store);
    registerSearchRoutes(api, store);
    registerTaskRoutes(api, store);
    registerSettingsRoutes(api, store);
    registerBackupRoutes(api, store);
    registerIntegrationRoutes(api, integrations, options.integrationFetch);
  });

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

  alertScheduler?.start();
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
