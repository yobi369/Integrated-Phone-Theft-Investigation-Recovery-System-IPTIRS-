# IPTIRS Development Log and Engineering Decisions

This log records implementation steps, commits, validation results, known limitations, and release decisions. It is maintained on the product feature branch so reviewers can reconstruct why a change was made and what evidence supports its status.

## Working rules

1. Develop on `product/market-facing-experience`; do not merge to `main` without explicit owner approval.
2. Keep all test and demo records synthetic until privacy, legal, security, and institutional gates are approved.
3. Do not represent an implemented workflow as an external integration, operational law-enforcement capability, live device tracking, or proof of ownership.
4. Record meaningful implementation changes and validation outcomes here.
5. A green CI run is evidence for the checks it actually executes; it is not a production-readiness certificate.

## Product branch milestones

### Market-facing product foundation

- Replaced the development-only first screen with a responsive public product landing experience.
- Preserved the authenticated institutional workspace and OIDC authorization-code + PKCE path.
- Added truthful product metadata, README positioning, and a go-to-market plan.
- Explicitly states that IPTIRS has no live device tracking, telecom network access, agency endorsement, or production operational status.
- Commit history includes the market-facing experience work on `product/market-facing-experience`; PR #2 is the review vehicle and depends on PR #1's enterprise foundation.

### Device descriptors at case intake

- Added a strict optional device descriptor to case creation: device type, manufacturer, and model.
- Persists the descriptor in `device_records` and returns device records in case detail.
- The new intake schema deliberately rejects unapproved extra fields such as IMEI. It does not request passwords, precise location, or other sensitive identifiers.
- Added schema tests for valid descriptors and rejected fields.
- Prior milestone validation was confirmed successful by CI and CodeQL at commit `8df05293646f18bd5715da803fe568c53908b42d` (CI run `44528219186`, CodeQL run `44528219188`).

### Device ownership review controls

- Added migration `db/migrations/0006_device_ownership_review.sql` to constrain ownership-status updates and protect device identity fields.
- Added a strict request schema with an allowed review status and a mandatory reason of 10–1000 characters.
- Added authenticated staff-only ownership review endpoint `PATCH /v1/cases/:caseId/devices/:deviceId/ownership`.
- Enforced explicit status transitions; rejected transitions return conflict rather than silently changing state.
- Successful review writes both a case timeline event and an audit event.
- Added schema tests for allowed status values, reason length, and unknown fields.
- The UI labels this as an organizational review, not independent proof of legal ownership or device authenticity.
- Implementation commit sequence: migration `0dd23572037e6445838f8af4550897a187947049`; schema `de49080bd5e84e6dfc270d9ddb59db7016a0d266`; API `d4745b76239384e7823907b1a33b68f5c4befb0c`; UI `2211260ab4b25cf71fb4d59fd4e250e8113ac624`; tests `080784ea7b740f0091537a7f87e44e7a6b93523d`.
- The earlier validation at that milestone was reported passed and was treated as the accepted baseline before the next milestone.

### Evidence access-history endpoint

**Purpose:** give permitted organization personnel a read-only chronological view of recorded access events for one evidence item.

Implementation steps:

1. Added `GET /v1/evidence/:evidenceId/access-history` in `server/evidence.ts`.
2. Requires a bearer token and validates it with the configured token verifier.
3. Requires a valid `X-Organization-Id` UUID header.
4. Validates the evidence identifier as a UUID before querying.
5. Establishes the normal tenant database context through `withTenantContext`.
6. Restricts the endpoint to `organization_admin`, `investigator`, and `auditor` roles.
7. Selects only event ID, actor user ID, action, purpose, and occurrence timestamp.
8. Orders events oldest-first by timestamp and ID for a deterministic timeline.
9. Relies on the database's row-level security policies and organization/evidence foreign-key relationship as an additional tenant boundary.
10. Added an API test asserting that unauthenticated requests are rejected before database access.

The endpoint reads existing `evidence_access_events`; it does not create or alter evidence events. The database table constrains actions to `view`, `download`, `export`, `quarantine`, and `release`, requires a purpose of 5–500 characters, and ties the evidence and actor to the same organization. The underlying table has row-level security enabled and has explicit case-scoped select/insert policies.

