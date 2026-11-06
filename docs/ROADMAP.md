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

- Select backend, database, identity, and evidence-storage architecture.
- Implement organizations, memberships, roles, and server-side authorization.
- Implement citizen intake, reference numbers, duplicate review, and case workflows.
- Implement device records and ownership-verification states.
- Implement evidence upload, hash, malware scanning, provenance, and access history.
- Implement append-only audit events and tenant-isolation tests.

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
