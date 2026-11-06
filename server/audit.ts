import { createHash } from 'node:crypto';

export interface AuditDigestInput {
  organizationId: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

/**
 * Computes a deterministic SHA-256 digest for one audit event.
 * This is an event integrity digest, not a tamper-proof external anchor or
 * a chained audit log. Independent checkpointing and verification are needed.
 */
export function createAuditDigest(event: AuditDigestInput): string {
  const canonical = [
    event.organizationId,
    event.actorUserId,
    event.action,
    event.targetType,
    event.targetId,
    event.occurredAt,
    JSON.stringify(event.metadata)
  ].join('\n');

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
