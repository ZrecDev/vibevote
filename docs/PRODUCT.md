# VibeVote Product Blueprint

## Authority and status

This is the repository version of the supplied product blueprint. It is the product authority; `VibeVote` is an internal codename pending legal, domain, app-store, and social-handle clearance.

VibeVote is a mobile-first, category-independent group decision utility: create a room, share one link, vote privately, and receive a decision the group can live with. It is not a dating app, generic poll maker, social network, restaurant review app, calendar replacement, or AI recommendation chatbot.

## Product rules

- Guests join with an invitation link and a temporary display name; no account, download, phone number, or email is required for a first session.
- Decisions support `EAT`, `DO`, `WATCH`, and `CUSTOM`; the initial build prioritizes custom options.
- Sessions use `DRAFT`, `LOBBY`, `VOTING`, `TIEBREAK`, `DECIDED`, `COMPLETED`, `EXPIRED`, and `CANCELLED` states.
- A host supplies 2-12 options, chooses Instant Match, Best Fit, or Chaos Mode, and can set hard constraints.
- Private votes use Love, Fine, Pass, and a limited Veto. Individual votes, veto identities, access tokens, and private preferences are never revealed to other participants.
- Hard-constraint failures and validly vetoed options cannot win in normal modes. Deterministic ranking precedes seeded tie selection. Chaos Mode selects only from eligible, group-accepted options.
- The server alone validates transitions and finalizes results. Finalization is idempotent, concurrency-safe, immutable after completion, and stores a readable fairness receipt.
- Realtime may announce joined/left, ready status, aggregate finished counts, state changes, and the final aggregate result. The database remains the recoverable source of truth.

## First milestone

Two people can open VibeVote on separate devices, join the same custom decision room, vote privately, and receive the same server-locked result. This is verified by the isolated two-browser E2E flow. Authenticated recovery refreshes shared room state, and the app is installable with a privacy-safe offline shell.

## Scope sequence

1. Validate: Sites prototype, user testing, terminology.
2. Foundation: repository, static shell, contracts, local Supabase, checks.
3. Rooms: guest links, schema, session lifecycle, RLS.
4. Voting: private ballots, modes, finalization, explanation.
5. Realtime and recovery.
6. PWA/beta quality, then discovery, retention, and monetization only after the core flow is reliable.

## Deferred beyond the first milestone

Accounts, provider APIs, payments, AI recommendations, native applications, public social features, discovery, retention, and monetization are not part of the first milestone. Push-based realtime is optional; authenticated recovery remains the source-of-truth refresh path.

## Privacy and security baseline

Store guest tokens as hashes where possible, use expiring unguessable invitations and rate limits, keep providers and secrets server-side, enable/review RLS for every future user-facing table, permit optional location only, and plan export/deletion controls before retention features.
