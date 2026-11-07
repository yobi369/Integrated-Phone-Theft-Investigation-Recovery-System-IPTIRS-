# IPTIRS Delivery Roadmap

## Guiding rule

Deliver in reviewable phases. Do not claim production readiness, legal compliance, agency adoption, or telecom integration until independently evidenced. All development and automated tests use synthetic data.

## Phase 0 — Truthful prototype and product foundation

- [x] Clearly label demo data and simulated screens.
- [x] Remove generated coordinates, fabricated suspects, and false live-signal claims.
- [x] Remove placeholder government identities, endpoints, and clearance claims.
- [x] Establish product charter, target architecture, security baseline, and roadmap.
- [x] Add automated build, type-check, test, dependency audit, and CodeQL workflows.

**Exit gate:** a reviewer can distinguish implemented functionality from mock/demo capability. Met on the product branch.

## Phase 1 — Case management

**Progress:** authenticated case creation/listing/detail, status transitions, investigator assignment/release, chronological timeline, role checks, tenant isolation, and audit events are implemented in the backend and tested against PostgreSQL.

- [x] Define organizations, users, memberships, cases, and case events.
- [x] Add database-enforced tenant boundaries and role-scoped case visibility.
- [x] Implement authenticated case list/create/detail API.
- [x] Implement investigator assignment and release with same-organization role checks.
- [x] Enforce allowed status transitions in both API and PostgreSQL.
- [x] Require a reason for every status change and assignment action.
- [x] Record assignment and status history in append-only case events and audit records.
- [x] Test reporter restrictions, cross-tenant denial, assignment lifecycle, and invalid status transitions.
- [ ] Connect the React case workspace to the authenticated API.
- [ ] Add investigator-facing assignment, status, and timeline controls to the browser workspace.
- [ ] Implement citizen intake, report reference numbers, duplicate review, and permitted public status updates.

**Exit gate:** investigators can complete a synthetic case workflow through the browser interface using a configured identity provider. Backend API workflow tests currently pass; browser integration and real identity configuration remain outstanding.

## Phase 2 — Authorization workflow

**Progress:** pending authorization requests, independent approval/rejection, mandatory decision reasons, non-self-approval, and audit/timeline records are implemented and tested.

- [x] Add a dedicated `authorization_approver` membership role.
- [x] Create pending authorization requests with purpose, requested action, legal-authority reference, scope, and expiry.
- [x] Require independent approval or rejection with a recorded decision-maker, timestamp, and reason.
- [x] Prevent requesters from deciding their own requests, including organization administrators.
- [x] Restrict authorization updates to a dedicated non-login, non-BYPASSRLS database role and narrowly scoped decision function.
- [x] Test approval, rejection, role denial, self-approval prevention, and audit visibility.
- [ ] Add request expiry processing, withdrawal, and escalation policies.
- [ ] Add operator request package preparation and response recording, without live network access.
- [ ] Obtain institutional review of approval roles, legal-reference requirements, and decision procedures.

**Exit gate:** a participating institution approves the workflow and confirms that the authorization record matches its legal and operational controls. IPTIRS does not send or execute operator requests.

## Phase 3 — Evidence management

- [x] Add a private S3-compatible object-storage adapter with server-side encryption; deployment remains disabled until a private bucket is configured.
- [x] Add fail-closed ClamAV scanning, file-signature validation, and 50 MiB/type restrictions; scanner configuration is still required.
- [x] Compute SHA-256 on upload and verify hash and byte size before downloads.
- [x] Record uploader identity, content hash, media type, size, upload/download purpose, and append-only case timeline/access events.
- [x] Add append-only upload/download access logging.\n- [ ] Add retention schedules, legal holds, controlled exports, and authorized deletion.
- [ ] Test evidence integrity, malicious uploads, tenant isolation, and recovery.

**Exit gate:** independent evidence-integrity tests pass and storage, retention, and custody procedures are approved.

## Phase 4 — Institutional administration

- [ ] Configure an institutional OIDC identity provider, SSO, and MFA.
- [ ] Implement controlled user provisioning, invitations, suspension, revocation, and access reviews.
- [ ] Add role administration and separation-of-duties controls.
- [ ] Connect the browser application to the authenticated API.
- [ ] Add organization-level configuration, audit review, and administrative reporting.
- [ ] Validate accessibility and privileged-user workflows.

**Exit gate:** institutional identity, user lifecycle, MFA, and permissions are verified in a staging environment.

## Phase 5 — Approved institutional integrations

- [ ] Define integration contracts with each institution independently.
- [ ] Use partner-owned sandbox credentials and synthetic test data first.
- [ ] Add partner-approved mTLS/OAuth authentication, request signing, replay protection, idempotency, retries, rate limits, and reconciliation.
- [ ] Require legal, privacy, security, procurement, and operational approval before enabling any integration.
- [ ] Keep all integrations disabled by default and isolate each adapter.
- [ ] Verify operator-side authorization and response workflows with partner-owned tests.

**Exit gate:** partner integration tests pass and written approval exists. No integration or partnership is implied by the prototype.

## Phase 6 — Pilot readiness and deployment

- [ ] Select an institution-sponsored pilot scope and accountable owners.
- [ ] Agree hosting location, data residency, service levels, and operating model.
- [ ] Deploy separate staging and production environments with managed secrets.
- [ ] Verify encrypted backups, restore exercises, monitoring, alerting, and incident response.
- [ ] Complete independent penetration testing and remediation.
- [ ] Complete legal review and data-protection impact assessment as applicable.
- [ ] Complete accessibility, load, resilience, and user acceptance testing.
- [ ] Obtain written pilot authorization, training plan, support model, and rollback plan.

**Exit gate:** written institutional pilot approval and all release blockers closed.

## Phase 7 — Production operations

- [ ] High availability and monitored service objectives.
- [ ] Routine patching, vulnerability management, key rotation, and access reviews.
- [ ] Tested backup, restore, and business continuity.
- [ ] Change management, audit review, and incident response.
- [ ] Measured service outcomes and periodic independent reassessment.
