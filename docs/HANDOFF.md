# Current Project Handoff

## Current milestone

Foundation — first polished mock-only mobile room experience.

## Experience Lead

Branch: `experience/room-shell`

Current task: Polished mock room visual rebuild.

Completed: Rebuilt the mock room experience into a cohesive mobile-first visual system: warm light/dark themes, refreshed home/create flow, a stronger room lobby and invite/QR presentation, role/readiness participant cards, private ballot controls, aggregate-only progress, winner/backup reveal, and polished state surfaces. The session-v1 `role` and `readiness` model remains intact; no backend or decision logic was added.

Still needed: Hook the screens to platform-owned session, invitation, ballot, realtime, and finalization behavior once those contracts and services are available. Validate with user testing and approved visual direction.

Files touched: `apps/web/app/globals.css`, `apps/web/app/page.tsx`, `apps/web/app/create/page.tsx`, `apps/web/components/app-shell.tsx`, `apps/web/features/room/room-components.tsx`, `apps/web/features/room/room-screens.tsx`, `apps/web/features/room/room-components.test.tsx`, `docs/HANDOFF.md`.

Tests run: `pnpm --filter @vibevote/web lint` (passed); `pnpm --filter @vibevote/web typecheck` (passed); `pnpm exec vitest run apps/web/app/page.test.tsx apps/web/components/ui.test.tsx apps/web/features/room/room-components.test.tsx` (passed: 3 files, 9 tests); `pnpm --filter @vibevote/web build` (passed); `git diff --check` (passed); Chromium smoke at 390×844 (passed: lobby/invite, private ballot, keyboard Veto, aggregate-only progress, winner/backup, and no horizontal overflow).

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
