# Data Model (future implementation)

No production tables are created in this foundation. The provisional public vocabulary is in `@vibevote/contracts`: category, mode, session status, participant, option, session, public room state, and result summary.

Future persistence will separate public room state from private ballots and credentials. Invitation tokens are hashed where feasible; individual vote records are never included in public room responses or realtime payloads. Migration names follow `YYYYMMDDHHMMSS_short_snake_case.sql`; add rather than alter applied migrations and document forward repair.

Generate types after schema changes with `supabase gen types typescript --local > packages/contracts/src/database.generated.ts`; review the generated diff separately and do not hand-edit it.

## Contract-only v1 session vocabulary

`@vibevote/contracts` is the runtime authority for the first shared room shapes. A session has an ID, title, category (`EAT`, `DO`, `WATCH`, or `CUSTOM`), mode, closed status, and 2-12 ordered decision options. The create request accepts only title, category, mode, and option labels; descriptions and hard-constraint configuration are intentionally absent because their v1 shapes are not yet defined.

Participants have an ID, temporary display name, role (`HOST` or `GUEST`), and readiness (`WAITING` or `READY`). A public room carries the safe session, participant list, aggregate finished count, and an optional aggregate result summary. It never carries individual ballots or identities attached to votes.

## Visibility boundaries

| Boundary            | Included                                                                                | Excluded                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Public room         | Session, display names, roles, readiness, aggregate completion count, safe final result | Ballots, veto identities, guest tokens, token hashes, preferences, RNG seed, debugging data |
| Participant room    | Public room plus the current participant ID                                             | Any other participant's private ballot or preference                                        |
| Host room           | Participant room plus non-authoritative UI capability hints                             | Token hashes, ballots, RNG seed, server permission state                                    |
| Server-only session | Internal invitation-token hash and RNG seed alongside session data                      | Any client, realtime, fixture, or safe API response                                         |

## Provisional choices and open questions

- `WAITING` and `READY` replace the former boolean ready vocabulary; shared approval is needed before persistence.
- The contract records transition vocabulary but does not declare a transition matrix. The server will own validation and enforcement.
- Invitation expiry is nullable in the client-safe response pending product policy for default lifetime.
- The invite response may expose a shareable URL/token representation to its intended host client, but never its stored hash.
