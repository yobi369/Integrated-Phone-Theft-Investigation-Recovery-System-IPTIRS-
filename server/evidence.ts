import { createHash, randomUUID } from 'node:crypto';
import net from 'node:net';
import { Readable } from 'node:stream';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { fileTypeFromBuffer } from 'file-type';
import type { Pool } from 'pg';
import type { TokenVerifier } from './auth.js';
import { extractBearerToken } from './auth.js';
import { withTenantContext, RequestContextError } from './db.js';

const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const error = (code: string, message: string) => ({ error: { code, message } });

interface EvidenceDependencies {
  pool: Pool;
  verifyToken: TokenVerifier;
}

function evidenceConfiguration() {
  const { EVIDENCE_S3_BUCKET, EVIDENCE_S3_REGION, EVIDENCE_S3_ENDPOINT, EVIDENCE_S3_ACCESS_KEY_ID,
    EVIDENCE_S3_SECRET_ACCESS_KEY, EVIDENCE_CLAMAV_HOST, EVIDENCE_CLAMAV_PORT } = process.env;
  if (!EVIDENCE_S3_BUCKET || !EVIDENCE_S3_REGION || !EVIDENCE_S3_ACCESS_KEY_ID ||
      !EVIDENCE_S3_SECRET_ACCESS_KEY || !EVIDENCE_CLAMAV_HOST || !EVIDENCE_CLAMAV_PORT) return null;
  return {
    bucket: EVIDENCE_S3_BUCKET,
    scannerHost: EVIDENCE_CLAMAV_HOST,
    scannerPort: Number(EVIDENCE_CLAMAV_PORT),
    s3: new S3Client({
      region: EVIDENCE_S3_REGION,
      ...(EVIDENCE_S3_ENDPOINT ? { endpoint: EVIDENCE_S3_ENDPOINT, forcePathStyle: true } : {}),
      credentials: { accessKeyId: EVIDENCE_S3_ACCESS_KEY_ID, secretAccessKey: EVIDENCE_S3_SECRET_ACCESS_KEY }
    })
  };
}

async function scanWithClamAv(host: string, port: number, content: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let response = '';
    let settled = false;
    const finish = (failure?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      failure ? reject(failure) : resolve();
    };
    socket.setTimeout(30_000);
    socket.once('connect', () => {
      socket.write('zINSTREAM\\0');
      const chunkSize = Buffer.alloc(4);
      chunkSize.writeUInt32BE(content.length);
      socket.write(chunkSize);
      socket.write(content);
      const end = Buffer.alloc(4);
      end.writeUInt32BE(0);
      socket.write(end);
    });
    socket.on('data', (chunk) => {
      response += chunk.toString('utf8');
      if (response.includes('OK')) finish();
      else if (response.includes('FOUND')) finish(new Error('malware_detected'));
      else if (response.includes('ERROR')) finish(new Error('scanner_error'));
    });
    socket.once('timeout', () => finish(new Error('scanner_timeout')));
    socket.once('error', () => finish(new Error('scanner_unavailable')));
    socket.once('end', () => {
      if (!settled) finish(new Error('scanner_incomplete_response'));
    });
  });
}

function requireIdentity(request: FastifyRequest): string {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) throw new RequestContextError(401, 'A valid bearer token is required.');
  return token;
}

