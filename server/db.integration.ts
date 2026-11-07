import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { Pool } from 'pg';
import { buildApp } from './app.js';
import { withTenantContext } from './db.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the PostgreSQL API integration test.');
}

const organizationId = '10000000-0000-4000-8000-000000000001';
const pool = new Pool({ connectionString: databaseUrl, max: 3 });
const app = await buildApp({
  config: { nodeEnv: 'test', corsOrigins: ['http://localhost:3000'], rateLimitMax: 100 },
  pool,
  verifyToken: async (token) => {
    const subjects: Record<string, string> = {
      'alpha-investigator': 'test|alpha',
      'alpha-reporter': 'test|alpha-reporter',
      'alpha-auditor': 'test|alpha-auditor',
      'alpha-investigator-2': 'test|alpha-investigator-2'
    };
    const subject = subjects[token];
    if (!subject) throw new Error('Invalid synthetic test token');
    return { subject };
  }
});

after(async () => {
  await app.close();
  await pool.end();
});

test('authenticated membership resolves through verified subject and RLS context', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/me',
    headers: {
      authorization: 'Bearer alpha-investigator',
      'x-organization-id': organizationId
    }
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.data.role, 'investigator');
  assert.equal(body.data.organization.slug, 'demo-alpha');
});

test('case creation writes the case, event, and auditable digest atomically', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/cases',
    headers: {
      authorization: 'Bearer alpha-investigator',
      'x-organization-id': organizationId
    },
    payload: {
      category: 'phone_theft',
      priority: 'normal',
      summary: 'Synthetic API integration case for the database-backed workflow.'
    }
  });

  assert.equal(response.statusCode, 201);
  const created = response.json().data;
  assert.match(created.case_reference, /^IPT-\d{6}-[A-F0-9]{8}$/);

  const audit = await withTenantContext(
    pool,
    'test|alpha-auditor',
    organizationId,
    async (client) => {
      const result = await client.query(
        'SELECT request_id, event_hash FROM audit_events WHERE target_id = $1 AND action = $2',
        [created.id, 'case.created']
      );
      return result.rows[0];
    }
  );

  assert.ok(audit);
  assert.equal(typeof audit.request_id, 'string');
  assert.match(audit.event_hash, /^[0-9a-f]{64}$/);
});


test('case details, status workflow, assignment lifecycle, and timeline are auditable', async () => {
  const headers = {
    authorization: 'Bearer alpha-investigator',
    'x-organization-id': organizationId
  };
  const create = await app.inject({
    method: 'POST',
    url: '/v1/cases',
    headers,
    payload: {
      category: 'phone_theft',
      priority: 'high',
      summary: 'Synthetic workflow case for case-management acceptance testing.'
    }
  });
  assert.equal(create.statusCode, 201);
  const caseId = create.json().data.id as string;

  const initialDetail = await app.inject({ method: 'GET', url: `/v1/cases/${caseId}`, headers });
  assert.equal(initialDetail.statusCode, 200);
  assert.equal(initialDetail.json().data.status, 'submitted');
  assert.ok(initialDetail.json().data.timeline.some((event: { event_type: string }) => event.event_type === 'case_created'));

  const triage = await app.inject({
    method: 'PATCH',
    url: `/v1/cases/${caseId}/status`,
    headers,
    payload: { status: 'under_review', reason: 'Initial triage completed by the assigned investigator.' }
  });
  assert.equal(triage.statusCode, 200);
  assert.equal(triage.json().data.status, 'under_review');

  const invalidTransition = await app.inject({
    method: 'PATCH',
    url: `/v1/cases/${caseId}/status`,
    headers,
    payload: { status: 'recovered', reason: 'This transition must not skip acceptance and investigation.' }
  });
  assert.equal(invalidTransition.statusCode, 409);

  const accepted = await app.inject({
    method: 'PATCH',
    url: `/v1/cases/${caseId}/status`,
    headers,
    payload: { status: 'accepted', reason: 'The report passed the initial case acceptance review.' }
  });
  assert.equal(accepted.statusCode, 200);

  const started = await app.inject({
    method: 'PATCH',
    url: `/v1/cases/${caseId}/status`,
    headers,
    payload: { status: 'in_progress', reason: 'Investigation work has formally started.' }
  });
  assert.equal(started.statusCode, 200);

  const assignment = await app.inject({
    method: 'POST',
    url: `/v1/cases/${caseId}/assignments`,
    headers,
    payload: {
      assigneeUserId: '20000000-0000-4000-8000-000000000005',
      reason: 'Assign a second synthetic investigator for independent review.'
    }
  });
  assert.equal(assignment.statusCode, 201);
  const assignmentId = assignment.json().data.id as string;

  const released = await app.inject({
    method: 'DELETE',
    url: `/v1/cases/${caseId}/assignments/${assignmentId}`,
    headers
  });
  assert.equal(released.statusCode, 200);
  assert.equal(released.json().data.status, 'released');

  const detail = await app.inject({ method: 'GET', url: `/v1/cases/${caseId}`, headers });
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json().data.status, 'in_progress');
  assert.equal(detail.json().data.assignments.length, 1);
  assert.equal(detail.json().data.assignments[0].status, 'released');
  const eventTypes = detail.json().data.timeline.map((event: { event_type: string }) => event.event_type);
  assert.ok(eventTypes.includes('status_changed'));
  assert.ok(eventTypes.includes('case_assigned'));
  assert.ok(eventTypes.includes('case_assignment_released'));

  const audit = await withTenantContext(pool, 'test|alpha-auditor', organizationId, async (client) => {
    const result = await client.query(
      "SELECT action FROM audit_events WHERE target_id = $1 AND action IN ('case.status_changed', 'case.assigned', 'case.assignment_released')",
      [caseId]
    );
    return result.rows.map((row: { action: string }) => row.action);
  });
  assert.ok(audit.includes('case.status_changed'));
  assert.ok(audit.includes('case.assigned'));
  assert.ok(audit.includes('case.assignment_released'));
});

test('reporters cannot change case status or create investigator assignments', async () => {
  const headers = {
    authorization: 'Bearer alpha-reporter',
    'x-organization-id': organizationId
  };
  const status = await app.inject({
    method: 'PATCH',
    url: '/v1/cases/30000000-0000-4000-8000-000000000003/status',
    headers,
    payload: { status: 'under_review', reason: 'Reporter should not change operational case status.' }
  });
  assert.equal(status.statusCode, 403);

  const assignment = await app.inject({
    method: 'POST',
    url: '/v1/cases/30000000-0000-4000-8000-000000000003/assignments',
    headers,
    payload: {
      assigneeUserId: '20000000-0000-4000-8000-000000000005',
      reason: 'Reporter must not assign an investigator to this case.'
    }
  });
  assert.equal(assignment.statusCode, 403);
});

test('reporter can only list their own cases', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/cases',
    headers: {
      authorization: 'Bearer alpha-reporter',
      'x-organization-id': organizationId
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.length, 1);
  assert.equal(response.json().data[0].case_reference, 'ALPHA-002');
});

test('membership cannot be selected by changing the organization header', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/cases',
    headers: {
      authorization: 'Bearer alpha-investigator',
      'x-organization-id': '10000000-0000-4000-8000-000000000002'
    }
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error.code, 'forbidden');
});

test('case API rejects malformed payloads', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/cases',
    headers: {
      authorization: 'Bearer alpha-investigator',
      'x-organization-id': organizationId
    },
    payload: {
      category: 'phone_theft',
      summary: 'short',
      hiddenField: 'must be rejected'
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, 'invalid_request');
});
