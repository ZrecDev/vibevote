# Current Project Handoff

## Merged baseline

PR #7 (session API integration and authenticated bootstrap), PR #8 (durable public-session rate limiting), and PR #9 (client-safe collaboration contracts) are merged into `main`. The production room entry remains `room page -> RoomBootstrap -> typed session client -> LobbyScreen({ room, isHost })`; the production room entry path has no import of `mockRoom` or mock-result modules.

## Current Platform batch

Branch: `platform/invitations-readiness-v1`
Worktree: `C:\Users\zrowe\Documents\Codex\2026-07-27\vibevote-platform-invitations-readiness`

This additive batch adds service-role-only server operations and HTTP routes for host-only invitation replacement/revocation, self-only lobby readiness updates, and a guarded `LOBBY -> VOTING` transition. Invitation tokens and participant credentials are generated and hashed server-side; hashes and credentials are excluded from returned JSON, logs, room projections, and the browser cookie remains HttpOnly.

Policy enforced by the migration: one active invitation at a time; a replacement revokes the predecessor under a session-row lock; invitations expire after 24 hours; invitation creation/revocation and joining are allowed only in `DRAFT` or `LOBBY`; readiness changes are allowed only in `LOBBY`; and start requires the host, at least two current participants, and every participant `READY`. Private ballots, voting progress, result selection, realtime, and PWA work are untouched.

## Verification

Completed locally: fresh `supabase db reset --local --no-seed` replayed all migrations; the focused SQL authorization fixture passed through `psql` (the bundled `supabase test db` runner cannot execute this assertion-style, transaction-only fixture because it requires TAP output); `pnpm format:check`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (23 files: 125 tests passed, 3 skipped); `pnpm build`; `pnpm test:e2e` (2 passed, including isolated host/guest local-Supabase flow); `git diff --check`; and the focused source-path scan of the production room entry, `RoomBootstrap`, and typed session client (no mock imports).

The migration serializes invitation replacement, readiness, and start decisions by locking the session row. The focused SQL fixture covers unauthorized invitation/revocation, expired/revoked and late joins, invalid session states, self-only readiness, privileges, and atomic start behavior.

## Deployment/configuration caveats

Existing production/preview public APIs still fail closed unless their server-only Supabase and durable rate-limit configuration is present. This batch also requires the existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the server; neither may be made public. Apply migrations and complete local reset/RLS proof before a deployment.

## Next dependency

Open this batch as a draft PR after a final clean status review. The recommended next Experience integration batch is host invitation sharing and participant lobby-readiness UI using these typed endpoints; it should not include ballots, realtime, results, or PWA work.
