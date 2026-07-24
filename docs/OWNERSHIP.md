# Ownership

## Experience Lead

Primary: `apps/web/app/`, `apps/web/components/`, `apps/web/features/`, `apps/web/styles/`, `packages/ui/`, Sites prototypes, and frontend design documentation.

## Platform Lead

Primary: `packages/contracts/`, `packages/decision-engine/`, `packages/server/`, `packages/config/`, `supabase/`, `.github/workflows/`, and environment validation.

## Shared approval required

Shared contracts, product behavior, voting rules, monetization, major architecture decisions, and every cross-boundary change.

| Common conflict                       | Single owner | Rule                                                  |
| ------------------------------------- | ------------ | ----------------------------------------------------- |
| Root `package.json`, `pnpm-lock.yaml` | Platform     | Isolate dependency changes in a small PR.             |
| TypeScript and ESLint configuration   | Platform     | Experience requests required config changes.          |
| Environment schema                    | Platform     | Server-only classification is reviewed with Security. |
| Tailwind/theme tokens                 | Experience   | Require visual verification.                          |
| GitHub Actions                        | Platform     | Keep CI changes isolated.                             |
| Database migrations                   | Platform     | One migration author at a time.                       |
| `PRODUCT.md` and UX specs             | Experience   | Platform reviews user-facing implications.            |
| Data/security/engine docs             | Platform     | Experience reviews user-facing implications.          |
