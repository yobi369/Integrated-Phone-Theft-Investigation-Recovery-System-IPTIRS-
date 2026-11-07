import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuditDigest } from './audit.js';
import { extractBearerToken } from './auth.js';
import { createCaseSchema } from './schemas.js';

test('case creation trims a valid summary and defaults priority', () => {
  const parsed = createCaseSchema.parse({
    category: 'phone_theft',
    summary: '  Synthetic device theft report  '
  });

  assert.equal(parsed.summary, 'Synthetic device theft report');
  assert.equal(parsed.priority, 'normal');
});

test('case creation rejects short summaries and unknown fields', () => {
  assert.equal(createCaseSchema.safeParse({ category: 'phone_theft', summary: 'short' }).success, false);
  assert.equal(createCaseSchema.safeParse({
    category: 'phone_theft',
    summary: 'A sufficiently long synthetic report',
    inventedLocation: 'Nairobi'
  }).success, false);
});

test('audit event digest is deterministic and changes with event data', () => {
  const event = {
    organizationId: '10000000-0000-4000-8000-000000000001',
    actorUserId: '20000000-0000-4000-8000-000000000001',
    requestId: 'request-123',
    action: 'case.created',
    targetType: 'case',
    targetId: '30000000-0000-4000-8000-000000000001',
    metadata: { priority: 'normal' },
    occurredAt: '2026-11-06T12:00:00.000Z'
  };

  const first = createAuditDigest(event);
  assert.equal(first, createAuditDigest(event));
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.notEqual(first, createAuditDigest({ ...event, metadata: { priority: 'high' } }));
  assert.equal(first, createAuditDigest({ ...event, metadata: { priority: 'normal' } }));
  assert.equal(
    createAuditDigest({ ...event, metadata: { priority: 'normal', category: 'phone_theft' } }),
    createAuditDigest({ ...event, metadata: { category: 'phone_theft', priority: 'normal' } })
  );
});

test('bearer token extraction accepts only a single bearer credential', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('Basic abc'), null);
  assert.equal(extractBearerToken('Bearer token with-spaces'), null);
  assert.equal(extractBearerToken(undefined), null);
});
