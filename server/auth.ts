import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface TokenIdentity {
  subject: string;
}

export type TokenVerifier = (token: string) => Promise<TokenIdentity>;

export function createTokenVerifier(options: {
  issuer: string;
  audience: string;
  jwksUrl: string;
}): TokenVerifier {
  const jwks = createRemoteJWKSet(new URL(options.jwksUrl));

  return async (token: string): Promise<TokenIdentity> => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: options.issuer,
      audience: options.audience,
      algorithms: ['RS256', 'ES256']
    });

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('The verified identity token does not contain a subject.');
    }

    return { subject: payload.sub };
  };
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
