import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import type { Pool, PoolClient } from 'pg';
import { z, ZodError } from 'zod';
import { randomUUID } from 'node:crypto';
import { createAuditDigest } from './audit.js';
import { extractBearerToken, type TokenVerifier } from './auth.js';
import { RequestContextError, withTenantContext, type TenantContext } from './db.js';
import {
  createCaseAssignmentSchema,
  createAuthorizationSchema,
  createCaseSchema,
  decideAuthorizationSchema,
  listCasesQuerySchema,
  organizationIdSchema,
  updateCaseStatusSchema
} from './schemas.js';
import type { AppConfig } from './config.js';
import { registerEvidenceRoutes } from './evidence.js';

interface AppDependencies {
  config: Pick<AppConfig, 'nodeEnv' | 'corsOrigins' | 'rateLimitMax'>;
  pool: Pool;
  verifyToken: TokenVerifier;
}

const errorResponse = (code: string, message: string) => ({ error: { code, message } });

class CaseWorkflowConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaseWorkflowConflictError';
  }
}
const staffRoles = new Set(['organization_admin', 'investigator']);
const authorizationApproverRoles = new Set(['organization_admin', 'authorization_approver']);

const statusTransitions: Record<string, string[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['accepted', 'rejected'],
  accepted: ['in_progress'],
  in_progress: ['pending_external_response', 'recovered'],
  pending_external_response: ['in_progress', 'recovered'],
  recovered: ['in_progress', 'closed'],
  closed: [],
  rejected: []
};

async function writeCaseEvent(
  client: PoolClient,
  organizationId: string,
  actorUserId: string,
  caseId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await client.query(
    'INSERT INTO case_events (organization_id, case_id, actor_user_id, event_type, description, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb)',
    [organizationId, caseId, actorUserId, eventType, description, JSON.stringify(metadata)]
  );
}

async function writeAudit(
  client: PoolClient,
  organizationId: string,
  actorUserId: string,
  requestId: string,
  action: string,
  caseId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const occurredAt = new Date().toISOString();
  const eventHash = createAuditDigest({
    organizationId,
    actorUserId,
    requestId,
    action,
    targetType: 'case',
    targetId: caseId,
    metadata,
    occurredAt
  });
  await client.query(
    'INSERT INTO audit_events (organization_id, actor_user_id, request_id, action, target_type, target_id, metadata, event_hash, occurred_at) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)',
    [organizationId, actorUserId, requestId, action, 'case', caseId, JSON.stringify(metadata), eventHash, occurredAt]
  );
}

function assertStaff(context: TenantContext): void {
  if (!staffRoles.has(context.role)) {
    throw new RequestContextError(403, 'An investigator or organization administrator role is required.');
  }
}

