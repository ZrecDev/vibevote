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

Branch: `platform/session-persistence-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-24\vibevote-platform-persistence`
Current task: Secure additive session-persistence and deny-by-default RLS foundation.
Completed: Supabase CLI 2.109.1; isolated VibeVote ports 55320-55329; normalized sessions, options, participants, and invitations migration with contract-aligned checks, token-hash-only storage, cascading dependencies, one-host constraint, option-order uniqueness, and deny-by-default RLS.
Still needed: Local Supabase reset, generated database types, live negative RLS tests, and future server-owned create/join operations.
Files touched: `supabase/migrations/20260724172000_create_session_persistence_foundation.sql`, `supabase/tests/20260724_session_persistence_foundation.sql`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/HANDOFF.md`.
Tests run: Pending final checks; Supabase CLI is unavailable and Docker Desktop is not running.
Tests run: Clean `supabase db reset` and SQL fixture passed; anon and authenticated were each denied SELECT/INSERT/UPDATE/DELETE on sessions, options, participants, and invitations; CLI-generated `packages/contracts/src/database.generated.ts` was safely UTF-8 recovered through Node spawnSync with validation and atomic replacement; targeted Prettier passed; lint passed; typecheck passed; unit tests 10/10; build passed; E2E 1/1; `git diff --check` passed.
Known issues: Windows repository-wide Prettier reports unrelated CRLF baseline noise. SQL/TOML have no configured Prettier parser; migration reset, SQL probes, configuration startup, and diff checks validate them. No APIs, frontend integration, ballots, transitions, or realtime are implemented.
Blocked by: None for this persistence batch. Remaining work is server-owned create/join authorization, atomic 2-12 option validation, token verification, rate limits, and transition enforcement.

## Shared contracts changed

## Merge order

1. Merge this small shared-contract batch before platform services or Experience adapter integration.
2. Experience Lead consumes the typed public fixtures through one mock adapter.
3. Platform Lead follows with schema/RLS and server routes only after shared product decisions are resolved.

## Integration status

## Next milestone

Recommended next Platform Lead batch: approve unresolved v1 policy choices, then add additive local Supabase schema and RLS with negative authorization coverage against these contracts.
