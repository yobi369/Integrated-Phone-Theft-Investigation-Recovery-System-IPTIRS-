# IPTIRS Product Charter

## 1. Product purpose

IPTIRS is a case-coordination and evidence-management platform for reported lost or stolen devices. Its purpose is to reduce fragmented reporting and improve traceability across authorized participants. It is not a surveillance platform and does not itself provide access to telecommunications networks.

## 2. Problem to validate

Discovery with citizens, investigators, operators, and institutional asset teams should establish whether device-theft reports are currently fragmented across channels; whether evidence and ownership details are difficult to verify; whether authorized requests and responses are difficult to track; and which handoffs cause delays. These are hypotheses to validate with stakeholders, not established findings.

## 3. Primary user journeys

### Citizen
1. Submit a report with contact details, device description, IMEI/serial number where available, proof-of-ownership references, incident details, and optional supporting files.
2. Receive a reference number and clear explanation of next steps.
3. Provide additional information and view only updates authorized for public release.

### Investigator
1. Sign in using institution-approved identity controls.
2. Review assigned reports and verify required fields.
3. Record triage, assignment, investigative actions, evidence, decisions, and handoffs.
4. Initiate a restricted operator request only when the required authority and approval are recorded.
5. Record operator response and subsequent action without altering source evidence.
6. Close the case with a reason and outcome classification.

### Telecommunications operator
1. Receive a structured request through an approved channel.
2. Verify request authenticity, scope, legal authority, and internal approvals using operator processes.
3. Respond through an authenticated integration or controlled manual workflow.
4. Record request and response references, decision, timestamps, and authorized disclosures.

### Institutional asset administrator
1. Register organization-owned devices and supporting purchase/assignment records.
2. Report loss or theft.
3. Track internal actions and permitted external case references.

### Auditor / compliance officer
1. Review access logs and case actions within granted scope.
2. Verify approvals, retention, evidence access, and policy exceptions.
3. Export an audit package without gaining unrestricted access to case content.

## 4. Core product modules

- Identity, organizations, roles, and access approvals.
- Citizen intake and report verification.
- Device registry and ownership evidence.
- Case management and assignment.
- Evidence vault and chain-of-custody records.
- Authorized request and response workflow.
- Notifications and status updates.
- Audit, compliance, reporting, and administration.
- Integration adapters with explicit enablement controls.

## 5. Product success measures

Measure only from verified production or pilot data:
- Report completion and duplicate-report rates.
- Time from report submission to triage and assignment.
- Percentage of cases with required ownership evidence.
- Time to process authorized requests.
- Evidence records with complete provenance.
- Case outcomes and recovery confirmation rates.
- Unauthorized access attempts and policy exceptions.
- User satisfaction and accessibility.

No target values should be published until a baseline is measured with a participating institution.

## 6. Non-goals and prohibited capabilities

- Covert or unauthorized tracking, interception, or surveillance.
- Bulk querying of subscriber, location, or network records.
- Automated suspect identification or guilt scoring.
- AI-generated evidence, coordinates, or fabricated intelligence.
- Unreviewed automated blocking, wiping, or disabling of devices.
- Public disclosure of sensitive case information.
- Claims of official status, agency endorsement, or operator integration without written evidence.

## 7. Stakeholder validation

Before a pilot, conduct structured discovery with:
- A relevant public-sector investigative stakeholder.
- A telecommunications security/fraud and legal/compliance stakeholder.
- A data-protection/privacy reviewer.
- A security architect and operational support representative.
- Representative citizens and institutional asset administrators.

## 8. Pilot boundary

Start with a limited, non-production pilot using synthetic or explicitly consented test data. Exclude live location data, subscriber records, and production operator connections until separate legal, contractual, security, and technical approvals are complete.
