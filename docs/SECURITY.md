# Security

Never commit secrets. Only `NEXT_PUBLIC_*` values may be sent to browser code; `SUPABASE_SERVICE_ROLE_KEY`, provider keys, monitoring auth tokens, Stripe secrets, and webhooks stay server-only.

Every future user-facing table requires RLS and a negative authorization test in the same PR. Use expiring, unguessable invitation tokens, store hashes where practical, rate-limit guessing attempts, validate host permissions and transitions on the server, and avoid broadcasting individual votes, veto identities, private preferences, or raw authorization data.

## Contract-only v1 privacy rules

- Invitation links or token representations may be returned only in the dedicated client-safe invitation response. Persisted invitation-token hashes are server-only and must not enter public room state, realtime payloads, logs, fixtures, or error messages.
- Guests participate with a temporary display name and invitation token. The token is an input to joining; it is not echoed by join responses or included in room state.
- Public room state may include session metadata, display names, roles, readiness, aggregate completion counts, and an aggregate final result. It must reject individual vote values, veto identities, participant preferences, security fields, random seeds, and internal debugging data.
- Individual ballots and private preferences remain server-only until a later explicitly approved participant-private contract is required. Realtime may announce aggregate progress only.
- API errors use a closed machine-readable code enum and safe client copy. They must not expose stack traces, SQL/provider errors, internal exception messages, authorization details, invitation secrets, or credentials.
- Server-only contract fields include invitation-token hashes and decision-engine random seeds. Server endpoints remain responsible for transition validation, authorization, and result finalization.
