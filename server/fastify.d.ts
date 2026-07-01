import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the `requireProfile` preHandler after the `:id` profile resolves. */
    profileId?: string;
  }
}
