import type { TokenIdentity } from './auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    identity: TokenIdentity | null;
    organizationId: string | null;
  }
}
