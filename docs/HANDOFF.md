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

Branch: `contract/session-v1`
Current task: Contract-only v1 schemas for creating, joining, and safely displaying decision rooms.
Completed: Strict Zod contracts and inferred types for session vocabulary, requests/responses, room visibility tiers, invitation responses, transition vocabulary, and stable API errors. Added typed mock fixtures and focused contract coverage.
Still needed: Shared approval of provisional readiness vocabulary, transition matrix, invitation-expiry policy, descriptions, and hard-constraint shape; then server persistence, authorization, and decision behavior in later batches.
Files touched: `packages/contracts/src/index.ts`, `packages/contracts/src/fixtures.ts`, `packages/contracts/src/index.test.ts`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/HANDOFF.md`.
Tests run: Focused Vitest contract suite (8 passed), `tsc --noEmit -p packages/contracts/tsconfig.json`, Prettier check for changed files, and `git diff --check` passed. No package lint script or package ESLint configuration exists, so no contract-scoped lint command applies.
Known issues: No server enforcement, database schema, authentication, vote storage, or realtime behavior is implemented by this contract-only batch.
Blocked by: None.

## Shared contracts changed

## Merge order

1. Merge this small shared-contract batch before platform services or Experience adapter integration.
2. Experience Lead consumes the typed public fixtures through one mock adapter.
3. Platform Lead follows with schema/RLS and server routes only after shared product decisions are resolved.

## Integration status

## Next milestone

Recommended next Platform Lead batch: approve unresolved v1 policy choices, then add additive local Supabase schema and RLS with negative authorization coverage against these contracts.
