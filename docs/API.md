# IPTIRS API foundation

## Implemented endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health/live` | Process liveness; no database dependency |
| GET | `/health/ready` | Database connectivity check |
| GET | `/v1/me` | Current provisioned user, active organization, and membership role |
| GET | `/v1/cases` | List cases visible to the current membership; optional `limit` from 1 to 100 |
| POST | `/v1/cases` | Create a case, append a case event, and write an audit digest |
| GET | `/v1/cases/{caseId}` | Retrieve visible case details, timeline, assignments, and authorizations |
| PATCH | `/v1/cases/{caseId}/status` | Change status with a mandatory reason and valid transition |
| POST | `/v1/cases/{caseId}/assignments` | Assign an active investigator in the same organization |
| DELETE | `/v1/cases/{caseId}/assignments/{assignmentId}` | Release an active assignment |
| POST | `/v1/cases/{caseId}/authorizations` | Create a pending sensitive-request authorization |
| POST | `/v1/authorizations/{authorizationId}/decision` | Independently approve or reject a request with a reason |

The API implements case management and an independent authorization decision workflow. Evidence uploads/retrieval, operator request submission, notifications, and administrative provisioning are not implemented. An authorization decision does not contact an operator or trigger disclosure.

## Local setup

1. Provision PostgreSQL and the restricted `iptirs_app` role using [DATABASE.md](DATABASE.md).
2. Apply migrations `0001_initial.sql`, `0002_case_workflow.sql`, and `0003_authorization_decisions.sql` in order as the migration owner.
3. Configure a test OIDC provider or institutional identity provider that issues signed JWT access tokens with a stable `sub`, the expected issuer, and the configured audience.
4. Provision the corresponding `users` and `memberships` records through an administrator-controlled process. Do not add self-service role assignment.
5. Set environment variables in the server process only:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for the restricted app role |
| `DATABASE_SSL` | Production | Set to `true` in production; defaults to enabled in production |
| `OIDC_ISSUER` | Yes | Exact token issuer URL |
| `OIDC_AUDIENCE` | Yes | Expected API audience claim |
| `OIDC_JWKS_URL` | Yes | Trusted issuer's JSON Web Key Set URL |
| `CORS_ORIGINS` | No | Comma-separated HTTPS origins; localhost is allowed for development |
| `PORT` | No | API port; defaults to 8080 |
| `RATE_LIMIT_MAX` | No | Per-process requests per minute; defaults to 120 |
| `NODE_ENV` | No | `development`, `test`, or `production` |

Run the API:

```bash
npm install
npm run dev:api
```

Compile and start the production build:

```bash
npm run build:api
npm run start:api
```

## Request conventions

Protected endpoints require:
- `Authorization: Bearer <OIDC access token>`
- `X-Organization-Id: <organization UUID>`

The organization header is not trusted by itself. The API validates the JWT first, resolves the account by the verified OIDC subject, and then checks that the account has an active membership in the requested organization. PostgreSQL row-level security is applied inside a transaction using transaction-local identity context.

Example case creation body:

```json
{
  "category": "phone_theft",
  "priority": "normal",
  "summary": "Synthetic test report describing the reported device theft."
}
```

Allowed categories are `phone_theft`, `device_loss`, and `institutional_asset_loss`. Priority values are `low`, `normal`, `high`, and `urgent`. Unknown fields are rejected.

## Security and operational limitations

- The API has no login or account-provisioning UI. Provision users and memberships through a controlled administrator workflow.
- The JWT verifier trusts only the configured issuer, audience, JWKS, and RS256/ES256 algorithms. Do not accept arbitrary issuer URLs from requests.
- The in-process rate limiter is not distributed. Production multi-instance deployments require a shared rate-limit store or an upstream gateway policy.
- Audit records currently receive per-event SHA-256 digests. This is not a chained or externally anchored audit log; independent verification and protected checkpoints remain required.
- The API does not upload, scan, or serve evidence files. Do not enable evidence workflows until private object storage, malware scanning, encryption, access logging, retention, and legal-hold controls are implemented.
- Authorization decisions require an active `authorization_approver` or organization administrator role; the requester cannot decide their own request. The application role has no direct UPDATE grant on authorization records.
- The API does not send operator requests, query telecom systems, retrieve subscriber information, or locate devices.
- The React interface is not yet connected to this API. The browser prototype continues to display synthetic records.
- This API foundation has not undergone an independent penetration test or institutional security review. Do not use production personal or investigative data.


## Evidence workflow (Phase 3 foundation)

- `POST /v1/cases/:caseId/evidence` — authenticated multipart upload. Include `evidenceKind` and `purpose` fields before the file part; only one PDF/JPEG/PNG/WebP file up to 50 MiB is accepted. Upload is denied unless a private S3-compatible bucket and ClamAV daemon are configured. The file is scanned before storage; the object key is generated by the server.
- `GET /v1/cases/:caseId/evidence` — list evidence metadata visible under the caller's tenant/case permissions.
- `GET /v1/evidence/:evidenceId/download?purpose=...` — retrieves only available evidence, verifies SHA-256 and byte size, records the access purpose, and returns `Cache-Control: private, no-store` content. Downloads are proxied; public object URLs are never exposed.

The API currently supports only the initial storage/scanning workflow. Retention, legal holds, external integrity anchoring, derivative management, and institution-approved custody procedures remain outstanding.

## Investigator directory\n\n- `GET /v1/organization/investigators` — active investigators and organization administrators can retrieve the names and role labels of active investigator/admin members in the same organization. This is a limited directory for case assignment; it does not expose reporter or auditor identities.\n\n## Organization membership administration

- `GET /v1/organization/members` — organization administrators can list membership identity and role/status metadata.
- `PATCH /v1/organization/members/{userId}` — organization administrators can change a member's role and/or set membership status to active, suspended, or revoked. Self-modification is blocked, and the last active organization administrator cannot be demoted or suspended. Every change writes an audit event.

This is not an invitation or identity-provisioning service. An account must already exist in the institution's OIDC identity provider and in IPTIRS' user directory before membership administration. Invitations, email delivery, identity lifecycle synchronization, and MFA enforcement must be integrated with the institution's chosen identity provider before deployment.
