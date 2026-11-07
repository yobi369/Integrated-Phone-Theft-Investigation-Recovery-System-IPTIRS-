# IPTIRS Delivery Roadmap

## Guiding rule

Deliver in reviewable phases. Do not claim production readiness, legal compliance, agency adoption, or telecom integration until independently evidenced.

## Phase 0 — Truthful prototype and product foundation

- Clearly label all demo data and simulated screens.
- Remove generated coordinates, fabricated suspects, and false live-signal claims.
- Remove placeholder government identities, endpoints, and clearance claims.
- Establish product charter, target architecture, security baseline, and roadmap.
- Add automated build, type-check, test, and dependency/security workflows.

**Exit gate:** a reviewer can distinguish implemented functionality from mock/demo capability.

## Phase 1 — Secure case-management MVP

**Progress:** the PostgreSQL data model, role-scoped RLS policies, generic OIDC JWT verifier, authenticated case API, case-event/audit writes, and PostgreSQL-backed API integration tests are implemented on the product branch. CodeQL and high/critical dependency audit gates are active. This remains an undeployed development foundation: no real identity provider, production database, evidence store, or institution is configured.

- [x] Define initial organizations, users, memberships, cases, device, evidence, authorization, operator-request, and audit tables.
- [x] Add database-enforced tenant boundaries and role-scoped case visibility.
- [x] Restrict audit and evidence records against application-role updates/deletes.
- [x] Implement a generic OIDC/JWKS JWT verifier and authenticated server-side case API.
- [ ] Configure a real institutional identity provider, SSO, MFA, and account lifecycle.
- [ ] Connect the React application to the deployed API and authenticated sign-in flow.
- [ ] Deploy and operate the PostgreSQL service using production secrets and backups.
- [x] Implement case detail retrieval, role-checked investigator assignment/release, status transitions with mandatory reasons, chronological timeline events, and audit records.
- [ ] Connect the browser case workspace to the authenticated API and build investigator assignment/status controls.
- [ ] Implement citizen intake, reference numbers, duplicate review, and public-facing case status workflows.
- [ ] Implement encrypted evidence object storage, malware scanning, provenance, and access history.
- [ ] Implement an independent approval workflow for sensitive operator requests.
- [x] Generate a per-event SHA-256 audit digest for case creation.
- [ ] Add chained/external audit checkpoints and independent verification.
- [x] Add PostgreSQL integration tests for tenant isolation, reporter scope, and authenticated case creation.
- [ ] Add end-to-end evidence-integrity tests after secure object storage is implemented.

**Exit gate:** end-to-end synthetic-data tests pass, including cross-tenant denial and evidence integrity checks.

## Phase 2 — Institutional workflow

- Implement assignment, approvals, escalation, and handoffs.
- Implement operator request packages and response recording without live network access.
- Implement notification templates and safe disclosure rules.
- Implement auditor views, export controls, retention, and legal holds.

**Exit gate:** workflow accepted by a participating institution's designated process owners.

## Phase 3 — Controlled integrations

- Define integration contracts with each institution.
- Use sandbox credentials and test data first.
- Add mTLS/OAuth or the partner-approved authentication mechanism.
- Add request signing, replay protection, idempotency, retries, rate limits, and reconciliation.
- Obtain legal, privacy, security, procurement, and operational approval.

**Exit gate:** partner-owned integration tests pass and written approval exists. No integration is implied by a demo.

## Phase 4 — Pilot readiness

- Independent penetration test and remediation.
- Data-protection impact assessment and legal review.
- Disaster recovery and restore exercise.
- Security incident tabletop exercise.
- Accessibility, load, resilience, and operational support testing.
- Training, support model, service objectives, and rollback plan.

**Exit gate:** written pilot authorization, named accountable owners, and approved scope.

## Phase 5 — Production operations

- High availability and monitored service objectives.
- Routine patching, vulnerability management, key rotation, and access reviews.
- Tested backup, restore, and business continuity.
- Change management, audit review, and incident response.
- Measured service outcomes and periodic independent reassessment.

## First engineering work package

1. Remove misleading demo and simulated-intelligence behavior.
2. Establish reproducible build and automated quality checks.
3. Define API and database schema for reports, devices, cases, evidence, organizations, and audit events.
4. Implement the smallest secure end-to-end workflow using synthetic data.
5. Add tenant-isolation, authorization, audit, and evidence-integrity tests.
