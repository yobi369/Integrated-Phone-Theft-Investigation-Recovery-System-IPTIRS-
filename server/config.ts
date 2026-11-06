import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z.enum(['true', 'false']).optional(),
  OIDC_ISSUER: z.string().url(),
  OIDC_AUDIENCE: z.string().min(1),
  OIDC_JWKS_URL: z.string().url(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(120)
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  databaseSsl: boolean;
  oidcIssuer: string;
  oidcAudience: string;
  oidcJwksUrl: string;
  corsOrigins: string[];
  rateLimitMax: number;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.parse(environment);
  const databaseSsl = parsed.DATABASE_SSL
    ? parsed.DATABASE_SSL === 'true'
    : parsed.NODE_ENV === 'production';

  if (parsed.NODE_ENV === 'production' && !databaseSsl) {
    throw new Error('DATABASE_SSL must be enabled in production.');
  }

  const corsOrigins = parsed.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (corsOrigins.length === 0) {
    throw new Error('At least one CORS origin must be configured.');
  }

  for (const origin of corsOrigins) {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.protocol !== 'https:' && parsedOrigin.hostname !== 'localhost') {
      throw new Error('CORS origins must use HTTPS except for localhost development.');
    }
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    databaseSsl,
    oidcIssuer: parsed.OIDC_ISSUER,
    oidcAudience: parsed.OIDC_AUDIENCE,
    oidcJwksUrl: parsed.OIDC_JWKS_URL,
    corsOrigins,
    rateLimitMax: parsed.RATE_LIMIT_MAX
  };
}
