# VibeVote

VibeVote is a mobile-first group decision app: create a private room, invite the group, collect private ballots, and lock one fair result.

## Product status

The complete first-session flow is implemented:

- A host creates a room with 2–12 options and chooses Instant Match, Best Fit, or Chaos Pick.
- Guests join through one expiring, host-controlled invitation.
- Everyone confirms readiness before voting starts.
- Ballots remain private, each participant has one veto, and hard constraints stay host-controlled.
- The server finalizes one immutable result and every participant receives the same safe projection.
- Authenticated recovery and an app-shell-only PWA keep the experience resilient without caching private room data.

Accounts, discovery, saved history, groups, payments, provider integrations, and native clients remain future product scope.

## Architecture

- `apps/web`: Next.js App Router UI and same-origin HTTP routes.
- `packages/contracts`: strict Zod request, response, and room-state contracts.
- `packages/server`: server-only Supabase operations and safe projections.
- `packages/decision-engine`: deterministic decision rules.
- `supabase`: migrations plus focused authorization and policy fixtures.
- `tests/e2e`: responsive browser checks and the real two-participant session flow.
- `docs`: product, security, decision policy, and release handoff.

The production room module path is:

```text
room page → RoomBootstrap → typed session client → LobbyScreen({ room, isHost })
```

Production room code does not import mock rooms or mock results.

## Local setup

Prerequisites: Node 22+, pnpm 10+, Docker Desktop, and the Supabase CLI.

```bash
pnpm install
pnpm exec supabase start
pnpm exec supabase db reset --local
pnpm dev
```

The server needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never expose server credentials through a `NEXT_PUBLIC_*` variable. See `docs/SECURITY.md` for production configuration and trusted-origin behavior.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm verify` runs the complete repository gate. The live session E2E uses the isolated local Supabase stack on ports `55320–55329`; generic CI skips only that database-backed test unless `VIBEVOTE_RUN_LIVE_SESSION_E2E=1`.

## Workflow

Read `docs/HANDOFF.md` before starting a batch. Use one focused branch and pull request per outcome, preserve shared-contract and ownership boundaries, and keep server secrets out of commits, browser state, logs, and test artifacts.
