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

The server constructs the service-role client only from server-only credentials. Tokens use cryptographically secure Node bytes, URL-safe encoding, and deterministic one-way SHA-256 hashing. The raw invitation is returned once via `inviteUrl`; the raw guest token is returned only in a server-internal result for the future HttpOnly-cookie adapter. Neither raw token nor hash is logged, stored in public room state, exposed through safe RPC results, or sent to browser code. Invalid, revoked, and expired invitations map to stable safe errors without revealing why resolution failed.

## Participant credential bootstrap

Hosts and guests use one credential model: `session_participants.participant_access_token_hash`. New create and join operations generate a cryptographically secure raw participant token, persist only its SHA-256 hash, and return the raw value only inside the server-internal operation result. Existing guest hashes are preserved by the additive migration. Legacy host rows without a hash remain intact but cannot resume through bootstrap; no raw credential is fabricated for them.

Successful create and join responses set `vibevote_participant_v1`, an `HttpOnly`, `SameSite=Lax` session cookie scoped exactly to `/api/v1/sessions/{sessionId}`. It is `Secure` outside explicit development and test, has no `Max-Age` or `Expires`, and is never available to client JavaScript, JSON responses, logs, or storage. `GET /api/v1/sessions/{sessionId}` reads only that cookie; query strings, request bodies, and authorization headers are not credential sources. Missing, invalid, and mismatched credentials intentionally share the same safe unauthorized response.

`get_participant_session_v1`, `create_decision_session_v1`, and `join_decision_session_v1` are `SECURITY DEFINER` RPCs with an empty search path and schema-qualified references. `PUBLIC`, `anon`, and `authenticated` cannot execute them; only `service_role` can. RLS remains enabled and direct client table access remains denied. RPC results and public bootstrap contracts exclude invitation hashes, participant hashes, and raw tokens. Server helpers and routes use `server-only` protection.

## Session HTTP adapters

`POST /api/v1/sessions` and `POST /api/v1/sessions/join` are server-only adapters. Create requires the strict contract, including a trimmed `hostDisplayName` of 1-60 characters; join accepts only its strict invitation and display-name contract. Both accept only `application/json` (a charset parameter is permitted), bound request bodies to 16 KiB before parsing, and return safe JSON errors without exception details.

Deployments must set the server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` without committing values. An explicit `VIBEVOTE_APP_ORIGIN` remains the sole origin authority when configured. On Vercel, an absent explicit origin falls back only to provider-owned system values: production accepts the project production URL and current deployment URL, while preview accepts only its current deployment or branch URL. Provider hosts must be valid `*.vercel.app` names; forwarded and request `Host` headers are never trusted. Cross-site `Origin` headers are rejected, a missing `Origin` is deliberately allowed for same-site navigation, and routes emit no broad CORS headers. Production and preview fail closed if neither the explicit origin nor a valid provider-owned origin is available. Development and test derive only their local request origin.

Create, join, and bootstrap remain subject to trusted-origin validation, bounded JSON parsing where applicable, safe errors, no broad CORS headers, and the shared rate-limit boundary.

## Durable session rate-limit boundary

`checkSessionRateLimit` applies before JSON parsing and database session operations. In deployed preview and production it accepts Vercel's deployment-controlled `x-forwarded-for` client address header, which Vercel overwrites unless a trusted proxy is explicitly enabled. It accepts one bounded, valid IPv4 or IPv6 address, canonicalizes equivalent forms, derives an HMAC-SHA-256 key scoped to the Vercel project, environment, and route policy, and calls `check_session_rate_limit_v1` through the server-only service-role client. The database function uses fixed-window database time plus an atomic upsert; the private backing table is RLS-protected, has no `anon` or `authenticated` access, and stores no raw address. Policies are create: 5, join: 10, and bootstrap: 60 attempts per 60 seconds.

`VIBEVOTE_RATE_LIMIT_KEY_SECRET` is an optional server-only override and, when set, must contain 32–512 characters. Without it, the server derives a domain-separated HMAC key from `SUPABASE_SERVICE_ROLE_KEY`; neither source secret nor the derived key is stored or sent to a client. `VIBEVOTE_RATE_LIMIT_TIMEOUT_MS` is optional and nonsecret, must be an integer from 100 to 10000 milliseconds, and defaults to 1000. Vercel system environment variables must be exposed so `VERCEL=1`, `VERCEL_ENV`, and `VERCEL_PROJECT_ID` are available at runtime. Missing or malformed deployment/provider configuration, a provider timeout/network error, or a malformed provider response maps to the existing safe 503 response; a saturated policy maps to safe 429. There is no in-memory or permissive deployed fallback. Development and test intentionally return allowed without contacting a provider so the isolated local stack remains usable.

Before enabling a preview or production deployment, apply the migrations in timestamp order to its Supabase project, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and expose Vercel system variables. Configure `VIBEVOTE_APP_ORIGIN` for a custom domain or when an explicit single-origin authority is preferred; configure `VIBEVOTE_RATE_LIMIT_KEY_SECRET` only when an independently rotated limiter key is required. Verify the final migration is present before enabling traffic, then verify create, join, and bootstrap against the deployed API: saturation must return 429, while an unavailable provider must return 503 without exposing provider details. Rotating either limiter key source intentionally starts fresh rate-limit windows. Rollback requires retaining the database RPC and table needed by any still-running deployment. During a provider incident, retain the fail-closed 503 behavior, investigate server-only configuration and Supabase availability, and do not introduce an in-memory bypass.
