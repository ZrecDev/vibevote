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

Branch: `platform/session-http-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-24\vibevote-platform-session-http`
Current task: Secure HTTP adapters for server-owned session create and join operations.
Completed: `POST /api/v1/sessions` and `POST /api/v1/sessions/join`, strict JSON and 16 KiB parsing, trusted `VIBEVOTE_APP_ORIGIN`, same-origin CSRF policy without broad CORS, trusted invitation URLs, fail-closed production/preview rate-limit boundary, and the scoped HttpOnly guest cookie. Create requires `hostDisplayName`; the raw guest credential is never serialized.
Files touched: web server-only adapter/helpers and focused tests, approved contract/server configuration changes, lockfile, and Platform documentation.
Tests run: Focused adapter/helper/security tests and the complete repository/database/publication verification gate are required before publication; record final results with the PR.
Known issues: A durable serverless-compatible rate-limit provider remains required before public production traffic; the current production/preview boundary intentionally fails closed.
Still needed: Frontend integration, session bootstrap using the cookie, realtime, ballots, voting, and results.
Blocked by: None.

## Shared contracts changed

## Merge order

1. Merge this small shared-contract batch before platform services or Experience adapter integration.
2. Experience Lead consumes the typed public fixtures through one mock adapter.
3. Platform Lead follows with schema/RLS and server routes only after shared product decisions are resolved.

## Integration status

## Next milestone

Recommended next Platform Lead batch: approve unresolved v1 policy choices, then add additive local Supabase schema and RLS with negative authorization coverage against these contracts.
