import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { Pool } from 'pg';
import { z, ZodError } from 'zod';
import { randomUUID } from 'node:crypto';
import { createAuditDigest } from './audit.js';
import { extractBearerToken, type TokenVerifier } from './auth.js';
import { RequestContextError, withTenantContext } from './db.js';
import { createCaseSchema, listCasesQuerySchema, organizationIdSchema } from './schemas.js';
import type { AppConfig } from './config.js';

interface AppDependencies {
  config: Pick<AppConfig, 'nodeEnv' | 'corsOrigins' | 'rateLimitMax'>;
  pool: Pool;
  verifyToken: TokenVerifier;
}

const errorResponse = (code: string, message: string) => ({ error: { code, message } });

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: dependencies.config.nodeEnv === 'production' ? 'info' : 'debug',
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers.x-api-key'],
        censor: '[REDACTED]'
      }
    },
    bodyLimit: 1_000_000,
    trustProxy: false
  });

  app.decorateRequest('identity', null);
  app.decorateRequest('organizationId', null);

  await app.register(helmet);
  await app.register(cors, {
    origin: dependencies.config.corsOrigins,
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Organization-Id']
  });
  await app.register(rateLimit, {
    max: dependencies.config.rateLimitMax,
    timeWindow: '1 minute'
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send(errorResponse('invalid_request', 'The request did not pass validation.'));
    }
    if (error instanceof RequestContextError) {
      return reply.code(error.statusCode).send(
        errorResponse(error.statusCode === 401 ? 'unauthorized' : 'forbidden', error.message)
      );
    }

    request.log.error({ requestId: request.id, errorType: error.name }, 'Request failed');
    return reply.code(500).send(errorResponse('internal_error', 'The request could not be completed.'));
  });

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      return reply.code(401).send(errorResponse('unauthorized', 'A valid bearer token is required.'));
    }

    try {
      request.identity = await dependencies.verifyToken(token);
    } catch {
      return reply.code(401).send(errorResponse('unauthorized', 'The bearer token could not be verified.'));
    }

    const organizationHeader = request.headers['x-organization-id'];
    const parsedOrganization = organizationIdSchema.safeParse(
      typeof organizationHeader === 'string' ? organizationHeader : ''
    );
    if (!parsedOrganization.success) {
      return reply.code(400).send(errorResponse('invalid_organization', 'A valid X-Organization-Id header is required.'));
    }

    request.organizationId = parsedOrganization.data;
  };

  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    try {
      await dependencies.pool.query('SELECT 1');
      return { status: 'ready' };
    } catch {
      return reply.code(503).send(errorResponse('not_ready', 'The database is not available.'));
    }
  });

  app.get('/v1/me', { preHandler: authenticate }, async (request) => {
    const identity = request.identity!;
    const organizationId = request.organizationId!;

    return withTenantContext(dependencies.pool, identity.subject, organizationId, async (client, context) => {
      const result = await client.query(
        'SELECT id, slug, name FROM organizations WHERE id = $1 LIMIT 1',
        [organizationId]
      );
      const organization = result.rows[0];
      if (!organization) {
        throw new RequestContextError(403, 'The organization is not available to this account.');
      }

      return {
        data: {
          userId: context.userId,
          role: context.role,
          organization
        }
      };
    });
  });

  app.get('/v1/cases', { preHandler: authenticate }, async (request) => {
    const query = listCasesQuerySchema.safeParse(request.query);
    if (!query.success) throw query.error;

    return withTenantContext(
      dependencies.pool,
      request.identity!.subject,
      request.organizationId!,
      async (client) => {
        const result = await client.query(
          'SELECT id, case_reference, category, status, priority, summary, created_at, updated_at FROM cases ORDER BY created_at DESC LIMIT $1',
          [query.data.limit]
        );
        return { data: result.rows };
      }
    );
  });

  app.post('/v1/cases', { preHandler: authenticate }, async (request, reply) => {
    const body = createCaseSchema.safeParse(request.body);
    if (!body.success) throw body.error;

    const identity = request.identity!;
    const organizationId = request.organizationId!;

    const created = await withTenantContext(
      dependencies.pool,
      identity.subject,
      organizationId,
      async (client, context) => {
        const caseReference = 'IPT-' +
          new Date().toISOString().slice(0, 7).replace('-', '') +
          '-' + randomUUID().slice(0, 8).toUpperCase();

        const result = await client.query(
          'INSERT INTO cases (organization_id, case_reference, created_by_user_id, category, priority, summary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, case_reference, category, status, priority, summary, created_at',
          [organizationId, caseReference, context.userId, body.data.category, body.data.priority, body.data.summary]
        );
        const newCase = result.rows[0];

        await client.query(
          "INSERT INTO case_events (organization_id, case_id, actor_user_id, event_type, description, metadata) VALUES ($1, $2, $3, 'case_created', 'Case created by an authenticated organization member', $4::jsonb)",
          [organizationId, newCase.id, context.userId, JSON.stringify({ caseReference, category: body.data.category })]
        );

        const occurredAt = new Date().toISOString();
        const auditMetadata = {
          caseReference,
          category: body.data.category,
          priority: body.data.priority
        };
        const eventHash = createAuditDigest({
          organizationId,
          actorUserId: context.userId,
          action: 'case.created',
          targetType: 'case',
          targetId: newCase.id,
          metadata: auditMetadata,
          occurredAt
        });

        await client.query(
          "INSERT INTO audit_events (organization_id, actor_user_id, action, target_type, target_id, metadata, event_hash, occurred_at) VALUES ($1, $2, 'case.created', 'case', $3, $4::jsonb, $5, $6)",
          [organizationId, context.userId, newCase.id, JSON.stringify(auditMetadata), eventHash, occurredAt]
        );

        return newCase;
      }
    );

    return reply.code(201).send({ data: created });
  });

  return app;
}