Implementation commits:
- `d705e3cd82c1adcc46e8cc476e2906b0de0877d0` — access-history route.
- `38a2f102572755765b7c89326613a0c3faae1a0a` — unauthenticated-route test.

**Validation correction:** the first CI run on `38a2f102572755765b7c89326613a0c3faae1a0a` did not pass. TypeScript found that `RequestContextError` only accepted status codes 401 and 403, while the existing ownership-transition endpoint also uses HTTP 409. CodeQL and the Vercel preview feedback check passed, but the TypeScript/build/database-security job failed at `server/app.ts(467,41)`. This was a real type-contract defect, not a flaky test.

- `2229eed1581e1c218d1099be4e0e6c46d37beea3` — widened the error's status-code property to `number`, matching Fastify's numeric HTTP status contract and allowing 409 conflict responses.
- The corrected commit must complete a fresh CI run before this milestone is marked green. Do not infer success from the earlier run.

## Evidence workflow: current capabilities and limits

Implemented foundation (subject to deployment configuration):
- Private S3-compatible object storage adapter.
- Fail-closed ClamAV scanning; upload is unavailable unless the scanner and private storage configuration are present.
- File-signature validation and allow-list of PDF, JPEG, PNG, and WebP.
- Maximum upload size of 50 MiB.
- SHA-256 calculated at upload and checked with byte size before download.
- Evidence metadata, uploader identity, upload/download purpose, and append-only access events.
- Evidence access-history read endpoint for permitted staff roles.

Not yet complete:
- A dedicated evidence review UI with review decisions and reviewer reasons.
- Formal retention schedules, legal holds, controlled exports, and authorized deletion.
- Comprehensive integration tests for access-history tenant isolation and each role boundary.
- Automated malware test corpus and end-to-end scanner failure/recovery tests.
- Independent custody/integrity verification, key-management review, backup/restore exercises, and operational procedures.
- External timestamping or tamper-evident anchoring beyond the current database controls.

A SHA-256 match establishes that the downloaded bytes match the stored digest; by itself it does not prove who originally created a file, whether the file is truthful, or that custody was legally sufficient.

## Validation ledger

| Commit | Check | Result | Notes |
|---|---|---|---|
| `8df05293646f18bd5715da803fe568c53908b42d` | CI | Passed | Run `44528219186` |
| `8df05293646f18bd5715da803fe568c53908b42d` | CodeQL | Passed | Run `44528219188` |
| `38a2f102572755765b7c89326613a0c3faae1a0a` | TypeScript/build/database security | Failed | Type error: HTTP 409 excluded from RequestContextError |
| `38a2f102572755765b7c89326613a0c3faae1a0a` | CodeQL | Passed | Run completed successfully |
| `38a2f102572755765b7c89326613a0c3faae1a0a` | Vercel preview feedback | Passed | No unresolved preview feedback |
| `2229eed1581e1c218d1099be4e0e6c46d37beea3` | Fresh CI and CodeQL | Pending verification | Re-check the new commit's checks before declaring this milestone passed |

## Next engineering steps

1. Verify the fresh CI, CodeQL, and Vercel checks for the corrected commit.
2. Fix any failing job and re-run until the latest commit is green.
3. Add route integration tests for allowed staff roles, reporter/unauthorized role denial, cross-tenant evidence IDs, missing evidence, and deterministic ordering.
4. Review the evidence event writer to confirm every successful view/download records actor, purpose, and timestamp and that event rows cannot be updated or deleted by the application role.
5. Build the evidence review UI: status, reviewer, reason, timestamps, and clear separation between technical integrity and human evidentiary assessment.
6. Add retention/legal-hold/export policy design and testable controls before any real evidence is processed.
7. Update the roadmap and this log after each accepted milestone, with commit SHA and actual check results.

## Release status

**Pre-pilot development. Not approved for production investigations or real personal/evidentiary data.** Institutional OIDC, private storage/scanner deployment, legal/privacy review, operational controls, independent security assessment, and written pilot authorization remain release gates.
