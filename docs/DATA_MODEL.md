# Data Model (v1 implementation)

The v1 public vocabulary is in `@vibevote/contracts`: category, mode, session status, participant, option, session, public room state, aggregate voting progress, and result summary.

Persistence separates public room state from private ballots and credentials. Invitation tokens are hashed; individual vote records are never included in public room responses, recovery payloads, logs, or PWA caches. Migration names follow `YYYYMMDDHHMMSS_short_snake_case.sql`; add rather than alter applied migrations and document forward repair.

Generate types after schema changes with `supabase gen types typescript --local > packages/contracts/src/database.generated.ts`; review the generated diff separately and do not hand-edit it.

## Contract-only v1 session vocabulary

`@vibevote/contracts` is the runtime authority for the first shared room shapes. A session has an ID, title, category (`EAT`, `DO`, `WATCH`, or `CUSTOM`), mode, closed status, and 2-12 ordered decision options. The create request accepts only title, category, mode, and option labels; descriptions and hard-constraint configuration are intentionally absent because their v1 shapes are not yet defined.

Participants have an ID, temporary display name, role (`HOST` or `GUEST`), and readiness (`WAITING` or `READY`). A public room carries the safe session, participant list, aggregate finished count, and an optional aggregate result summary. It never carries individual ballots or identities attached to votes.

## Visibility boundaries

| Boundary            | Included                                                                                | Excluded                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Public room         | Session, display names, roles, readiness, aggregate completion count, safe final result | Ballots, veto identities, participant tokens, token hashes, preferences, RNG seed, debugging data |
| Participant room    | Public room plus the current participant ID                                             | Any other participant's private ballot or preference                                              |
| Host room           | Participant room plus non-authoritative UI capability hints                             | Token hashes, ballots, RNG seed, server permission state                                          |
| Server-only session | Internal invitation-token hash and RNG seed alongside session data                      | Any client, realtime, fixture, or safe API response                                               |

## v1 policy

- `WAITING` and `READY` replace the former boolean ready vocabulary.
- The server owns transition validation and enforcement.
- Active invitations expire 24 hours after creation and may be replaced only by the host in `DRAFT` or `LOBBY`.
- The invite response may expose a shareable URL/token representation to its intended host client, but never its stored hash.

## Contract-only collaboration workflow vocabulary

The shared collaboration contract defines client-safe shapes for a host-created share invitation, a participant readiness update, a complete private ballot submission, aggregate-only voting progress, and a final result receipt. An invitation sharing response may expose its raw URL to the host but never a token hash. A ballot request is participant-to-server input only and contains one value per option; it is never part of room state, a result receipt, fixtures intended for public state, or realtime payloads. Progress contains only total and finished participant counts, never identities attached to completion. The result receipt is client-safe and readable; the server and database, not the contract, enforce its immutability.

Invitation expiry, revocation, readiness quorum, late-join rejection, ballot replacement during `VOTING`, and finalization are enforced by service-role-only RPCs. The existing v1 decision method excludes vetoed options and uses aggregate private preferences; individual ballot records never leave the database.

## Session persistence foundation

Migration `20260724172000_create_session_persistence_foundation.sql` adds `decision_sessions`, `decision_options`, `session_participants`, and `session_invitations`. It uses the contract vocabulary for category, mode, status, role, and readiness. Options have a per-session unique stable position; a server create transaction must call `assert_session_option_count` to enforce the 2-12 total before a room is usable. SQL enforces field domains, foreign keys, cascading session deletion, one host per session, and non-empty credential hashes. Descriptions and hard constraints remain deliberately omitted. Invitation expiry is nullable and has no default lifetime.

## Secure session operations

Migration `20260724190000_add_session_operations_v1.sql` adds `create_decision_session_v1` and `join_decision_session_v1`. Create validates the request at the database boundary, then atomically inserts the session, exactly one host, ordered two-to-twelve options, and an invitation-token hash before asserting the option count. Join atomically resolves a non-revoked, non-expired invitation and inserts one guest with only a guest-access-token hash. Any failure rolls back the complete RPC transaction; no partial session, option, invitation, or participant is retained.

Raw invitation material is delivered once through the safe `inviteUrl` response and is never persisted. RPC results include safe room data and identifiers, never invitation or participant hashes. Revoked, expired, and missing invitations share a safe failure path. Authenticated UI, aggregate-only ballot progress, immutable result persistence, recovery refresh, and a PWA shell are shipped.

## Unified participant credentials

Migration `20260724231422_add_participant_session_credentials_v1.sql` generalizes `guest_access_token_hash` to `participant_access_token_hash`. Existing guest hashes retain their exact stored value. Existing legacy hosts may have no credential and therefore cannot authenticate through bootstrap; the migration does not invent raw tokens for them. New hosts and guests always receive a SHA-256 participant hash from their respective RPCs. Raw credentials are never database fields.

Non-null participant hashes are protected by a partial unique index, while legacy null values remain permitted. The session-scoped cookie is transport state only, not database state.

## HTTP credential lifecycle

The HTTP create adapter builds the one-time invitation URL only from trusted `VIBEVOTE_APP_ORIGIN`. Create and join place their server-internal raw participant token in the scoped `vibevote_participant_v1` HttpOnly session cookie and return only safe public room responses. `GET /api/v1/sessions/{sessionId}` authenticates with that cookie and returns either safe host or guest bootstrap state. Typed same-origin adapters support invitation replacement, readiness, voting start, private ballot submission, and finalization. The client uses this safe bootstrap response for recovery without storing credentials in browser state.

## Durable session rate limiting

Migrations `20260725235152_add_session_rate_limit_v1.sql`, `20260725235855_fix_session_rate_limit_v1_function.sql`, and `20260726120000_scope_session_rate_limit_namespaces.sql` add `private.session_rate_limit_windows` and the service-role-only `check_session_rate_limit_v1` RPC. The private table stores only an HMAC-derived key, project-scoped deployment namespace, fixed-window start time, and count; it never stores raw client addresses, credentials, invitations, or session data. The RPC uses database time and an atomic upsert so concurrent attempts cannot exceed a configured policy. Preview and production namespaces are distinct per Vercel project. A bounded cleanup removes stale windows without a separate scheduler.
