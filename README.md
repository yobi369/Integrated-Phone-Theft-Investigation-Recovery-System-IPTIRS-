# IPTIRS — Integrated Phone Theft Investigation & Recovery System

**An institution-oriented case coordination and device recovery platform.**

IPTIRS is being developed as a secure workflow platform to help citizens, authorized investigators, telecommunications providers, and participating institutions coordinate stolen-device reports, case handling, evidence records, and recovery outcomes.

> **Current status: research prototype / development foundation.** This repository is not an operational police system, a telecom network integration, an IMEI blacklist service, or a live device-location service. No government agency, mobile network operator, or other institution is represented as a partner or adopter.

## Product goals

- Make it easier to submit and manage verified lost/stolen-device reports.
- Maintain traceable case histories, evidence provenance, and accountable handoffs.
- Support authorized, purpose-limited collaboration between participating organizations.
- Provide useful operational reporting based on real, permissioned data.
- Protect personal information through least-privilege access, retention controls, and auditable actions.
- Integrate with external systems only through documented, approved interfaces and institutional agreements.

## Intended users

- Members of the public submitting reports and checking permitted case updates.
- Authorized investigators reviewing reports and managing case workflows.
- Participating mobile network operators responding to lawful, approved requests through their own authorized processes.
- Institutional asset administrators managing registered organizational devices.
- Independent auditors and compliance officers reviewing access and process controls.

## What IPTIRS does not do

- It does not independently locate, track, intercept, or remotely control a phone.
- It does not access telecom subscriber records, cell-site data, or operator networks.
- It does not establish ownership or guilt based on an IMEI, AI output, or unverified report.
- It does not replace police investigation, court processes, operator procedures, or statutory authority.
- AI output, if introduced, is advisory only and must never fabricate coordinates, suspects, evidence, or investigative findings.

## Current prototype

The existing React + TypeScript + Vite interface contains dashboard, asset registry, tracking-themed, forensics-themed, and configuration screens. Several current screens use hard-coded demonstration records and simulated visuals. These are not operational data and must be clearly marked as demo content until replaced with validated backend services.

## Product development principles

1. **Lawful by design:** sensitive requests require a documented legal basis, authorization, purpose, and accountable decision.
2. **Privacy by design:** collect the minimum information necessary; restrict access and enforce retention/deletion rules.
3. **Evidence integrity:** preserve provenance, timestamps, actor identity, and tamper-evident audit history.
4. **No false capability claims:** no simulated map, AI output, or sample statistic may be represented as live intelligence.
5. **Institutional separation:** organizations and cases must be isolated by tenant and role.
6. **Security before integrations:** external integrations remain disabled until reviewed, contracted, authenticated, and tested.
7. **Human accountability:** high-impact actions require authorized human review and approval.

## Planned product capabilities

- Public incident intake and report reference numbers.
- Device and ownership evidence registry with verification states.
- Investigation case management, assignment, status transitions, and handoffs.
- Evidence uploads with hashes, provenance, access logs, and retention policies.
- Controlled operator-request workflow with authorization records and response tracking.
- Role-based access, multi-organization tenancy, and strong authentication.
- Audit, compliance, analytics, backup, restore, and incident response.
- Documented integration adapters and sandbox environments.

## Technology today

- React 19
- TypeScript
- Vite
- Recharts
- Google GenAI SDK (currently present in the prototype; not approved for sensitive case data)

A production backend, identity provider, transactional database, evidence storage, and institutional integrations are not yet established.

## Development

```bash
npm install
npm run dev
npm run build
```

## Project status and governance

See:
- [Product charter](docs/PRODUCT_CHARTER.md)
- [Architecture and trust boundaries](docs/ARCHITECTURE.md)
- [Security and privacy baseline](docs/SECURITY_AND_PRIVACY.md)
- [Delivery roadmap and acceptance gates](docs/ROADMAP.md)

## Institutional engagement

IPTIRS is open to technical review, discovery workshops, and controlled pilot discussions. Any pilot involving real people, personal data, investigations, or operator information requires institutional sponsorship, legal/privacy review, security assessment, documented operating procedures, and written authorization before production data is used.

**Ownership:** This repository is an independent development project. Names of agencies and companies in product discussions indicate intended stakeholder categories only, not endorsement or affiliation.
