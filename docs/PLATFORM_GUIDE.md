# Platform Lead Guide

Own the source of truth: `packages/contracts`, `packages/decision-engine`, `packages/server`, `supabase`, CI, environment validation, data/security/engine documentation, and server API surfaces. Do not redesign user-facing components or styles while implementing platform work.

Server behavior must validate state transitions; clients never calculate or submit winners. Enforce one vote per participant/option, atomic veto limits, idempotent concurrency-safe finalization, immutable replayable results, unguessable expiring guest links, RLS on all user-facing tables, and server-only provider keys. Realtime is an enhancement and never broadcasts individual votes.

Migration rules: one author at a time; never edit applied migrations; prefer additive changes; document forward repair; add deliberate indexes; use non-sensitive seed data; review RLS in the same PR; run local reset/migration checks before merge.
