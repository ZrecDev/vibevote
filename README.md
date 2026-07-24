# VibeVote (codename)

VibeVote is a mobile-first group decision utility: one room, private votes, and one fair result. It is an internal codename, not cleared final branding.

## Status

This is a production-ready repository foundation, not the product. It includes a static accessible shell, provisional shared contracts, local Supabase layout, tests, CI, and two-developer working rules. It does not yet create rooms, authenticate people, store votes, calculate results, or use realtime.

## Architecture

- `apps/web`: Next.js App Router application, owned by the Experience Lead.
- `packages/contracts`: Zod schemas and inferred types, Platform-owned with shared approval.
- `packages/decision-engine` and `packages/server`: platform interfaces/placeholders.
- `packages/ui`: reusable presentation primitives.
- `supabase`: local configuration, future migrations/functions/seeds.
- `docs`: product authority, operating model, ADRs, and handoff.

## Prerequisites

Node 22+, pnpm 10+, and Docker Desktop plus the Supabase CLI for later local database work. The current foundation does not require a remote Supabase project.

## Local setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Use placeholder values locally until a reviewed local Supabase workflow is introduced. Never put service-role, Places, Stripe, monitoring-auth, or other server secrets in `NEXT_PUBLIC_*` variables.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm verify
```

`verify` runs format checking, lint, type checking, unit/component tests, production build, and the Playwright mobile smoke test.

## Two-person workflow

Read `docs/HANDOFF.md` before work. Keep one focused branch/PR per outcome, do not edit another lane without coordination, and merge an approved shared-contract PR before parallel backend/frontend work. Recommended naming: `experience/<task>`, `platform/<task>`, `contract/<task>`, `integration/<task>`, and `docs/<task>`.

The Experience Lead owns the UX/UI, Sites validation, and frontend. The Platform Lead owns contracts, data, security, server behavior, decision engine, environment validation, and CI. See `docs/OWNERSHIP.md` and `docs/SHARED_PLAN.md`.

## Sites workflow

Use Sites for prototype, mobile UX, user testing, visual direction, and landing-page experiments. Translate approved designs into `apps/web` and `packages/ui`; never make Sites the source of truth for security, persistence, voting, payments, or production server behavior. See `docs/SITES_WORKFLOW.md`.

## First milestone

> Two people open VibeVote on separate devices, join the same custom decision room, vote privately, and receive the same server-locked result.

This setup task does not complete that milestone. The next implementation batches should be a shared `contract/session-v1` PR, then `experience/room-shell` and `platform/session-lifecycle`.
