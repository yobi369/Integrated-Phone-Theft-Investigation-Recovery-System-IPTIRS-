# IPTIRS Target Architecture

## Status

This document describes a proposed target architecture. The database migration in `db/migrations/0001_initial.sql` is an initial implementation of the data model and PostgreSQL row-level security policies. It is not a complete production backend or proof of institutional approval.

## Logical components

1. Public intake application — accessible reporting, reference numbers, and controlled status updates.
2. Institutional workspace — investigator, operator liaison, asset administrator, and auditor workflows.
3. API gateway / backend — authentication enforcement, validation, authorization, rate limits, and business rules.
4. Transactional database — tenant-scoped organizations, users, devices, reports, cases, approvals, and workflow events.
5. Evidence object store — encrypted file storage, content hashes, malware scanning, access policy, and retention.
6. Audit service — append-only security and business audit events with integrity verification and restricted access.
7. Notification service — minimal-content email/SMS/in-app notifications; no sensitive case detail in message bodies.
8. Integration gateway — isolated adapters for approved operator or public-sector systems, disabled by default.
9. Observability and operations — metrics, logs, alerts, backup, restore, incident response, and service health.

## Implemented database foundation

The initial PostgreSQL migration creates:
- Organizations, external-identity user records, and organization memberships.
- Cases with organization-scoped references and workflow states.
- Device records with encrypted-identifier storage and keyed-fingerprint fields. Raw IMEI/serial values must never be stored in plaintext.
- Append-only case events, evidence metadata, evidence-access events, and audit events.
- Authorization records and operator-request tracking records; these do not contact any external operator.
- Tenant and role-scoped row-level security (RLS) policies, composite foreign keys, constraints, indexes, and restricted grants for a dedicated `iptirs_app` role.
- Reporter visibility is limited to cases they created; investigators and organization administrators have broader case access. Device/evidence records inherit visibility from their parent case. Audit reads are limited to organization administrators and auditors.
- New authorization records can only be created in a pending state. The current app role cannot approve them; a separately authenticated approval workflow is still required. Operator request records can only be prepared against an approved, unexpired authorization record. The schema does not send requests to an operator.

### Database request context

The application database role must be a non-superuser with `NOBYPASSRLS`. For each request, the backend must authenticate the caller, resolve an active membership, begin a transaction, and set `app.current_organization_id` and `app.current_user_id` with transaction-local settings before querying tenant data. The browser must never supply trusted identity context. Never use a database owner, superuser, or role with `BYPASSRLS` for application traffic.

The current migration's RLS context is an application-enforced trust boundary: a database role that can issue arbitrary SQL can set custom PostgreSQL settings. Prevent SQL injection, restrict database credentials to the API, use parameterized queries, and do not expose direct database access to clients.

## Trust boundaries

- Public users are untrusted and may submit false or malicious information.
- Each participating organization is a separate tenant and must not access another tenant's records by changing identifiers or API parameters.
- Operator systems are external trust domains; no credentials or privileged network access are shared with the public application.
- Evidence files are untrusted uploads until validated and scanned.
- AI providers are external processors and must not receive personal, investigative, or evidentiary data unless an explicit legal, contractual, privacy, and security review approves the exact use case.

## Security design requirements

- Strong authentication; institutional SSO where available; MFA for privileged roles.
- Server-side authorization on every request, with deny-by-default policy.
- Tenant isolation enforced in the database and application layer.
- Short-lived sessions, secure cookies, CSRF protection where applicable, and safe logout.
- Input validation, output encoding, upload scanning, and rate limiting.
- Encryption in transit and managed encryption at rest.
- Secrets stored in a managed secret store, never in source code or client bundles.
- Append-only audit records for sensitive reads, exports, approvals, and changes.
- Separation of duties for sensitive request creation and approval.
- Tested backup, restore, key rotation, and incident response.
- Secure development lifecycle, dependency scanning, code review, and CI security gates.

## Sensitive operator-request workflow

A request must contain a case reference, requesting organization and officer, purpose, exact data/action requested, legal authority reference, approval identity and timestamp, validity window, and an auditable decision. The operator independently validates the request under its own policies and legal obligations. IPTIRS records the workflow and response; it does not bypass the operator's authorization process.

No request may trigger device-location disclosure, subscriber-data disclosure, or network action automatically.

## AI boundary

AI is optional and non-authoritative. Any future use must use approved, minimized data; cite source records; never invent people, suspects, coordinates, signal strength, evidence, or case outcomes; and remain reviewable by an authorized human. AI remains disabled for sensitive workflows until a privacy and security assessment is approved.

## Deployment posture

Separate development, test, staging, and production environments. Production data must never be copied into development. Deployments require reviewed changes, automated tests, security checks, migration plans, rollback plans, and verified backups. Hosting location, data residency, service-level objectives, and procurement requirements must be agreed with the eventual institution.
