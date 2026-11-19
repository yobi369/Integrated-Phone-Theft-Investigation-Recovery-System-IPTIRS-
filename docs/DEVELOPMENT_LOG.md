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

- `2229eed1581e1c218d1099be4e0e6c46d37beea3` — widened the request-context error status type as an initial type correction.
- `6ef20a3bc1ce24c9d2bec57ed4d70ba389eb3805` — added a dedicated `CaseWorkflowConflictError` path so invalid case/ownership transitions are mapped to HTTP 409 without misclassifying them as authentication or authorization errors. The general request-context error remains responsible for authentication/authorization status responses.
- The latest commit's CodeQL analysis was still running at the time of this log update; the full CI result must be checked before this milestone is marked green. Do not infer success from the earlier run.

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
| `2229eed1581e1c218d1099be4e0e6c46d37beea3` | Type correction | Superseded by explicit conflict mapping | Intermediate correction; see next row |
| `6ef20a3bc1ce24c9d2bec57ed4d70ba389eb3805` | CodeQL / CI | Pending verification | Latest branch head at the time of this log update |

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

## Detailed engineering trace — 2026-11-19 continuation

This section expands the milestone ledger into a reproducible implementation trace. Keep it append-only; subsequent work should add a new dated section rather than rewriting historical outcomes.

### A. Device descriptor intake — request-to-database trace

1. The case-creation request remains validated by the existing strict Zod schema.
2. The optional `device` property is an object with only `deviceType`, `manufacturer`, and `model`.
3. `deviceType` is an enum: `phone`, `tablet`, `laptop`, or `other`.
4. Manufacturer is bounded to 100 characters; model is bounded to 120 characters.
5. Strict object parsing rejects unrecognized keys, including an `imei` field. This is intentional data minimization, not a claim that IPTIRS can identify or block devices.
6. The case API inserts the case and then inserts a `device_records` row in the same tenant-scoped database transaction.
7. The event timeline records only whether device details were provided; it does not duplicate the submitted manufacturer/model values into the event metadata.
8. Case detail reads the associated device rows and returns the safe descriptor fields and ownership status.
9. The browser workspace exposes the three allowed descriptor fields and clears the optional descriptor inputs after successful creation.
10. Unit tests cover valid descriptors, unknown-field rejection, and invalid device-type rejection.

**Acceptance evidence:** schema tests plus the CI typecheck/build/test/database checks on commit `8df05293646f18bd5715da803fe568c53908b42d`. CI run `44528219186` and CodeQL run `44528219188` were recorded as successful.

### B. Ownership review — database/API/UI trace

1. Migration `0006_device_ownership_review.sql` adds a row-level UPDATE policy requiring the current organization and an active membership whose role is `organization_admin` or `investigator`.
2. The policy's `USING` clause constrains which existing row may be targeted; `WITH CHECK` constrains the row after update.
3. Column-level grant permits the application DB role to update `ownership_status` only.
4. A BEFORE UPDATE trigger compares the new and old row for every device identity field. A change to ID, tenant, case, device type, manufacturer, model, identifier metadata, or creation timestamp is rejected.
5. The schema validates the target state and requires a human-readable reason between 10 and 1000 characters. Unknown request fields are rejected.
6. The API verifies the caller's active tenant context and staff role before loading the device row.
7. It selects the device by both `device_id` and `case_id`; a device from another case is not treated as a match.
8. The API reads the current status and checks the explicit transition map before writing.
9. On an invalid transition, the API raises the dedicated workflow-conflict error and the global error handler returns HTTP 409. This is a conflict, not an authentication failure.
10. On a valid transition, only `ownership_status` is updated.
11. The API writes a case event containing the review reason and metadata for device ID, previous status, and new status.
12. It writes an audit event with action `device.ownership_reviewed` and the same state transition metadata.
13. The browser UI displays the current state and a staff review form; the explanatory text avoids representing an organization review as independent legal proof.
14. Schema tests validate supported states, reason length, and strict body shape.

**Known test gap:** schema tests do not replace API/database integration tests. The role, tenant, transition, trigger, and transaction behaviors still need direct integration coverage under the restricted application DB role.

### C. Evidence upload — request-to-object-storage trace

