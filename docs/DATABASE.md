# PostgreSQL database foundation

## Scope

The initial migration creates the first relational model for IPTIRS. It is a development foundation, not a complete backend, and does not make this application ready for real case data.

## Requirements

- PostgreSQL 16 or a compatible supported release.
- A dedicated application role named `iptirs_app`.
- The application role must be `NOSUPERUSER`, `NOBYPASSRLS`, and must not own the protected tables.
- Database credentials must exist only on the trusted server. Never add them to Vite variables prefixed with `VITE_` or browser code.

Create the role through an administrator-controlled provisioning step, using a secret generated and stored by the deployment environment:

```sql
CREATE ROLE iptirs_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
```

Set a strong password through your secret-management process. Do not reuse the CI test password.

Apply all migrations in sequence as a database migration owner, not as the application role:

```bash
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_initial.sql
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0002_case_workflow.sql
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0003_authorization_decisions.sql
```

The application role receives only the grants explicitly listed in the migrations. It cannot create organizations or memberships, delete evidence, update audit events, or directly update authorization records. A separate non-login, non-BYPASSRLS role owns the narrowly scoped authorization decision function.

## Tenant context

After the API authenticates a user and resolves an active organization membership, it must open a database transaction and set transaction-local context:

```sql
BEGIN;
SET LOCAL app.current_organization_id = 'verified-organization-uuid';
SET LOCAL app.current_user_id = 'verified-user-uuid';
-- Execute parameterized queries for this request.
COMMIT;
```

The API first sets app.current_auth_subject from the verified OIDC sub claim to look up the provisioned user, then sets the user and organization context after checking the active membership. These values must come from verified server-side identity and membership resolution, never from request-body fields, query parameters, or client-controlled identity headers. Set the resolved membership role with transaction-local `set_config('app.current_role', ...)` only after membership verification. Always use parameterized SQL and rollback on errors. Never keep these settings on a pooled connection beyond the transaction.

PostgreSQL custom settings are not a substitute for authentication: a database role with arbitrary SQL access can set them. Protect the API from SQL injection, restrict database network access to the API, and do not expose the database directly to users or partner systems.

## Sensitive data

- Store IMEI, serial numbers, and similar identifiers only as authenticated ciphertext produced by a reviewed key-management design.
- Use a keyed HMAC fingerprint for exact-match lookup; do not use an unkeyed hash of a predictable identifier.
- Keep encryption and HMAC keys outside the database and rotate them under a documented key-management process.
- Evidence object bytes belong in a private encrypted object store, not PostgreSQL bytea fields or a public bucket. The database stores object references and SHA-256 metadata.
- Verify evidence hashes after upload and on retrieval. Add malware scanning, quarantine, access-event logging, retention, and legal-hold controls before enabling uploads.
- Do not log raw device identifiers, evidence contents, authentication tokens, or legal-request details.

## Authorization boundary

The initial schema permits creation of a pending authorization record only. The application role cannot update it or create an approved record. An operator request can be prepared only when an approved, unexpired authorization exists. A separately authenticated, independently authorized approval workflow is intentionally not implemented yet; no operator integration or external request is sent by this migration.

## CI verification

The workflow starts a disposable PostgreSQL service, applies the migration, seeds synthetic fixtures as an administrator, then runs tenant-isolation and approval-boundary assertions as the restricted application role. Never use production data in these tests.
