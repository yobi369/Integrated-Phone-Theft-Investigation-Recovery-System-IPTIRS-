import { createHash } from 'node:crypto';

export interface AuditDigestInput {
  organizationId: string;
  actorUserId: string;
  requestId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return '{' + Object.keys(record).sort().map((key) =>
      JSON.stringify(key) + ':' + canonicalJson(record[key])
    ).join(',') + '}';
  }
  return JSON.stringify(value) ?? 'null';
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
    event.requestId,
    event.action,
    event.targetType,
    event.targetId,
    event.occurredAt,
    canonicalJson(event.metadata)
  ].join('\n');

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
