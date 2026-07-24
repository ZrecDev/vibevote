# Current Project Handoff

## Current milestone

## Experience Lead

Branch:
Current task:
Completed:
Still needed:
Files touched:
Tests run:
Known issues:
Blocked by:

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

## Merge order

1. Merge this small shared-contract batch before platform services or Experience adapter integration.
2. Experience Lead consumes the typed public fixtures through one mock adapter.
3. Platform Lead follows with schema/RLS and server routes only after shared product decisions are resolved.

## Integration status

## Next milestone

Recommended next Platform Lead batch: approve unresolved v1 policy choices, then add additive local Supabase schema and RLS with negative authorization coverage against these contracts.