function assertAuthorizationApprover(context: TenantContext): void {
  if (!authorizationApproverRoles.has(context.role)) {
    throw new RequestContextError(403, 'An independent authorization approver role is required.');
  }
}

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Organization-Id']
  });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 5, parts: 6 }, throwFileSizeLimit: true });
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
    if (error instanceof CaseWorkflowConflictError || (error as { code?: string }).code === '23514') {
      return reply.code(409).send(errorResponse('workflow_conflict', 'The requested case workflow transition is not valid.'));
    }
    const databaseCode = (error as { code?: string }).code;
    if (databaseCode === '42501') {
      return reply.code(403).send(errorResponse('forbidden', 'The requested authorization action is not permitted.'));
    }
    if (databaseCode === '02000') {
      return reply.code(404).send(errorResponse('not_found', 'The authorization request was not found.'));
    }
    if (databaseCode === '22023') {
      return reply.code(400).send(errorResponse('invalid_request', 'The authorization decision is invalid.'));
    }
    if (databaseCode === '23505') {
      return reply.code(409).send(errorResponse('conflict', 'The requested case assignment already exists.'));
    }

    request.log.error({ requestId: request.id, errorType: error instanceof Error ? error.name : 'unknown' }, 'Request failed');
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
    return withTenantContext(dependencies.pool, request.identity!.subject, request.organizationId!, async (client, context) => {
      const result = await client.query(
        'SELECT id, slug, name FROM organizations WHERE id = $1 LIMIT 1',
        [request.organizationId]
      );
      const organization = result.rows[0];
      if (!organization) throw new RequestContextError(403, 'The organization is not available to this account.');
      return { data: { userId: context.userId, role: context.role, organization } };
    });
  });

  app.get('/v1/cases', { preHandler: authenticate }, async (request) => {
    const query = listCasesQuerySchema.safeParse(request.query);
    if (!query.success) throw query.error;

    return withTenantContext(dependencies.pool, request.identity!.subject, request.organizationId!, async (client) => {
      const result = await client.query(
        `SELECT c.id, c.case_reference, c.category, c.status, c.priority, c.summary,
                c.created_at, c.updated_at,
                (SELECT count(*)::int FROM case_assignments a
                  WHERE a.organization_id = c.organization_id AND a.case_id = c.id AND a.status = 'active') AS active_assignment_count
           FROM cases c
          WHERE ($2::text IS NULL OR c.status = $2)
          ORDER BY c.created_at DESC LIMIT $1`,
        [query.data.limit, query.data.status ?? null]
      );
      return { data: result.rows };
    });
  });

  app.post('/v1/cases', { preHandler: authenticate }, async (request, reply) => {
    const body = createCaseSchema.safeParse(request.body);
    if (!body.success) throw body.error;

    const organizationId = request.organizationId!;
    const created = await withTenantContext(
      dependencies.pool,
      request.identity!.subject,
      organizationId,
      async (client, context) => {
        const caseReference = 'IPT-' +
          new Date().toISOString().slice(0, 7).replace('-', '') +
          '-' + randomUUID().slice(0, 8).toUpperCase();

        const result = await client.query(
          'INSERT INTO cases (organization_id, case_reference, created_by_user_id, category, priority, summary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, case_reference, category, status, priority, summary, created_at, updated_at',
          [organizationId, caseReference, context.userId, body.data.category, body.data.priority, body.data.summary]
        );
        const newCase = result.rows[0];

        await writeCaseEvent(client, organizationId, context.userId, newCase.id, 'case_created',
          'Case created by an authenticated organization member', { caseReference, category: body.data.category });
        await writeAudit(client, organizationId, context.userId, request.id, 'case.created', newCase.id,
          { caseReference, category: body.data.category, priority: body.data.priority });
        return newCase;
      }
    );
    return reply.code(201).send({ data: created });
  });

  app.get('/v1/cases/:caseId', { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ caseId: z.string().uuid() }).strict().safeParse(request.params);
    if (!params.success) throw params.error;

    return withTenantContext(dependencies.pool, request.identity!.subject, request.organizationId!, async (client) => {
      const caseResult = await client.query(
        'SELECT id, case_reference, category, status, priority, summary, created_at, updated_at FROM cases WHERE id = $1 LIMIT 1',
        [params.data.caseId]
      );
      const caseRecord = caseResult.rows[0];
      if (!caseRecord) return reply.code(404).send(errorResponse('not_found', 'The case was not found.'));

      const [assignments, timeline, authorizations] = await Promise.all([
        client.query(
          `SELECT id, assigned_to_user_id, assigned_by_user_id, assignment_reason, status, assigned_at, released_at
             FROM case_assignments WHERE case_id = $1 ORDER BY assigned_at DESC`,
          [params.data.caseId]
        ),
        client.query(
          `SELECT id, actor_user_id, event_type, description, metadata, occurred_at
             FROM case_events WHERE case_id = $1 ORDER BY occurred_at ASC, id ASC`,
          [params.data.caseId]
        ),
        client.query(
          `SELECT id, requested_by_user_id, purpose, requested_action, legal_authority_reference,
                  scope, valid_until, status, approved_by_user_id, approved_at,
                  decided_by_user_id, decided_at, decision_reason, created_at
             FROM authorization_records WHERE case_id = $1 ORDER BY created_at DESC`,
          [params.data.caseId]
        )
      ]);
      return reply.send({
        data: {
          ...caseRecord,
          assignments: assignments.rows,
          timeline: timeline.rows,
          authorizations: authorizations.rows
        }
      });
    });
  });

  app.patch('/v1/cases/:caseId/status', { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ caseId: z.string().uuid() }).strict().safeParse(request.params);
    const body = updateCaseStatusSchema.safeParse(request.body);
    if (!params.success) throw params.error;
    if (!body.success) throw body.error;

    const updated = await withTenantContext(dependencies.pool, request.identity!.subject, request.organizationId!, async (client, context) => {
      assertStaff(context);
      const currentResult = await client.query(
        'SELECT id, status, case_reference FROM cases WHERE id = $1 FOR UPDATE',
        [params.data.caseId]
      );
      const current = currentResult.rows[0];
      if (!current) return null;

      const allowed = statusTransitions[String(current.status)] ?? [];
      if (!allowed.includes(body.data.status)) {
        throw new CaseWorkflowConflictError('The requested case status transition is not permitted.');
      }

      const result = await client.query(
        'UPDATE cases SET status = $2 WHERE id = $1 RETURNING id, case_reference, status, priority, updated_at',
        [params.data.caseId, body.data.status]
      );
      const record = result.rows[0];
      const metadata = { from: current.status, to: body.data.status, reason: body.data.reason };
      await writeCaseEvent(client, request.organizationId!, context.userId, record.id, 'status_changed',
        body.data.reason, metadata);
      await writeAudit(client, request.organizationId!, context.userId, request.id, 'case.status_changed', record.id, metadata);
      return record;
    });
    if (!updated) return reply.code(404).send(errorResponse('not_found', 'The case was not found.'));
    return { data: updated };
  });

  app.post('/v1/cases/:caseId/assignments', { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ caseId: z.string().uuid() }).strict().safeParse(request.params);
    const body = createCaseAssignmentSchema.safeParse(request.body);
    if (!params.success) throw params.error;
    if (!body.success) throw body.error;

    const created = await withTenantContext(dependencies.pool, request.identity!.subject, request.organizationId!, async (client, context) => {
      assertStaff(context);

      const target = await client.query(
        "SELECT user_id, role FROM memberships WHERE user_id = $1 AND status = 'active' AND role IN ('organization_admin', 'investigator') LIMIT 1",
        [body.data.assigneeUserId]
      );
      if (!target.rows[0]) throw new RequestContextError(403, 'The assignee must be an active investigator or organization administrator in this organization.');

      const caseResult = await client.query('SELECT id FROM cases WHERE id = $1', [params.data.caseId]);
      if (!caseResult.rows[0]) return null;

      const result = await client.query(
        `INSERT INTO case_assignments
          (organization_id, case_id, assigned_to_user_id, assigned_by_user_id, assignment_reason)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, case_id, assigned_to_user_id, assigned_by_user_id, assignment_reason, status, assigned_at`,
        [request.organizationId, params.data.caseId, body.data.assigneeUserId, context.userId, body.data.reason]
      );
      await writeCaseEvent(client, request.organizationId!, context.userId, params.data.caseId, 'case_assigned',
        body.data.reason, { assignmentId: result.rows[0].id, assigneeUserId: body.data.assigneeUserId });
      await writeAudit(client, request.organizationId!, context.userId, request.id, 'case.assigned', params.data.caseId,
        { assignmentId: result.rows[0].id, assigneeUserId: body.data.assigneeUserId });
      return result.rows[0];
    });

    if (!created) return reply.code(404).send(errorResponse('not_found', 'The case was not found.'));
    return reply.code(201).send({ data: created });
  });

  app.delete('/v1/cases/:caseId/assignments/:assignmentId', { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ caseId: z.string().uuid(), assignmentId: z.string().uuid() }).strict().safeParse(request.params);
    if (!params.success) throw params.error;

    const released = await withTenantContext(dependencies.pool, request.identity!.subject, request.organizationId!, async (client, context) => {
      assertStaff(context);
      const result = await client.query(
        `UPDATE case_assignments SET status = 'released', released_at = now()
          WHERE id = $1 AND case_id = $2 AND status = 'active'
          RETURNING id, case_id, assigned_to_user_id, status, released_at`,
        [params.data.assignmentId, params.data.caseId]
      );
      if (!result.rows[0]) return null;

      await writeCaseEvent(client, request.organizationId!, context.userId, params.data.caseId, 'case_assignment_released',
        'Case assignment released by an authorized investigator', { assignmentId: params.data.assignmentId });
      await writeAudit(client, request.organizationId!, context.userId, request.id, 'case.assignment_released',
        params.data.caseId, { assignmentId: params.data.assignmentId });
      return result.rows[0];
    });

    if (!released) return reply.code(404).send(errorResponse('not_found', 'The active case assignment was not found.'));
    return { data: released };
  });

  app.post('/v1/cases/:caseId/authorizations', { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ caseId: z.string().uuid() }).strict().safeParse(request.params);
    const body = createAuthorizationSchema.safeParse(request.body);
    if (!params.success) throw params.error;
    if (!body.success) throw body.error;
    const validUntil = new Date(body.data.validUntil);
    if (!Number.isFinite(validUntil.getTime()) || validUntil.getTime() <= Date.now()) {
      return reply.code(400).send(errorResponse('invalid_request', 'Authorization validity must end in the future.'));
    }

    const created = await withTenantContext(
      dependencies.pool,
      request.identity!.subject,
      request.organizationId!,
      async (client, context) => {
        assertStaff(context);
        const caseResult = await client.query('SELECT id FROM cases WHERE id = $1', [params.data.caseId]);
        if (!caseResult.rows[0]) return null;

        const result = await client.query(
          `INSERT INTO authorization_records
            (organization_id, case_id, requested_by_user_id, purpose, requested_action,
             legal_authority_reference, scope, valid_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
           RETURNING id, case_id, requested_by_user_id, purpose, requested_action,
                     legal_authority_reference, scope, valid_until, status, created_at`,
          [
            request.organizationId,
            params.data.caseId,
            context.userId,
            body.data.purpose,
            body.data.requestedAction,
            body.data.legalAuthorityReference,
            JSON.stringify(body.data.scope),
            validUntil.toISOString()
          ]
        );
        const authorization = result.rows[0];
        await writeCaseEvent(
          client, request.organizationId!, context.userId, params.data.caseId,
          'authorization_requested',
          'Sensitive operator request submitted for independent authorization review.',
          { authorizationId: authorization.id, requestedAction: body.data.requestedAction, validUntil: validUntil.toISOString() }
        );
        await writeAudit(
          client, request.organizationId!, context.userId, request.id,
          'authorization.requested', params.data.caseId,
          { authorizationId: authorization.id, requestedAction: body.data.requestedAction, validUntil: validUntil.toISOString() }
        );
        return authorization;
      }
    );
    if (!created) return reply.code(404).send(errorResponse('not_found', 'The case was not found.'));
    return reply.code(201).send({ data: created });
  });

  app.post('/v1/authorizations/:authorizationId/decision', { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ authorizationId: z.string().uuid() }).strict().safeParse(request.params);
    const body = decideAuthorizationSchema.safeParse(request.body);
    if (!params.success) throw params.error;
    if (!body.success) throw body.error;

    const decision = await withTenantContext(
      dependencies.pool,
      request.identity!.subject,
      request.organizationId!,
      async (client, context) => {
        assertAuthorizationApprover(context);
        const result = await client.query(
          'SELECT * FROM decide_authorization_record($1, $2, $3)',
          [params.data.authorizationId, body.data.decision, body.data.reason]
        );
        const record = result.rows[0];
        if (!record) return null;

        const eventType = body.data.decision === 'approved' ? 'authorization_approved' : 'authorization_rejected';
        await writeCaseEvent(
          client, request.organizationId!, context.userId, record.case_id,
          eventType, body.data.reason,
          { authorizationId: record.id, decision: body.data.decision, decidedAt: record.decided_at }
        );
        await writeAudit(
          client, request.organizationId!, context.userId, request.id,
          `authorization.${body.data.decision}`, record.case_id,
          { authorizationId: record.id, decision: body.data.decision, decidedAt: record.decided_at }
        );
        return record;
      }
    );
    if (!decision) return reply.code(404).send(errorResponse('not_found', 'The authorization request was not found.'));
    return { data: decision };
  });

  await registerEvidenceRoutes(app, { pool: dependencies.pool, verifyToken: dependencies.verifyToken });

  return app;
}
