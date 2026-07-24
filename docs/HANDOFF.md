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

Branch: `contract/session-v1`
Current task: Contract-only v1 schemas for creating, joining, and safely displaying decision rooms.
Completed: Strict Zod contracts and inferred types for session vocabulary, requests/responses, room visibility tiers, invitation responses, transition vocabulary, and stable API errors. Added typed mock fixtures and focused contract coverage.
Still needed: Shared approval of provisional readiness vocabulary, transition matrix, invitation-expiry policy, descriptions, and hard-constraint shape; then server persistence, authorization, and decision behavior in later batches.
Files touched: `packages/contracts/src/index.ts`, `packages/contracts/src/fixtures.ts`, `packages/contracts/src/index.test.ts`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/HANDOFF.md`.
Tests run: Focused Vitest contract suite (8 passed), `tsc --noEmit -p packages/contracts/tsconfig.json`, Prettier check for changed files, and `git diff --check` passed. No package lint script or package ESLint configuration exists, so no contract-scoped lint command applies.
Known issues: No server enforcement, database schema, authentication, vote storage, or realtime behavior is implemented by this contract-only batch.
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
