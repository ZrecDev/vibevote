# Shared Two-Person Plan

The supplied Shared Two-Person Build Plan is the collaboration authority. Preserve separate lanes, write acceptance criteria before work, and use a small merged contract PR before parallel implementations.

## Contract-first workflow

1. Write the feature outcome and acceptance criteria.
2. Define and approve Zod/TypeScript contracts.
3. Merge the small contract PR.
4. Experience Lead builds realistic mocks behind one adapter.
5. Platform Lead builds services, authorization, and data behavior against the same contracts.
6. Integrate the adapter, run a shared two-browser test, and update `HANDOFF.md`.

## Branches and merging

Never commit features directly to `main`; open focused draft PRs. Pull or rebase from `main` before final verification. Do not force-push another developer's work. Merge contracts first; backend behavior normally follows behind an unused route/flag; frontend, integration, and end-to-end cleanup follow. Pure visual work can merge first when independent.

## Daily rhythm

At start: read `HANDOFF.md`, pull `main`, confirm branch and owned files. At daily sync: report merges, blockers, shared-file changes, and review needs. At end: update the handoff with exact branch, files, tests, state, and next step.

## Definition of done

Acceptance criteria and focused tests pass; contracts match `main`; no unrelated edits; mobile is checked at 390px; tested flows have no console errors; server changes have authorization/negative coverage; docs and handoff are current; the PR states changed files, exact results, and risks.
