# Security

Never commit secrets. Only `NEXT_PUBLIC_*` values may be sent to browser code; `SUPABASE_SERVICE_ROLE_KEY`, provider keys, monitoring auth tokens, Stripe secrets, and webhooks stay server-only.

Every future user-facing table requires RLS and a negative authorization test in the same PR. Use expiring, unguessable invitation tokens, store hashes where practical, rate-limit guessing attempts, validate host permissions and transitions on the server, and avoid broadcasting individual votes, veto identities, private preferences, or raw authorization data.

## Contract-only v1 privacy rules

- Invitation links or token representations may be returned only in the dedicated client-safe invitation response. Persisted invitation-token hashes are server-only and must not enter public room state, realtime payloads, logs, fixtures, or error messages.
- Guests participate with a temporary display name and invitation token. The token is an input to joining; it is not echoed by join responses or included in room state.
- Public room state may include session metadata, display names, roles, readiness, aggregate completion counts, and an aggregate final result. It must reject individual vote values, veto identities, participant preferences, security fields, random seeds, and internal debugging data.
- Individual ballots and private preferences remain server-only until a later explicitly approved participant-private contract is required. Realtime may announce aggregate progress only.
- API errors use a closed machine-readable code enum and safe client copy. They must not expose stack traces, SQL/provider errors, internal exception messages, authorization details, invitation secrets, or credentials.
- Server-only contract fields include invitation-token hashes and decision-engine random seeds. Server endpoints remain responsible for transition validation, authorization, and result finalization.

## Persistence foundation RLS

All persistence tables enable RLS and grant no direct privileges to `anon` or `authenticated`; no policies are created in this batch. Raw invitation and guest tokens are generated and consumed only by future server operations, while only non-empty hashes are persisted. Invitation hashes, guest credential hashes, and all future internal fields must never be projected to clients. Future create/join operations must use server-owned authorization and safe response projections, with actual negative anonymous and authenticated authorization tests run against local Supabase before enabling access.

## Session-operation RPC boundary

`create_decision_session_v1` and `join_decision_session_v1` are `SECURITY DEFINER` functions solely to perform their reviewed atomic writes while direct table access remains deny-by-default. Each sets `search_path` to empty, schema-qualifies database references, uses no dynamic SQL, revokes execution from `PUBLIC`, `anon`, and `authenticated`, and grants execution only to `service_role`. RLS remains enabled and client roles retain no direct table access.

The server constructs the service-role client only from server-only credentials. Tokens use cryptographically secure Node bytes, URL-safe encoding, and deterministic one-way SHA-256 hashing. The raw invitation is returned once via `inviteUrl`; the raw guest token is returned only in a server-internal result for the future HttpOnly-cookie adapter. Neither raw token nor hash is logged, stored in public room state, exposed through safe RPC results, or sent to browser code. Invalid, revoked, and expired invitations map to stable safe errors without revealing why resolution failed. HTTP adapters must add rate limiting and abuse protection before public exposure.

## Session HTTP adapters

`POST /api/v1/sessions` and `POST /api/v1/sessions/join` are server-only adapters. Create requires the strict contract, including a trimmed `hostDisplayName` of 1-60 characters; join accepts only its strict invitation and display-name contract. Both accept only `application/json` (a charset parameter is permitted), bound request bodies to 16 KiB before parsing, and return safe JSON errors without exception details.

Deployments must set `VIBEVOTE_APP_ORIGIN` (and the existing server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) without committing values. This origin is the sole authority for invitation URL construction and same-origin checks: cross-site `Origin` headers are rejected, missing `Origin` is deliberately allowed for same-site navigation, forwarded/Host headers are never trusted, and the routes emit no broad CORS headers. Production and preview fail closed if the configured origin or a durable rate limiter is unavailable. Development and test are explicitly permissive only to support local execution. A durable serverless-compatible limiter must be supplied before public production exposure; no in-memory production limiter is claimed.

Successful joins set the raw guest access token only as the session cookie `vibevote_guest_v1`: `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/sessions`, `Secure` outside development/test, with no `Max-Age` or `Expires`. The raw token is never logged or serialized in JSON; only its hash is stored. `apps/web/lib/server/**` imports `server-only` so HTTP credentials and adapters cannot enter a client bundle.
