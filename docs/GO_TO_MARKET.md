# IPTIRS — Market Entry Plan

## 1. Commercial position

**Category:** institutional device-incident case management and evidence-governance software.

**One-line value proposition:** IPTIRS gives organizations a traceable workspace to receive device-loss/theft incidents, coordinate authorized case work, preserve evidence records, and review accountable decisions.

Do not sell IPTIRS as a phone-tracking service, IMEI blacklisting service, police system, telecom integration, or guaranteed device-recovery service. Those capabilities are not implemented or authorized.

## 2. Initial customer wedge

Start with organizations that own or manage fleets of devices and can adopt an internal workflow without depending on a national police or telecom integration:

1. Universities and colleges managing staff/student-issued devices.
2. Employers and NGOs managing laptops and mobile-device fleets.
3. Insurers and brokers handling device-theft claims and supporting evidence.
4. Device retailers, repair networks, and authorized service businesses managing customer incident records.

Treat law-enforcement agencies and mobile network operators as later institutional stakeholders, not assumed first customers. Any integration requires a partner-approved scope, legal review, written agreement, and sandbox validation.

## 3. Buyer and user map

| Role | Problem to validate | IPTIRS value to demonstrate |
|---|---|---|
| Operations / asset manager | Reports, ownership records and handoffs are fragmented | One controlled incident and case workflow |
| Security / investigations lead | Case actions and assignment history are difficult to audit | Role-scoped casework and chronological events |
| Claims / risk manager | Evidence provenance and decision history are inconsistent | Hash-backed evidence metadata and recorded decisions |
| IT / security lead | Sensitive records need access boundaries | OIDC, tenant isolation, least privilege and audit events |
| Legal / privacy lead | Requests and disclosures need documented purpose and approval | Scope-limited authorization workflow and traceability |

## 4. Discovery before pricing

Run 12–15 structured discovery conversations across at least three customer types. Do not pitch a recovery outcome. Establish:

- How device-loss/theft incidents are reported today.
- Which records are collected and where they are stored.
- How ownership is verified and duplicate reports are handled.
- Who assigns and approves case actions.
- How evidence is received, retained, accessed and exported.
- Which external parties are contacted and under what authority.
- What audit, retention, privacy and procurement requirements apply.
- Who owns the budget and what current process costs in time or money.

A problem is commercially validated only when a buyer confirms the workflow pain, identifies an accountable budget owner, and agrees to a concrete next step.

## 5. Pilot offer

Offer a time-boxed, institution-sponsored workflow evaluation. Start with synthetic data or explicitly consented test data only.

Pilot scope:
- One organization and a small, named user group.
- Case intake performed by authorized staff.
- Case assignment, status changes and timeline review.
- Evidence workflow tested with non-sensitive sample files after private storage and malware scanning are provisioned.
- Role and tenant-boundary tests.
- User feedback and measured task completion.

Pilot exit evidence:
- Named executive sponsor and operational owner.
- Signed pilot scope, data-processing terms and security responsibilities.
- Approved data categories, lawful basis, retention and deletion rules.
- Successful identity, MFA, backup/restore and incident-response tests.
- Documented user acceptance and prioritized remediation.
- Written decision to stop, extend, or procure.

Never put real theft reports, IMEI records, identity documents, live location data or evidence into a demo environment.

## 6. Commercial model to test

Do not publish fixed prices until interviews establish procurement expectations and hosting/support costs.

Test three packaging hypotheses:
- **Team:** one organization, limited users, case workflow and audit history.
- **Institution:** multiple departments, configurable roles, retention and reporting.
- **Managed deployment:** institution-controlled identity, hosting, support and integration work.

Price discovery should test annual subscription willingness, implementation fees, support expectations, data residency, service levels, and whether customers require institution-owned hosting. Do not promise custom telecom or government integrations as part of a standard subscription.

## 7. Kenya privacy and governance gate

Before processing real personal data, obtain qualified Kenyan legal/privacy advice on IPTIRS's role as a data controller, processor, or both for each deployment and contract. Confirm applicable ODPC registration obligations and the customer's responsibilities.

The ODPC publishes registration guidance and explains controller/processor registration: https://www.odpc.go.ke/data-protection-compliance/ and https://www.odpc.go.ke/faqs/.

Assess whether a Data Protection Impact Assessment is required before any high-risk processing. ODPC guidance and the Data Protection (General) Regulations identify high-risk processing categories, including large-scale processing, sensitive personal data, and innovative technologies: https://odpc.go.ke/guidelines-2/.

Also complete:
- Data processing agreement and controller/processor responsibility matrix.
- Data minimization, purpose limitation, retention and deletion schedule.
- Data-subject rights and complaint handling.
- Cross-border transfer and hosting review.
- Breach detection, escalation and notification procedure.
- Security assessment, access review and tested recovery plan.

This document is a product planning aid, not legal advice or a claim of regulatory compliance.

## 8. Launch gates

IPTIRS is not ready for production customer data until all applicable gates are closed:

- [ ] Institution-owned OIDC configured, including MFA and lifecycle controls.
- [ ] Production API and database deployed with managed secrets and restricted network access.
- [ ] Private object storage, encryption, malware scanning and recovery tested.
- [ ] Retention, legal hold, export and deletion controls implemented and tested.
- [ ] Independent security review and remediation completed.
- [ ] Privacy/legal review, contracts and required registrations completed.
- [ ] Monitoring, incident response, backup and restore exercises completed.
- [ ] Customer acceptance, support ownership and rollback plan documented.

## 9. First 30 days

**Week 1:** finalize product demo with synthetic data, one-page product brief, pilot scope, and discovery script.

**Week 2:** conduct the first five buyer interviews; document workflow evidence and procurement blockers.

**Week 3:** conduct the next seven to ten interviews; rank customer segments by urgency, budget ownership, and integration dependency.

**Week 4:** choose one narrow pilot segment, revise the product backlog from evidence, and seek a written pilot evaluation agreement.

Success is a qualified pilot with a real budget owner—not website traffic, speculative partnerships, or unverified recovery statistics.
