# Data Model (future implementation)

No production tables are created in this foundation. The provisional public vocabulary is in `@vibevote/contracts`: category, mode, session status, participant, option, session, public room state, and result summary.

Future persistence will separate public room state from private ballots and credentials. Invitation tokens are hashed where feasible; individual vote records are never included in public room responses or realtime payloads. Migration names follow `YYYYMMDDHHMMSS_short_snake_case.sql`; add rather than alter applied migrations and document forward repair.

Generate types after schema changes with `supabase gen types typescript --local > packages/contracts/src/database.generated.ts`; review the generated diff separately and do not hand-edit it.
