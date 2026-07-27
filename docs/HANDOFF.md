# Current Project Handoff

## Released v1 milestone

PRs #7 through #25 are merged into `main`. The production room path is `room page -> RoomBootstrap -> typed session client -> LobbyScreen({ room, isHost })`; its production module graph has no path to `mockRoom` or mock-result modules.

Two people can create and join a custom room, become ready, start voting, submit complete private ballots, and receive the same immutable server-locked result. Invitations are host-controlled, hashed, one-active-at-a-time, and expire after 24 hours. Participant credentials remain HttpOnly cookies and never enter browser state, logs, room projections, realtime-shaped recovery data, or PWA caches.

## Decision and constraint policy

Hosts can set an option’s eligibility in `DRAFT` or `LOBBY`; guests cannot change it and at least one option stays eligible. Each ballot permits one veto. Instant Match requires universal Love/Fine acceptance, Best Fit ranks aggregate scores, and Chaos chooses among eligible group-accepted options. A private per-session seed resolves equal candidates without being returned to a client. Finalization is host-only, idempotent, locked, and immutable.

## Recovery and PWA

Authenticated bootstrap refreshes on reconnect, visibility, and a visible-tab interval while preserving a last safe room view after a background failure. The PWA provides standalone metadata, icons, and an offline shell. Its worker bypasses `/api/*`; authenticated rooms, invitations, ballots, credentials, and results are never cached.

## Verification and deployment caveats

Before release, run fresh `supabase db reset --local`, every focused SQL authorization/policy fixture through `psql`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and local `pnpm test:e2e` with isolated Supabase on ports `55320-55329`. The server requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, durable rate-limit configuration, and a trusted `VIBEVOTE_APP_ORIGIN`; none may be public. Local E2E must use isolated credentials only.

## Deferred product scope

Accounts, discovery, history, groups, payments, provider integrations, AI recommendations, native clients, retention, and monetization are not part of the validated first-session product. Push realtime is optional; authenticated recovery remains the source-of-truth refresh mechanism.
