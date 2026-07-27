# Current Project Handoff

## Merged baseline

PR #7 (session API integration and authenticated bootstrap), PR #8 (durable public-session rate limiting), PR #9 (client-safe collaboration contracts), PR #10 (invitation/readiness operations), PR #11 (expiry timestamp normalization), PR #12 (trusted public invitation origin), PR #13 (invitation/readiness UI), PR #14 (start-voting UI), PR #15 (private ballots and result finalization), and PR #16 (safe finalized-result projection) are merged into `main`. The production room entry remains `room page -> RoomBootstrap -> typed session client -> LobbyScreen({ room, isHost })`; production room code has no import path to `mockRoom` or mock-result modules.

## Merged Platform batch

Branch: `platform/invitations-readiness-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-27\vibevote-platform-invitations-readiness`

This additive batch adds service-role-only server operations and HTTP routes for host-only invitation replacement/revocation, self-only lobby readiness updates, and a guarded `LOBBY -> VOTING` transition. Invitation tokens and participant credentials are generated and hashed server-side; hashes and credentials are excluded from returned JSON, logs, room projections, and the browser cookie remains HttpOnly.

Policy enforced by the migration: one active invitation at a time; a replacement revokes the predecessor under a session-row lock; invitations expire after 24 hours; invitation creation/revocation and joining are allowed only in `DRAFT` or `LOBBY`; readiness changes are allowed only in `LOBBY`; and start requires the host, at least two current participants, and every participant `READY`. Private ballots, voting progress, result selection, realtime, and PWA work are untouched.

## Current Experience batch

Branch: `experience/voting-results-ui-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-27\vibevote-experience-voting-results`

The authenticated room now presents a complete private ballot during `VOTING`, sends the typed same-origin ballot request, and shows aggregate progress only. The host can finalize through the server-only authority; the locked winner is then available to both host and guests through authenticated bootstrap after refresh. The historical `/room/[sessionId]/result` route now uses the same `RoomBootstrap`, not a mock result screen. Browser state still never receives participant credentials, raw ballots, token hashes, or private result-selection data.

## Verification

Completed before this batch: fresh `supabase db reset --local` replayed all migrations; the focused SQL authorization fixtures passed through `psql` (the bundled `supabase test db` runner cannot execute these assertion-style, transaction-only fixtures because it requires TAP output). Final Experience verification passed: `pnpm format:check`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (25 files passed, 1 skipped; 133 tests passed, 3 skipped); `pnpm build`; and `pnpm test:e2e` (2/2 passed, including isolated two-browser private ballots, aggregate-only progress, server finalization, and the same result after host/guest refresh). `git diff --check` and the focused production-room mock-boundary scan both passed.

The migration serializes invitation replacement, readiness, and start decisions by locking the session row. The focused SQL fixture covers unauthorized invitation/revocation, expired/revoked and late joins, invalid session states, self-only readiness, privileges, and atomic start behavior.

## Deployment/configuration caveats

Existing production/preview public APIs still fail closed unless their server-only Supabase and durable rate-limit configuration is present. This batch also requires the existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the server; neither may be made public. Local live E2E requires the isolated Supabase stack on ports `55320-55329`, plus `VIBEVOTE_APP_ORIGIN=http://127.0.0.1:3000`; it must not use production credentials. Apply migrations and complete local reset/RLS proof before deployment.

## Next dependency

PR #17 is merged. The active recovery batch adds automatic authenticated bootstrap refresh on reconnect, visibility, and a visible-tab interval; it preserves the last safe room state if a background refresh fails. It sends and receives only the existing safe room contract. The next dependency is push-based realtime synchronization with the same aggregate-only boundary, followed by PWA/offline support.
