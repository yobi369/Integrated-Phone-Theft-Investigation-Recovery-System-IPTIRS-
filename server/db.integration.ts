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
      'alpha-auditor': 'test|alpha-auditor'
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
