# Security Policy

## Current status

IPTIRS is a development prototype and backend foundation. It is not approved for production personal data, investigative records, device identifiers, evidence files, or telecom/government integration.

## Reporting a vulnerability

- Do not publish credentials, tokens, personal information, evidence, exploit details, or an unpatched vulnerability in a public issue.
- If private vulnerability reporting is enabled for this repository, use that channel. Otherwise contact the repository maintainer privately through GitHub.
- Include the affected component, impact, reproduction conditions, and a suggested mitigation where possible.
- Do not test against real phone numbers, devices, telecom networks, government systems, or third-party accounts.
- Do not access, modify, or retain another person's data while validating a report.

There is currently no published bug-bounty program or guaranteed response-time commitment.

## Supported security boundaries

- Report only vulnerabilities in this repository or deployments explicitly authorized by their owner.
- Use synthetic data in development and tests.
- Never commit secrets, production connection strings, identity-provider credentials, private keys, or personal data.
- Do not attempt to bypass operator authorization, track devices, intercept communications, or access subscriber information.

## Release requirement

Before any institutional pilot, vulnerabilities must be triaged, critical/high findings remediated or formally risk-accepted by the accountable institution, and an independent security assessment completed.
