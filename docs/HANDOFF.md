# Current Project Handoff

## Current milestone

Foundation — first polished mock-only mobile room experience.

## Experience Lead

Branch: `experience/room-shell`

Current task: First room UX batch.

Completed: Implemented a componentized, mobile-first mock flow for creating a decision, lobby/invites, participant readiness, private ballots, aggregate-only progress, decision result, backup option, and share/next-action placeholders. Added loading, empty, disconnected/reconnecting, and error-state components. Added light/dark themes, reduced-motion handling, visible controls, responsive styling, and focused component coverage.

Still needed: Hook the screens to platform-owned session, invitation, ballot, realtime, and finalization behavior once those contracts and services are available. Validate with user testing and approved visual direction.

Files touched: `apps/web/app/globals.css`, `apps/web/app/page.tsx`, `apps/web/app/create/page.tsx`, `apps/web/app/loading.tsx`, `apps/web/app/error.tsx`, `apps/web/app/room/[sessionId]/page.tsx`, `apps/web/app/room/[sessionId]/vote/page.tsx`, `apps/web/app/room/[sessionId]/result/page.tsx`, `apps/web/components/app-shell.tsx`, `apps/web/components/ui.tsx`, `apps/web/features/room/mock-room.ts`, `apps/web/features/room/room-components.tsx`, `apps/web/features/room/room-screens.tsx`, `apps/web/features/room/room-components.test.tsx`, `docs/HANDOFF.md`.

Tests run: `pnpm --filter @vibevote/web lint` (passed); `pnpm --filter @vibevote/web typecheck` (passed); `pnpm exec vitest run apps/web/app/page.test.tsx apps/web/components/ui.test.tsx apps/web/features/room/room-components.test.tsx` (passed: 3 files, 9 tests); `pnpm --filter @vibevote/web build` (passed).

Known issues: Invitation copy, room creation, voting, share plan, directions, readiness, and reconnection UI are intentionally local presentation only; QR is a styled placeholder, not an encoded link. The mock `finishedParticipantCount` is fixed and no polling/realtime happens.

Mock assumptions: The existing public-room contract is sufficient for room rendering. Individual ballots are never represented in public room data; the local ballot state exists only within the browser component. The result explanation is mock aggregate copy and is not a client-side decision algorithm.

Platform dependencies: Platform-owned invitation/session lifecycle, authorization, private ballot submission, aggregate progress feed, final result/reason receipt, and retry/reconnect semantics.

Requested contract changes: None.

## Platform Lead

Branch:
Current task:
Completed:
Still needed:
Files touched:
Tests run:
Known issues:
Blocked by:

## Shared contracts changed

None. Experience uses the current `PublicRoomState`, `ResultSummary`, and vote vocabulary unchanged.

## Merge order

Experience room shell can be reviewed independently. Integrate an adapter after platform contracts/services for session reads, ballot writes, invitations, aggregate progress, and results are available.

## Integration status

Mock-only frontend; no backend, persistence, API, authentication, realtime, or decision-engine integration.

## Next milestone

Platform session/invitation and private ballot workflow, followed by an Experience adapter integration pass and two-browser validation.
