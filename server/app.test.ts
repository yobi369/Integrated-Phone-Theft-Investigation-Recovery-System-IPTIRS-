import assert from 'node:assert/strict';
import test from 'node:test';
import type { Pool } from 'pg';
import { buildApp } from './app.js';

const fakePool = {
  query: async () => ({ rows: [{ value: 1 }], rowCount: 1 })
} as unknown as Pool;

test('liveness endpoint responds without touching the database', async () => {
  const app = await buildApp({
    config: { nodeEnv: 'test', corsOrigins: ['http://localhost:3000'], rateLimitMax: 100 },
    pool: fakePool,
    verifyToken: async () => ({ subject: 'synthetic-subject' })
  });

  const response = await app.inject({ method: 'GET', url: '/health/live' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
  await app.close();
});

test('case endpoints reject unauthenticated requests before database access', async () => {
  const app = await buildApp({
    config: { nodeEnv: 'test', corsOrigins: ['http://localhost:3000'], rateLimitMax: 100 },
    pool: fakePool,
    verifyToken: async () => ({ subject: 'synthetic-subject' })
  });

  const response = await app.inject({ method: 'GET', url: '/v1/cases' });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().error.code, 'unauthorized');
  await app.close();
});
