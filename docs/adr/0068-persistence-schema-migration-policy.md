# 0068 Persistence Schema And Migration Policy

## Status

Accepted

## Context

IndexedDB v1 stored papers and analysis with unsafe `any` schemas. Phase 3 introduces portable state and settings.

## Decision

Use project schema version 2 for persisted and portable state. Loaders accept v1 records and migrate them to v2 by adding default settings and activity metadata.

## Consequences

Old browser projects continue loading. Invalid imports are rejected before mutation.

## Alternatives Considered

Clearing old storage was rejected because user data is private and may be hard to recreate.
