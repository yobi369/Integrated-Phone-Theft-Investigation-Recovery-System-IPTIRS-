# Security, Privacy, and Evidence Safeguards

## Status

This is a product security baseline and review checklist, not a certification, legal opinion, or claim of compliance. A qualified Kenyan legal and data-protection review is required before processing real personal or investigative data.

## 1. Privacy principles

- Define a lawful basis and specific purpose for each processing activity.
- Collect only data necessary for that purpose.
- Explain collection, use, sharing, retention, and rights in clear notices.
- Restrict access by role, organization, case assignment, and purpose.
- Set and enforce retention schedules; support authorized deletion and legal holds.
- Assess third-party processors, cross-border transfers, hosting, and subprocessors.
- Complete a data-protection impact assessment where required or appropriate.
- Provide a process for data-subject requests and privacy complaints.

## 2. High-risk data

Treat device identifiers, contact details, identity documents, ownership records, incident narratives, evidence files, investigative notes, operator responses, and location-related data as sensitive. Do not expose these values in URLs, analytics, browser storage, application logs, crash reports, or AI prompts.

## 3. Evidence integrity

Every evidence item should record:
- Unique immutable identifier.
- Uploading actor and organization.
- Case association and declared evidence type.
- Server receipt timestamp and source timestamp where known.
- Cryptographic content hash (for example SHA-256).
- Original filename and validated media type.
- Malware scanning and validation outcome.
- Every access, export, transfer, and custody change.
- Retention and legal-hold state.

Preserve the original object. Any redaction, conversion, annotation, or derived copy must be a separately recorded derivative linked to the original.

## 4. Access and approvals

- Deny access by default.
- Enforce permissions on the server, not only in the user interface.
- Require MFA for privileged users.
- Require dual control for high-impact disclosures or actions.
- Revalidate authorization when a request is approved and before it is sent.
- Log sensitive reads, searches, exports, permission changes, and failed access attempts.
- Review privileged access periodically and revoke promptly when roles change.

## 5. Incident response

Maintain documented procedures for suspected account compromise, unauthorized disclosure, malicious uploads, service compromise, evidence integrity failures, and third-party incidents. Preserve relevant logs, contain access, assess impact, notify responsible institutional contacts, and follow applicable legal notification obligations.

## 6. Release blockers

Do not use real case data until all applicable items are satisfied:
- [ ] Legal basis and data controller/processor roles documented.
- [ ] Privacy notice, retention schedule, and data-subject process reviewed.
- [ ] Threat model and data-flow map approved.
- [ ] Independent security assessment completed.
- [ ] Tenant isolation and authorization tests pass.
- [ ] MFA and privileged-access controls verified.
- [ ] Evidence integrity and audit-log controls tested.
- [ ] Backup restore and incident response exercises completed.
- [ ] Vendor, hosting, and data-transfer reviews completed.
- [ ] Written institutional approval and operating procedures in place.
