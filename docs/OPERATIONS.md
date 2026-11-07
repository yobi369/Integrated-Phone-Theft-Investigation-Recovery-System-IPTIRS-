# Operations and deployment readiness

## Current deployment status

No production or institutional environment is configured. The API, database migration, and UI are development artifacts. Do not load real reports, personal information, IMEI/serial identifiers, subscriber information, or evidence.

## Deployment topology

The intended portable topology is:

- Static React frontend, served over HTTPS.
- Node.js 22 Fastify API, reachable only through an approved ingress.
- PostgreSQL 16, private network access, restricted application role, and encrypted backups.
- Institutional OIDC identity provider and JWKS endpoint.
- Private encrypted evidence object storage, added only after malware scanning and retention controls exist.
- Centralized security logging, monitoring, alerting, and managed secret storage.

The current API and browser interface are not yet connected. No hosting provider or data-residency region is selected.

## Environment separation

Maintain independent development, test, staging, and production environments. Use synthetic data outside production. Never restore a production backup into development. Use separate identity-provider clients, database credentials, encryption keys, and storage buckets per environment.

## Secrets and identity

- Store database credentials, OIDC configuration, signing material, encryption keys, and storage credentials in the deployment platform's secret manager.
- Never expose server secrets through Vite variables or browser bundles.
- Use a dedicated PostgreSQL application role with no superuser or RLS-bypass privileges.
- Configure the API with the institution's exact OIDC issuer, API audience, and trusted JWKS URL.
- Provision users and organization memberships through an administrator-controlled process. The API currently has no account-provisioning UI.
- The authorization decision function is owned by a non-login `iptirs_auth_workflow` role with `NOBYPASSRLS`; keep it non-login and do not grant membership in it to the application role. Its only purpose is to perform a validated authorization decision under RLS.
- Require institutional MFA and privileged-role access reviews before pilot use.

## Database operations

- Apply migrations through a controlled deployment job, not through application startup.
- Back up the database and encryption keys using separate protected processes.
- Encrypt backups and restrict restore permissions.
- Define recovery point and recovery time objectives with the institution before production.
- Perform documented restore exercises before pilot launch and at an institution-approved cadence.
- Monitor database connection saturation, storage growth, failed authentication, and migration errors.

## API operations

Current endpoints:
- `/health/live` — process liveness.
- `/health/ready` — database readiness.
- `/v1/me`, `/v1/cases` — authenticated case API.

The current rate limiter is in-process and does not coordinate across multiple API instances. Production horizontal scaling requires a shared rate-limit store or upstream gateway enforcement. The current API does not expose metrics, distributed tracing, evidence upload, or operator integration.

## Logging and monitoring

The API redacts authorization, cookie, and API-key headers and avoids logging request bodies. It emits limited request failure metadata. A production environment still needs centralized protected logs, alerting, security-event correlation, audit review, and retention controls. Do not log raw device identifiers, evidence contents, subscriber data, access tokens, or legal-request payloads.

## Evidence and sensitive requests

Evidence object storage, malware scanning, quarantine, access logging, retention, and legal holds are not implemented. Sensitive operator authorization approval is also not implemented. Do not enable these workflows or claim they are operational.

No API endpoint performs live device location, subscriber-data retrieval, network interception, or external operator requests.

## Incident response

Before pilot use, define named incident owners, escalation contacts, evidence preservation procedures, containment authority, key rotation, notification obligations, recovery steps, and post-incident review with the participating institution. Test the plan using a tabletop exercise.

## Production release gates

1. Approved legal basis, privacy assessment, and institutional data-sharing agreement.
2. Configured institutional SSO/MFA, user lifecycle, and separation of duties.
3. Production database, encrypted backups, and tested restore.
4. Private evidence storage, scanning, retention, and legal-hold implementation.
5. Distributed rate limiting, monitoring, alerting, and incident response.
6. Independent penetration test and remediation.
7. Accessibility, load, resilience, and user acceptance testing.
8. Written pilot authorization, named accountable owners, support model, and rollback plan.


## Evidence infrastructure prerequisites

Evidence upload remains unavailable until all of the following are provisioned and verified in a non-production environment:

- A private S3-compatible bucket with public access blocked, server-side encryption, least-privilege service credentials, versioning, lifecycle/retention policy, and tested backups.
- `EVIDENCE_S3_BUCKET`, `EVIDENCE_S3_REGION`, `EVIDENCE_S3_ACCESS_KEY_ID`, and `EVIDENCE_S3_SECRET_ACCESS_KEY`; optionally `EVIDENCE_S3_ENDPOINT` for a compatible private endpoint. Keep credentials in a managed secret store, never in source control.
- A reachable ClamAV daemon configured through `EVIDENCE_CLAMAV_HOST` and `EVIDENCE_CLAMAV_PORT`, with current signatures, network isolation, monitoring, and resource limits.
- A documented restore and incident-response procedure. Never use real personal or investigative evidence during development testing.

The API rejects uploads when storage/scanning configuration is incomplete or scanning fails. The current implementation does not yet provide retention schedules, legal holds, external hash anchoring, or an independent forensic validation report.
