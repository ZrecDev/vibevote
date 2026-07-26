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

CI E2E note: Local `pnpm test:e2e` runs both browser tests against the isolated VibeVote Supabase stack. Generic GitHub CI intentionally skips the live local-Supabase host/guest test because it does not provision that stack; a prepared CI environment can opt in with `VIBEVOTE_RUN_LIVE_SESSION_E2E=1`. Production and preview session API behavior remains intentionally fail-closed.

Known issues: Invitation copy, room creation, voting, share plan, directions, readiness, and reconnection UI are intentionally local presentation only; QR is a styled placeholder, not an encoded link. The mock `finishedParticipantCount` is fixed and no polling/realtime happens.

Mock assumptions: The existing public-room contract is sufficient for room rendering. Individual ballots are never represented in public room data; the local ballot state exists only within the browser component. The result explanation is mock aggregate copy and is not a client-side decision algorithm.

Platform dependencies: Platform-owned invitation/session lifecycle, authorization, private ballot submission, aggregate progress feed, final result/reason receipt, and retry/reconnect semantics.

Requested contract changes: None.

## Platform Lead

Branch: `platform/durable-rate-limit-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-25\vibevote-platform-rate-limit`
Current task: Durable serverless-compatible rate limiting for public session APIs.
Completed: Migration `20260725235152_add_session_rate_limit_v1.sql` adds the RLS-protected private fixed-window store and `check_session_rate_limit_v1` service-role RPC; migration `20260725235855_fix_session_rate_limit_v1_function.sql` provides its forward function repair. The server-only limiter hashes a Vercel-owned client-address header, separates preview from production, calls the atomic Supabase RPC with a bounded timeout, and fails closed for absent or malformed deployment/provider configuration. Create, join, and bootstrap use distinct policies: 5, 10, and 60 attempts per 60-second fixed window respectively. Development and test remain provider-free for isolated local work.
Files touched: approved Platform migrations, generated database contract, server-only rate-limit helper, public session routes, focused unit/integration tests, and Platform documentation only.
Tests run: focused limiter, security, and route tests passed (49 tests across 6 files); isolated Supabase atomic concurrency and route recovery integration passed (2 tests); clean isolated VibeVote Supabase reset replayed both migrations and the SQL fixture passed; `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, full `pnpm test` (23 files, 118 tests), and `pnpm build` passed. Local `pnpm test:e2e` passed (2 tests, including real host/guest create, join, and bootstrap); simulated generic CI passed the ordinary E2E and skipped the isolated live-Supabase flow. Client, secret, and build-output scans found no credential leakage, and `git diff --check` passed. Review follow-up constrained live integration tests to the isolated local API origin (12 focused tests), added deployment configuration guidance, and passed format, lint, typecheck, and diff-check. Draft PR #8 is published; its GitHub Actions verify and Vercel checks are green.
Known issues: Production and preview now require the existing server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, Vercel deployment identity, and optional valid `VIBEVOTE_RATE_LIMIT_TIMEOUT_MS` (100-10000 ms, default 1000). Missing or failing provider configuration intentionally returns the existing safe 503 response. No in-memory fallback exists.
Still needed: Complete the full local gate, publish this isolated Platform batch, then continue only with separately authorized readiness, voting, realtime, decision calculation, and results work.
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
