# 0069 Type Safety Policy At Boundaries

## Status

Accepted

## Context

Files, IndexedDB, hash URLs, and worker messages are untrusted boundaries.

## Decision

Use zod validation or narrow type guards at each boundary. No `any` in production code except library type adapters isolated at the boundary.

## Consequences

Bad imports fail with a useful message. TypeScript now represents the app state more honestly.

## Alternatives Considered

Trusting TypeScript interfaces at runtime was rejected because browser storage and imported JSON can be arbitrary.
