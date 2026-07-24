# ADR 0004: Server-authoritative decisions

## Decision

The server validates transitions and calculates/finalizes results.

## Consequence

Clients cannot submit winners; finalization must be idempotent and concurrency-safe.
