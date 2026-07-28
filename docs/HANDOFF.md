# Current Project Handoff

## Released v1 milestone

PRs #7 through #26 are merged into `main`. The production room path remains
`room page -> RoomBootstrap -> typed session client -> LobbyScreen({ room, isHost })`; a focused
static scan and its regression test both confirm that this module graph has no path to `mockRoom`
or mock-result modules.

Two people can create and join a custom room, become ready, start voting, submit complete private
ballots, and receive the same immutable server-locked result. Invitations are host-controlled,
hashed, one-active-at-a-time, and expire after 24 hours. Participant credentials remain HttpOnly
cookies and never enter browser state, logs, room projections, realtime-shaped recovery data, or
PWA caches.

## UI and production-recovery batch

Branch `codex/ui-overhaul-create-room-v1` modernizes the landing, create, join, lobby, ballot,
result, loading, error, and not-found experiences without changing the typed API contracts or
decision policy. The layout is mobile-first, safe-area aware, keyboard-height tolerant, and
explicitly tested for horizontal overflow at 320 px, 390 px, short landscape, and desktop widths.
Room recovery now treats refreshed server projections as the single source of truth instead of
leaving participant readiness, option eligibility, or result state stale in local component state.

The live create-room 503 had two deployment causes:

1. Vercel did not expose `VIBEVOTE_APP_ORIGIN`, so the server's trusted-origin check failed closed
   before any database operation.
2. The linked production Supabase project had none of the repository's migrations.

The 12 reviewed v1 migrations are now applied to the linked production Supabase project. The
server still honors an explicit `VIBEVOTE_APP_ORIGIN`, but on Vercel it can also trust only
provider-owned `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, and preview branch URL values.
Durable rate limiting remains fail-closed; when its dedicated HMAC secret is absent, it derives a
domain-separated server-only key from `SUPABASE_SERVICE_ROLE_KEY` rather than falling back to
process memory.

## Decision and constraint policy

Hosts can set an option's eligibility in `DRAFT` or `LOBBY`; guests cannot change it and at least
one option stays eligible. Each ballot permits one veto. Instant Match requires universal
Love/Fine acceptance, Best Fit ranks aggregate scores, and Chaos chooses among eligible
group-accepted options. A private per-session seed resolves equal candidates without being
returned to a client. Finalization is host-only, idempotent, locked, and immutable.

## Verification evidence

The UI and production-recovery batch passed:

- `pnpm format:check`, `pnpm lint`, and typechecking in all six workspace packages.
- 143 unit/integration tests passed, 3 explicitly skipped, across 28 files.
- Production Next.js build: 12 static pages generated and all dynamic API/room routes compiled.
- Fresh `supabase db reset --local`: all 12 migrations applied in order.
- SQL authorization/RLS fixtures: 10 of 10 passed transactionally.
- Playwright: 8 of 8 passed. This includes full independent host/guest
  create -> invite -> join -> ready -> start -> private ballot -> finalize -> shared result flows
  at 390x844 mobile and 1280x800 desktop viewports.
- The browser flows assert no horizontal overflow, no console or page errors, no browser-stored
  participant credential or invitation token, and no private ballot values in shared responses.
- Focused production mock scan: 0 matches.

## Deployment and configuration caveats

Production still requires server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; neither may
be exposed through `NEXT_PUBLIC_*`, browser state, responses, or logs. An explicit
`VIBEVOTE_APP_ORIGIN` and `VIBEVOTE_RATE_LIMIT_KEY_SECRET` remain supported and preferred for
non-Vercel deployments. The Vercel provider-origin fallback deliberately rejects arbitrary Host
and forwarded-host headers.

The current code batch must be deployed and the hosted create-to-result flow rerun before the 503
recovery is considered released. The next dependency after that release is an Experience-owned
realtime enhancement that consumes only authenticated room projections; it must not expose
ballots, credentials, invitation tokens, token hashes, or selection seeds.

## Deferred product scope

Accounts, discovery, history, groups, payments, provider integrations, AI recommendations, native
clients, retention, and monetization are not part of the validated first-session product. Push
realtime is optional; authenticated recovery remains the source-of-truth refresh mechanism.