1. The route first extracts a bearer token. Missing credentials are rejected before multipart parsing or object storage.
2. The configured OIDC token verifier resolves the authenticated subject.
3. Evidence service configuration is checked. Missing S3-compatible storage or ClamAV settings returns service unavailable; upload does not silently bypass scanning.
4. The route validates organization and case UUIDs.
5. The multipart parser accepts one file and bounded metadata fields. The API requires an allowed evidence kind and a purpose string between 5 and 500 characters.
6. The file is buffered with a 50 MiB limit. Empty files are rejected.
7. `file-type` inspects file bytes; declared MIME type or extension is not trusted.
8. Only PDF, JPEG, PNG, and WebP are accepted.
9. ClamAV receives the file using the INSTREAM protocol. Malware detection rejects the file. Timeout, scanner error, or incomplete response is treated as a failed scan; the object is not stored.
10. The API calculates SHA-256 from the validated file bytes.
11. A random object key and evidence UUID are generated; user-controlled filenames are not used as storage keys.
12. The object is stored in the configured bucket with server-side AES256 encryption and digest/evidence metadata.
13. Inside `withTenantContext`, the API checks the caller role, verifies the case is visible in the tenant, inserts the evidence metadata row, inserts an upload access event, and writes a case timeline event.
14. If the case is not found, the newly stored object is deleted and a 404 is returned.
15. If the database operation fails after object upload, cleanup is attempted. If cleanup also fails, an operator-intervention log is emitted. This compensating-delete pattern is not a distributed transaction; production operations must monitor orphan cleanup.
16. A successful request returns metadata, not the file bytes.

### D. Evidence download — integrity and access trace

1. The route requires bearer authentication, valid organization and evidence UUIDs, and a non-empty purpose header bounded to 5–500 characters.
2. It checks that object storage and scanning configuration are available.
3. It enters tenant context and loads the evidence row through database policies.
4. It only serves records whose verification status is `available`.
5. It fetches the object using the server-side object key.
6. It reads the object body and recomputes SHA-256 and byte length.
7. If either digest or byte length differs from the database metadata, the download throws an integrity error and does not return the bytes.
8. On a successful verification, the route inserts a `download` access event with actor and purpose.
9. It returns the bytes with a private, no-store cache header and a generated download filename.

**Important limitation:** the current integrity mismatch path rejects the download, but a dedicated persisted integrity-failure status, alert, reviewer task, and audit trail are still outstanding. A thrown error alone is not a durable incident record.

### E. Evidence access history — authorization and query trace

1. The route requires and verifies the bearer token.
2. It rejects a missing or malformed organization UUID.
3. It rejects a malformed evidence UUID before database access.
4. It opens the standard tenant transaction; the helper validates active user and active organization membership and sets transaction-local database context.
5. It allows `organization_admin`, `investigator`, and `auditor`; other active roles are denied.
6. It selects only event identifier, actor identifier, action, purpose, and timestamp.
7. It filters by evidence ID and relies on the active tenant RLS context and event-table tenant policies/relationships for tenant isolation.
8. It sorts by `occurred_at ASC, id ASC` to provide deterministic chronological output when timestamps tie.
9. It returns the history as data; it does not modify the evidence record or create an event just because history was viewed.
10. A test confirms unauthenticated requests return 401 before the fake database is touched.

**Remaining verification:** positive-path test, each allowed/denied role, cross-tenant evidence ID, unknown evidence ID, ordering with equal timestamps, and query plan/index coverage. Also verify that the route's database role cannot update or delete access-event rows.

### F. CI failure and correction trace

**Failed SHA:** `38a2f102572755765b7c89326613a0c3faae1a0a`  
**Workflow:** TypeScript, build, and database security checks  
**Run:** `44531423114`  
**Failed step:** Type-check  
**Exact diagnostic:** `server/app.ts(467,41): error TS2345: Argument of type '409' is not assignable to parameter of type '401 | 403'.`

The failed job stopped after type-check. API compile, unit tests, build, restricted database role setup, migration application, tenant-isolation checks, and authenticated PostgreSQL API tests were skipped by the workflow's dependency chain. The same SHA's CodeQL and Vercel preview-feedback checks completed successfully, but those successes do not cancel out the failed required CI workflow.