export async function registerEvidenceRoutes(app: FastifyInstance, dependencies: EvidenceDependencies): Promise<void> {
  await app.register(multipart, {
    limits: { fileSize: MAX_EVIDENCE_BYTES, files: 1, fields: 5, parts: 6 },
    throwFileSizeLimit: true
  });

  app.post('/v1/cases/:caseId/evidence', async (request, reply) => {
    const config = evidenceConfiguration();
    if (!config) return reply.code(503).send(error('evidence_unavailable', 'Evidence storage and malware scanning are not configured.'));
    const token = requireIdentity(request);
    let identity;
    try { identity = await dependencies.verifyToken(token); }
    catch { return reply.code(401).send(error('unauthorized', 'The bearer token could not be verified.')); }
    const orgHeader = request.headers['x-organization-id'];
    if (typeof orgHeader !== 'string' || !/^[0-9a-f-]{36}$/i.test(orgHeader)) {
      return reply.code(400).send(error('invalid_organization', 'A valid X-Organization-Id header is required.'));
    }
    const caseId = (request.params as { caseId?: string }).caseId;
    if (!caseId || !/^[0-9a-f-]{36}$/i.test(caseId)) return reply.code(400).send(error('invalid_request', 'A valid case identifier is required.'));
    const part = await request.file();
    if (!part) return reply.code(400).send(error('invalid_request', 'A single evidence file is required.'));
    const evidenceKind = String(part.fields.evidenceKind && 'value' in part.fields.evidenceKind ? part.fields.evidenceKind.value : 'other');
    const purpose = String(part.fields.purpose && 'value' in part.fields.purpose ? part.fields.purpose.value : '');
    if (!['proof_of_ownership', 'purchase_record', 'police_reference', 'photo', 'document', 'other'].includes(evidenceKind) ||
        purpose.trim().length < 5 || purpose.length > 500) {
      return reply.code(400).send(error('invalid_request', 'Evidence kind and a 5–500 character access purpose are required.'));
    }
    let buffer: Buffer;
    try { buffer = await part.toBuffer(); }
    catch { return reply.code(413).send(error('file_too_large', 'Evidence files must not exceed 50 MiB.')); }
    if (buffer.length === 0) return reply.code(400).send(error('invalid_request', 'Empty evidence files are not accepted.'));
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !ALLOWED_TYPES.has(detected.mime)) {
      return reply.code(415).send(error('unsupported_media_type', 'Only verified PDF, JPEG, PNG, and WebP files are accepted.'));
    }
    try { await scanWithClamAv(config.scannerHost, config.scannerPort, buffer); }
    catch (scanError) {
      if (scanError instanceof Error && scanError.message === 'malware_detected') {
        return reply.code(422).send(error('malware_detected', 'The file was rejected by malware scanning.'));
      }
      request.log.error({ errorType: scanError instanceof Error ? scanError.message : 'unknown' }, 'Evidence scanner unavailable');
      return reply.code(503).send(error('scanner_unavailable', 'Evidence scanning did not complete; the file was not stored.'));
    }

    const digest = createHash('sha256').update(buffer).digest('hex');
    const objectKey = randomUUID();
    const evidenceId = randomUUID();
    let objectStored = false;
    try {
      await config.s3.send(new PutObjectCommand({
        Bucket: config.bucket, Key: objectKey, Body: buffer, ContentLength: buffer.length,
        ContentType: detected.mime, ServerSideEncryption: 'AES256',
        Metadata: { sha256: digest, evidenceid: evidenceId }
      }));
      objectStored = true;
      const record = await withTenantContext(dependencies.pool, identity.subject, orgHeader, async (client, context) => {
        if (!['organization_admin', 'investigator'].includes(context.role)) throw new RequestContextError(403, 'An investigator or organization administrator role is required to upload evidence.');
        const caseResult = await client.query('SELECT id FROM cases WHERE id = $1', [caseId]);
        if (!caseResult.rows[0]) return null;
        const inserted = await client.query(
          `INSERT INTO evidence_items
            (id, organization_id, case_id, uploaded_by_user_id, object_key, sha256, media_type, byte_size, evidence_kind, verification_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'available')
           RETURNING id, case_id, sha256, media_type, byte_size, evidence_kind, verification_status, created_at`,
          [evidenceId, orgHeader, caseId, context.userId, objectKey, digest, detected.mime, buffer.length, evidenceKind]
        );
        await client.query(
          'INSERT INTO evidence_access_events (organization_id,evidence_id,actor_user_id,action,purpose) VALUES ($1,$2,$3,$4,$5)',
          [orgHeader, evidenceId, context.userId, 'upload', purpose.trim()]
        );
        await client.query(
          'INSERT INTO case_events (organization_id,case_id,actor_user_id,event_type,description,metadata) VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
          [orgHeader, caseId, context.userId, 'evidence_uploaded', 'Evidence passed file validation and malware scanning.', JSON.stringify({ evidenceId, sha256: digest, mediaType: detected.mime, byteSize: buffer.length })]
        );
        return inserted.rows[0];
      });
      if (!record) {
        await config.s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: objectKey }));
        return reply.code(404).send(error('not_found', 'The case was not found.'));
      }
      return reply.code(201).send({ data: record });
    } catch (uploadError) {
      if (objectStored) {
        try { await config.s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: objectKey })); }
        catch { request.log.error({ evidenceId }, 'Evidence orphan cleanup failed; operator intervention required'); }
      }
      if (uploadError instanceof RequestContextError) throw uploadError;
      request.log.error({ evidenceId, errorType: uploadError instanceof Error ? uploadError.name : 'unknown' }, 'Evidence upload failed');
      return reply.code(500).send(error('evidence_upload_failed', 'Evidence could not be committed.'));
    }
  });

  app.get('/v1/cases/:caseId/evidence', async (request, reply) => {
    const token = requireIdentity(request);
    let identity;
    try { identity = await dependencies.verifyToken(token); }
    catch { return reply.code(401).send(error('unauthorized', 'The bearer token could not be verified.')); }
    const orgHeader = request.headers['x-organization-id'];
    if (typeof orgHeader !== 'string') return reply.code(400).send(error('invalid_organization', 'A valid X-Organization-Id header is required.'));
    const caseId = (request.params as { caseId?: string }).caseId;
    const records = await withTenantContext(dependencies.pool, identity.subject, orgHeader, async (client) => {
      const result = await client.query(
        `SELECT id, sha256, media_type, byte_size, evidence_kind, verification_status, created_at
           FROM evidence_items WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]
      );
      return result.rows;
    });
    return { data: records };
  });

  app.get('/v1/evidence/:evidenceId/download', async (request, reply) => {
    const config = evidenceConfiguration();
    if (!config) return reply.code(503).send(error('evidence_unavailable', 'Evidence storage and malware scanning are not configured.'));
    const token = requireIdentity(request);
    let identity;
    try { identity = await dependencies.verifyToken(token); }
    catch { return reply.code(401).send(error('unauthorized', 'The bearer token could not be verified.')); }
    const orgHeader = request.headers['x-organization-id'];
    const query = request.query as { purpose?: string };
    if (typeof orgHeader !== 'string' || !query.purpose || query.purpose.trim().length < 5 || query.purpose.length > 500) {
      return reply.code(400).send(error('invalid_request', 'Organization and a 5–500 character access purpose are required.'));
    }
    const evidenceId = (request.params as { evidenceId?: string }).evidenceId;
    const outcome = await withTenantContext(dependencies.pool, identity.subject, orgHeader, async (client, context) => {
      const result = await client.query(
        `SELECT id, case_id, object_key, sha256, media_type, byte_size, verification_status
           FROM evidence_items WHERE id = $1`, [evidenceId]
      );
      const record = result.rows[0];
      if (!record || record.verification_status !== 'available') return null;
      const object = await config.s3.send(new GetObjectCommand({ Bucket: config.bucket, Key: record.object_key }));
      if (!object.Body) throw new Error('Evidence object body is missing.');
      const content = Buffer.from(await object.Body.transformToByteArray());
      const actualHash = createHash('sha256').update(content).digest('hex');
      if (actualHash !== record.sha256 || content.length !== Number(record.byte_size)) {
        throw new Error('Evidence integrity verification failed.');
      }
      await client.query(
        'INSERT INTO evidence_access_events (organization_id,evidence_id,actor_user_id,action,purpose) VALUES ($1,$2,$3,$4,$5)',
        [orgHeader, evidenceId, context.userId, 'download', query.purpose.trim()]
      );
      return { content, mediaType: record.media_type, evidenceId };
    });
    if (!outcome) return reply.code(404).send(error('not_found', 'Verified evidence was not found.'));
    return reply.type(outcome.mediaType).header('Content-Disposition', `attachment; filename="evidence-${outcome.evidenceId}"`)
      .header('Cache-Control', 'private, no-store').send(outcome.content);
  });
}
