# ADR 0006: Realtime is an enhancement

## Decision

The database is the recoverable source of truth; realtime carries only safe aggregate updates.

## Consequence

Refresh/reconnect recovers from persistence and individual votes are never broadcast.
