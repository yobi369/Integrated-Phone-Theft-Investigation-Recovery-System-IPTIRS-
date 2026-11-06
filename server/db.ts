import type { Pool, PoolClient } from 'pg';

export class RequestContextError extends Error {
  constructor(
    public readonly statusCode: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = 'RequestContextError';
  }
}

export interface TenantContext {
  userId: string;
  role: 'organization_admin' | 'investigator' | 'operator_liaison' | 'auditor' | 'reporter';
}

export async function withTenantContext<T>(
  pool: Pool,
  subject: string,
  organizationId: string,
  operation: (client: PoolClient, context: TenantContext) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // The subject comes from a verified OIDC token, never from request input.
    await client.query(
      "SELECT set_config('app.current_auth_subject', $1, true)",
      [subject]
    );

    const userResult = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
      [subject]
    );
    const user = userResult.rows[0];
    if (!user) {
      throw new RequestContextError(403, 'The authenticated account is not provisioned in IPTIRS.');
    }

    await client.query(
      "SELECT set_config('app.current_user_id', $1, true)",
      [user.id]
    );
    await client.query(
      "SELECT set_config('app.current_organization_id', $1, true)",
      [organizationId]
    );

    const membershipResult = await client.query<{
      role: TenantContext['role'];
    }>(
      "SELECT role FROM memberships WHERE organization_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1",
      [organizationId, user.id]
    );
    const membership = membershipResult.rows[0];
    if (!membership) {
      throw new RequestContextError(403, 'No active membership exists for this organization.');
    }

    const result = await operation(client, {
      userId: user.id,
      role: membership.role
    });

    await client.query('COMMIT');
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the original request error.
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