**Correction applied:** commit `6ef20a3bc1ce24c9d2bec57ed4d70ba389eb3805` changes the ownership-transition branch to use the existing `CaseWorkflowConflictError`, which is explicitly handled as HTTP 409. This preserves the distinction between:
- 401: missing or invalid authentication;
- 403: authenticated identity lacks provisioning/membership/role permission;
- 409: authenticated and authorized request conflicts with the state machine.

**Required close-out:** inspect the exact latest branch head after this correction, collect all check conclusions, and append them here. If any check fails, append the failure and corrective SHA; do not overwrite this failure record.

### G. Evidence that must be retained for future milestones

For each new commit, add:
- Date and exact full commit SHA.
- Branch and PR number.
- Files created/changed.
- Migration number and whether it is additive/backward compatible.
- Endpoint method/path, request validation, authentication, authorization, tenant scope, response behavior and error codes.
- UI behavior and accessible error/loading states.
- Threats considered and data minimization decisions.
- Tests added and test commands/checks executed.
- Workflow run IDs, job names, URLs and conclusions.
- Known gaps, deployment prerequisites and rollback considerations.

Do not write secrets, access tokens, personal data, raw evidence, IMEI values, or private customer information into this log.

## Follow-up close-out — 2026-11-19

### Additional hardening and test steps after the detailed trace

**Step H — Add malformed evidence-ID coverage**
- Added an authenticated request test for `GET /v1/evidence/:evidenceId/access-history` using a malformed evidence identifier and valid organization header.
- The expected behavior is HTTP 400 with `invalid_request`, before any tenant database query.
- Commit: `3054270aefe7aca92cb861fc5f9477af7c84bba9`.

**Step I — Ensure the new database migration is part of CI**
- Reviewed `.github/workflows/ci.yml` and found that the PostgreSQL validation workflow applied migrations 0001 through 0005 but did not yet apply the newly introduced 0006 ownership-review migration.
- Added `db/migrations/0006_device_ownership_review.sql` to the ordered migration application step, after migration 0005.
- This ensures the CI database exercises the ownership-review policy, column-level grant and identity-protection trigger from a clean database.
- Commit: `9d10eaeb7b8f25e302fc466c982484771d968a45`.

**Step J — Add explicit tenant predicate to evidence history query**
- Updated the access-history query to filter by both `organization_id` and `evidence_id`, using the organization established by the validated request header and tenant context.
- RLS remains an additional database boundary; the explicit SQL predicate makes the intended tenant scope visible in the query itself.
- Parameters are bound (`[orgHeader, evidenceId]`); no user-controlled SQL interpolation is used.
- Commit: `540e6c241b49e2b75959cd3a36500e085410911f`.

### Verified validation on the exact code SHA

**Code SHA:** `540e6c241b49e2b75959cd3a36500e085410911f`

- CI run `44533126734`: **completed / success**.
  - Dependency audit summary: success.
  - High-severity dependency audit threshold: success.
  - TypeScript type-check: success.
  - API type-check and compile: success.
  - Unit tests: success.
  - Frontend production build: success.
  - Restricted application database role setup: success.
  - Ordered migrations 0001–0006 applied: success.
  - Tenant isolation and immutable-record checks: success.
  - Authenticated API tests against PostgreSQL: success.
- CodeQL run `44533126706`: **completed / success**.
- Vercel Preview Comments check on this SHA: **completed / success**.

The earlier failure on SHA `38a2f102572755765b7c89326613a0c3faae1a0a` remains in the historical record. It was corrected, then the complete CI pipeline was run successfully on the later code SHA above. The CI run that had been cancelled on an intermediate SHA is not counted as a pass.

### Current branch status at this record

- Latest code commit validated by full CI and CodeQL: `540e6c241b49e2b75959cd3a36500e085410911f`.
- Documentation has been expanded in this file to preserve the full implementation trace.
- PR #2 remains open and draft, based on `product/enterprise-foundation`.
- No merge into `main` was performed.
- A passing CI pipeline validates the configured automated checks; it does not close the operational, legal, privacy, identity, production hosting, storage, independent security, or institutional pilot gates listed above.

