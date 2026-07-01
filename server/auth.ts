import { timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Single-owner token authentication.
 *
 * The app has no multi-user model — the deployment boundary (e.g. Cloudflare
 * Access) is the intended authentication layer. For self-hosters who cannot
 * put an identity-aware proxy in front, setting `THE_MONASTERY_OWNER_TOKEN`
 * enables a lightweight bearer-token gate over every `/api/*` route except
 * `/api/health` (which must remain open so health probes and the client's
 * auth-required discovery both work).
 *
 * The token is compared with `timingSafeEqual` to avoid timing oracles. When
 * the env var is unset the guard is a no-op, preserving the open-by-default
 * behaviour existing deployments rely on.
 */
const OWNER_TOKEN_ENV = 'THE_MONASTERY_OWNER_TOKEN';

export const readOwnerToken = (env: Record<string, string | undefined> = process.env) => {
  const token = env[OWNER_TOKEN_ENV];
  return token && token.trim().length > 0 ? token.trim() : '';
};

const safeEqual = (a: string, b: string) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return cryptoTimingSafeEqual(aBuffer, bBuffer);
};

const extractToken = (request: FastifyRequest): string | null => {
  const authHeader = request.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const ownerHeader = request.headers['x-owner-token'];
  if (typeof ownerHeader === 'string') return ownerHeader.trim();
  return null;
};

export const createOwnerTokenGuard = (token: string) => {
  if (!token) return null;
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Health must remain open so probes and the client's auth-required
    // discovery both work without a credential.
    if (request.url.startsWith('/api/health')) return;
    const provided = extractToken(request);
    if (provided && safeEqual(provided, token)) return;
    reply.code(401).send({ error: 'Owner token required.', authRequired: true });
  };
};
