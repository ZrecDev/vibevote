# Current Project Handoff

## Current milestone

Foundation — first polished mock-only mobile room experience.

## Experience Lead

Branch: `experience/session-api-integration-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-24\vibevote-experience-session-api`

Current task: Public session API integration.

Completed: Added the typed public client adapter at `apps/web/features/session/session-client.ts`. Create validates and submits the public create contract with field-associated errors and two-to-twelve deterministic options; join safely reads `?invite=` and submits the public join contract; and the room route bootstraps authenticated host or guest state through the HttpOnly cookie. Retry makes a fresh request and route changes cannot retain stale HOST controls. Production create, join, and bootstrap routes no longer use the mock room as their source of truth.

Still needed: invitation sharing from a later safe host response, readiness, voting, realtime, decision calculation, and results.

Files touched: create, join, and room routes; session adapter and adapter tests; create, join, and room-bootstrap tests; the two-context browser-flow test; room screen; and this Experience handoff section.

Verification: adapter tests passed (1 file, 11 tests); create-page tests passed (1 file, 4 tests); join-page tests passed (1 file, 3 tests); room-bootstrap tests passed (1 file, 3 tests); existing Experience tests passed (3 files, 9 tests); Platform route tests passed (3 files, 26 tests); live local server-operation integration passed (1 file, 1 test); full unit suite passed (20 files, 99 tests; 1 intentionally skipped live test without local environment); `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all passed. `pnpm test:e2e` passed (2 tests): at 390×844, isolated host and guest contexts created, joined, bootstrapped, and reloaded a real local room; host controls rendered only for HOST. Create/join/room states have accessible names, field-associated validation errors, alert announcements, disabled pending buttons, and keyboard-operable retry. Local VibeVote Supabase was verified at ports 55320–55329. Client and build-output scans found no server imports, cookie access, browser credential storage, `participantAccessToken`, token hashes, service-role key, or session-flow mock fallback; `git diff --check` passed. Production and Vercel-preview session API calls intentionally fail closed until a durable serverless-compatible rate-limit provider is implemented; local real create, join, and bootstrap are the integration proof for this batch.

Known issues: Invitation copy, room creation, voting, share plan, directions, readiness, and reconnection UI are intentionally local presentation only; QR is a styled placeholder, not an encoded link. The mock `finishedParticipantCount` is fixed and no polling/realtime happens.

Mock assumptions: The existing public-room contract is sufficient for room rendering. Individual ballots are never represented in public room data; the local ballot state exists only within the browser component. The result explanation is mock aggregate copy and is not a client-side decision algorithm.

Platform dependencies: Platform-owned invitation/session lifecycle, authorization, private ballot submission, aggregate progress feed, final result/reason receipt, and retry/reconnect semantics.

Requested contract changes: None.

## Platform Lead

Branch: `platform/session-bootstrap-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-24\vibevote-platform-session-bootstrap`
Current task: Unified host/guest participant credentials and cookie-authenticated session bootstrap.
Completed: Migration `20260724231422_add_participant_session_credentials_v1.sql`; reviewed RPCs `create_decision_session_v1`, `join_decision_session_v1`, and `get_participant_session_v1`; server operations `createSession`, `joinSession`, and `bootstrapSession`; `GET /api/v1/sessions/{sessionId}`; strict host/guest bootstrap contract; and scoped `vibevote_participant_v1` cookies at `/api/v1/sessions/{sessionId}`. New host and guest hashes are stored without exposing raw credentials.
Files touched: approved Platform migration, contracts, server operations, server-only web routes/helpers, focused tests, and Platform documentation only.
Tests run: focused contracts/server/token/cookie/route tests: 56 passed across 9 files; clean local Supabase reset and all 3 SQL fixtures passed; generated database types validated and `pnpm typecheck` passed; live create/join/host-bootstrap/guest-bootstrap/cross-session rejection integration passed; `pnpm lint` passed; `pnpm test` passed (71 tests, 1 environment-gated integration skip); production build passed; E2E passed (1); targeted Prettier and `git diff --check` passed; client, secret, and build credential scans passed. Publication remains pending.
Known issues: A durable serverless-compatible rate-limit provider remains required before public production traffic; the current production/preview boundary intentionally fails closed.
Still needed: Experience create UI must send `hostDisplayName`; create/join establish the HttpOnly cookie; client JavaScript must not read/store credentials; room reload must call bootstrap and render host or guest state. Begin that UI integration only after this Platform batch merges. A durable serverless-compatible production rate limiter is also still required.
Blocked by: None.

## Shared contracts changed

Session-v1 contracts merged from `contract/session-v1`: room visibility tiers, create/join/invitation request and response schemas, transition vocabulary, stable API errors, and typed fixtures. Experience must align its mock adapter before integration work.

## Merge order

1. Merge this small shared-contract batch before platform services or Experience adapter integration.
2. Experience room shell consumes the typed public fixtures through one mock adapter, then integrates session reads, ballot writes, invitations, aggregate progress, and results when platform services are available.
3. Platform Lead follows with schema/RLS and server routes only after shared product decisions are resolved.

## Integration status

Mock-only frontend; no backend, persistence, API, authentication, realtime, or decision-engine integration.

## Next milestone

Approve unresolved v1 policy choices, then add platform session/invitation and private ballot workflow with additive local Supabase schema and RLS. After that, the Experience Lead aligns the mock adapter to the finalized contracts and runs two-browser validation.
