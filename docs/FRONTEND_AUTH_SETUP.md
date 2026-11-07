# Browser OIDC setup

The browser uses OpenID Connect authorization code flow with PKCE (S256). It does not collect or store local passwords. Configure an institution-owned OIDC public client and a separately configured API verifier before attempting sign-in.

## OIDC public client

Register a public browser client with:

- Authorization Code flow enabled.
- PKCE required with S256.
- Client authentication disabled (no client secret in browser code).
- Exact redirect URI: `https://<approved-browser-host>/auth/callback`.
- Exact silent-renew URI: `https://<approved-browser-host>/auth/silent-renew`.
- Post-logout redirect URI: `https://<approved-browser-host>/`.
- Allowed web origin: `https://<approved-browser-host>`.
- Scopes: `openid profile email`.

The provider must issue an access token whose issuer and audience match the API configuration. The API verifier currently accepts RS256 or ES256 signed JWTs and requires `sub`, `iss`, `aud`, `iat`, and `exp` claims. The API resolves the verified subject to an active IPTIRS user and membership; an identity-provider account alone does not grant organization access.

## Browser build variables

Set these as build-time environment variables in the browser hosting service:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | HTTPS base URL of the IPTIRS API |
| `VITE_OIDC_AUTHORITY` | OIDC issuer/authority URL |
| `VITE_OIDC_CLIENT_ID` | Public OIDC client identifier |
| `VITE_ORGANIZATION_ID` | UUID of the organization selected for this deployment |

The organization UUID is a routing context, not a credential. The API checks active membership for every request. This initial browser build is configured for one organization at a time; organization switching is not yet implemented.

## API service variables

Configure the API separately:

- `OIDC_ISSUER` must exactly match the issuer in verified access tokens.
- `OIDC_AUDIENCE` must match the access-token audience.
- `OIDC_JWKS_URL` must point to the provider's trusted signing-key set.
- `CORS_ORIGINS` must contain the exact HTTPS browser origin.
- `DATABASE_URL` and `DATABASE_SSL` must point to the institution's approved database configuration.

Do not put API secrets, database credentials, private keys, client secrets, or evidence-storage credentials in `VITE_*` variables. Vite variables are included in browser assets and are public.

## Account provisioning boundary

A user must be provisioned in the institution's identity provider and in the IPTIRS `users` table with the matching immutable OIDC subject before access can be granted. An organization administrator can then manage an existing membership using the organization access screen. Email invitations, automatic identity synchronization, account deprovisioning from the identity provider, MFA policy enforcement, and just-in-time provisioning are not implemented in this phase.

## Staging verification checklist

1. Use a dedicated test issuer, public client, test organization, and synthetic accounts.
2. Verify the issuer, audience, JWKS rotation, token expiry, and invalid-signature rejection.
3. Verify callback URLs and PKCE on the deployed HTTPS origin.
4. Verify a user without a provisioned IPTIRS record receives 403.
5. Verify a provisioned user without active organization membership receives 403.
6. Verify role restrictions and organization isolation with multiple synthetic accounts.
7. Verify sign-out, expired sessions, and silent renewal behavior against the selected provider.
8. Review CSP, CORS, redirect URI allowlists, access-token lifetime, refresh policy, and provider MFA settings with the institution's identity/security team.

This guide does not establish production readiness or guarantee compatibility with a provider that has not been configured and tested.
