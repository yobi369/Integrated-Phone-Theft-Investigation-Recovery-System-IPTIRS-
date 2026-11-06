import { Pool } from 'pg';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createTokenVerifier } from './auth.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });

  const app = await buildApp({
    config,
    pool,
    verifyToken: createTokenVerifier({
      issuer: config.oidcIssuer,
      audience: config.oidcAudience,
      jwksUrl: config.oidcJwksUrl
    })
  });

  const shutdown = async () => {
    await app.close();
    await pool.end();
  };

  process.once('SIGTERM', () => { void shutdown(); });
  process.once('SIGINT', () => { void shutdown(); });

  await app.listen({ host: '0.0.0.0', port: config.port });
}

main().catch((error: unknown) => {
  // Do not print environment variables or configuration values.
  process.stderr.write('IPTIRS API failed to start: ' +
    (error instanceof Error ? error.message : 'unknown error') + '\n');
  process.exitCode = 1;
});
