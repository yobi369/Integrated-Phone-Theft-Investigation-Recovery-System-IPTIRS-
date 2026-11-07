# Case management API

## Trust and access model

Every endpoint below requires a verified OIDC bearer token and an active organization membership. The organization is selected with the `X-Organization-Id` header, but the server verifies membership from the authenticated subject; the header is not an authorization grant. All database operations run inside a transaction-local tenant context and PostgreSQL RLS policies.

Use synthetic records and test tokens only. No endpoint in this API contacts a telecom operator, police database, government system, or device-location service.

## Endpoints

### List cases

`GET /v1/cases?limit=50&status=in_progress`

Returns cases visible to the authenticated member. Reporters are restricted to cases they created. Other case visibility is controlled by membership role and database policy.

### Create a case

`POST /v1/cases`

```json
{
  "category": "phone_theft",
  "priority": "normal",
  "summary": "Synthetic example report describing the incident."
}
```

A successful response returns a generated IPTIRS case reference. The case creation, initial timeline event, and audit digest are written in one database transaction.

### Get case details and timeline

`GET /v1/cases/{caseId}`

Returns the case record, visible assignment history, and append-only chronological case events. A case outside the caller's visibility returns 404.

### Change case status

`PATCH /v1/cases/{caseId}/status`

Requires an active investigator or organization administrator membership.

```json
{
  "status": "under_review",
  "reason": "Initial triage completed and the report is ready for review."
}
```

Every transition requires a reason and writes both an append-only case event and an audit event. The API and PostgreSQL trigger both enforce the allowed state machine:

- submitted → under_review or rejected
- under_review → accepted or rejected
- accepted → in_progress
- in_progress → pending_external_response or recovered
- pending_external_response → in_progress or recovered
- recovered → in_progress or closed
- closed and rejected are terminal

An invalid transition returns HTTP 409. The database trigger independently rejects invalid status changes even if application validation is bypassed.

### Assign an investigator

`POST /v1/cases/{caseId}/assignments`

Requires an active investigator or organization administrator. The assignee must be an active investigator or organization administrator in the same organization.

```json
{
  "assigneeUserId": "00000000-0000-4000-8000-000000000000",
  "reason": "Assign a second investigator for independent review."
}
```

The database enforces one active assignment per case and assignee. Assignment creation is recorded in the case timeline and audit log.

### Release an assignment

`DELETE /v1/cases/{caseId}/assignments/{assignmentId}`

Requires an active investigator or organization administrator. Release is recorded with a timestamp; assignment identity is immutable and released records cannot be reactivated. A new assignment creates a new history record.

### Request sensitive operator authorization

`POST /v1/cases/{caseId}/authorizations`

Requires an investigator or organization administrator. The request remains pending until independently decided.

```json
{
  "purpose": "Request a limited operator status check for this synthetic case.",
  "requestedAction": "operator_status_check",
  "legalAuthorityReference": "SYNTHETIC-TEST-AUTHORITY",
  "scope": { "testOnly": true, "fields": ["request_status"] },
  "validUntil": "2027-01-01T12:00:00Z"
}
```

The legal-authority reference is recorded as supplied; IPTIRS does not determine whether it is legally sufficient.

### Approve or reject a request

`POST /v1/authorizations/{authorizationId}/decision`

Requires an active `authorization_approver` or organization administrator membership. The requester cannot decide their own request, even if they also hold an approver-capable role. Every decision requires a reason. A dedicated non-login database role and restricted SECURITY DEFINER function enforce the decision boundary; the general application database role has no direct UPDATE grant on authorization records.

```json
{
  "decision": "approved",
  "reason": "Independent reviewer examined the request scope and supporting reference."
}
```

Approval records the decision-maker and timestamp. Rejection is also retained as a decision, with its reason. Neither action sends a request to an operator. The external operator must independently validate and process any request under its own controls.

## Error semantics

- `400 invalid_request`: invalid parameters or body.
- `401 unauthorized`: bearer token missing or invalid.
- `403 forbidden`: no active organization membership or insufficient role.
- `404 not_found`: case or active assignment is not visible or does not exist.
- `409 workflow_conflict`: invalid status transition or duplicate active assignment.
- `500 internal_error`: unexpected server failure; response does not expose database details.

## Current limitations

- The React interface is not yet connected to these authenticated API endpoints.
- There is no public citizen intake, account provisioning UI, institutional SSO configuration, or MFA configuration.
- No production database, evidence object store, notifications, or partner integration is configured.
- API rate limiting is process-local and must be moved to a shared store or gateway before horizontal scaling.
